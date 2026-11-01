import { it,expect } from 'vitest'
import { classifyPublication,classifySourceBeforeModel } from '../lib/release-policy'
import type { RecapDocumentV1,PrSnapshot } from '../lib/types'
const source={repository:'Yu5ufD1nah/visual-recap-calculator',number:12,headSha:'a'.repeat(40)}
const snapshot:PrSnapshot={...source,baseSha:'b'.repeat(40),title:'demo',files:[]}
const recap:RecapDocumentV1={version:1,source,summary:'safe test fixture',nodes:[],edges:[],files:[],keyChanges:[],contracts:[],uiStates:[],reviewNotes:[],evidenceCompleteness:'full'}
const policy={visibility:'public' as const,publicApproved:true,sourceRepoAllowlist:[source.repository]}
it('permits Calculator Lab mock content only',()=>expect(classifyPublication(snapshot,recap,policy).allow).toBe(true))
it('rejects external public repo',()=>expect(classifyPublication({...snapshot,repository:'Acme/Private'},recap,policy).allow).toBe(false))
it('rejects leaked token in generated text',()=>expect(classifyPublication(snapshot,{...recap,reviewNotes:['secret = abcdefghijklmnopqrstuvwxyz']},policy).allow).toBe(false))
it('rejects credential JSON nested only in model output',()=>expect(classifyPublication(snapshot,{...recap,reviewNotes:['{"password":"abcdefghijklmnopqrstuvwxyz"}']},policy).allow).toBe(false))
it('rejects missing publication approval',()=>expect(classifyPublication(snapshot,recap,{...policy,publicApproved:false}).allow).toBe(false))
it('rejects incomplete evidence for public',()=>expect(classifyPublication(snapshot,{...recap,evidenceCompleteness:'partial'},policy).allow).toBe(false))

it('blocks sensitive source before Copilot',()=>expect(classifySourceBeforeModel({...snapshot,title:'secret = abcdefghijklmnopqrstuvwxyz'}).allow).toBe(false))

it('rejects JSON quoted password value in source patch',()=>{
 const changed={...snapshot,files:[{path:'config.json',status:'modified' as const,additions:1,deletions:1,patch:'+{"password":"abcdefghijklmnopqrstuvwxyz"}'}]}
 expect(classifySourceBeforeModel(changed).allow).toBe(false)
 expect(classifyPublication(changed,{...recap,files:changed.files},policy).allow).toBe(false)
})

it('rejects credentials appearing only inside decoded recap output',()=>{
 expect(classifyPublication(snapshot,{...recap,reviewNotes:['{"password":"abcdefghijklmnopqrstuvwxyz"}']},policy).allow).toBe(false)
})

it.each([
 ['added','@@ -1 +1,2 @@\n {\n+  "password":\n+    "abcdefghijklmnopqrstuvwxyz"'],
 ['removed','@@ -1,2 +1 @@\n {\n-  "password":\n-    "abcdefghijklmnopqrstuvwxyz"']
])('rejects multiline credentials across %s diff lines',(_side,patch)=>{
 const changed={...snapshot,files:[{path:'config.json',status:'modified' as const,additions:2,deletions:2,patch}]}
 expect(classifySourceBeforeModel(changed).allow).toBe(false)
 expect(classifyPublication(changed,{...recap,files:changed.files},policy).allow).toBe(false)
})


it.each([
 ['opposite quote', '{"password":"ab\'cdefghijklmnopqrstuvwxyz"}'],
 ['escaped delimiter', '{"password":"ab\\\\\"cdefghijklmnopqrstuvwxyz"}']
])('rejects quoted credentials containing an %s in source and generated output',(_case,payload)=>{
 const changed={...snapshot,files:[{path:'config.json',status:'modified' as const,additions:1,deletions:0,patch:'+'+payload}]}
 expect(classifySourceBeforeModel(changed).allow).toBe(false)
 expect(classifyPublication(snapshot,{...recap,reviewNotes:[payload]},policy).allow).toBe(false)
})

it('permits the exact empty-default Copilot env reference in a changed script',()=>{
 const changed={...snapshot,files:[{path:'tools/visual-recap/scripts/generate-recap.ts',status:'modified' as const,additions:1,deletions:1,patch:"@@ -1 +1 @@\n- const env={COPILOT_GITHUB_TOKEN:process.env.COPILOT_GITHUB_TOKEN||''}\n+ const env={COPILOT_GITHUB_TOKEN:process.env.COPILOT_GITHUB_TOKEN||''}"}]}
 expect(classifySourceBeforeModel(changed).allow).toBe(true)
 expect(classifyPublication(changed,{...recap,files:changed.files},policy).allow).toBe(true)
})
it('does not exempt literal credentials or nonempty Copilot env fallbacks',()=>{
 const key='COPILOT_GITHUB_TOKEN'
 const value='abcdefghijklmnopqrstuvwxyz'
 const colon=':'
 for(const assignment of [
  key+colon+"process.env.COPILOT_GITHUB_TOKEN||'"+value+"'",
  key+colon+"'"+value+"'",
  'token'+colon+" '"+value+"'"
 ]){
  const changed={...snapshot,files:[{path:'src/config.ts',status:'modified' as const,additions:1,deletions:0,patch:'+'+assignment}]}
  expect(classifySourceBeforeModel(changed).allow).toBe(false)
 }
})

