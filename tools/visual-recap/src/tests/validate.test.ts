import { describe,it,expect } from 'vitest'
import { parseRecap } from '../lib/validate'
import type { PrSnapshot,RecapDocumentV1 } from '../lib/types'
const sha='a'.repeat(40)
const snap:PrSnapshot={repository:'Yu5ufD1nah/visual-recap-calculator',number:12,baseSha:'b'.repeat(40),headSha:sha,title:'demo',files:[{path:'app/a.ts',status:'modified',additions:1,deletions:1}]}
const doc:RecapDocumentV1={version:1,source:{repository:snap.repository,number:12,headSha:sha},summary:'Updated A',nodes:[{id:'a',label:'A',description:'changed',files:['app/a.ts']}],edges:[],files:snap.files,keyChanges:[],contracts:[],uiStates:[],reviewNotes:[],evidenceCompleteness:'full'}
describe('recap validation',()=>{
 it('accepts exact source evidence',()=>expect(parseRecap(doc,snap).summary).toBe('Updated A'))
 it('rejects stale data',()=>expect(()=>parseRecap({...doc,source:{...doc.source,headSha:'c'.repeat(40)}},snap)).toThrow(/identity/))
 it('rejects duplicate nodes',()=>expect(()=>parseRecap({...doc,nodes:[...doc.nodes,...doc.nodes]},snap)).toThrow(/duplicate/))
 it('rejects duplicate file entries even when every source path is also present',()=>{
  const b={path:'app/b.ts',status:'added' as const,additions:1,deletions:0}
  const many={...snap,files:[snap.files[0],b]}
  expect(()=>parseRecap({...doc,files:[snap.files[0],b,snap.files[0]]},many)).toThrow(/changed file/)
 })
 it('rejects forged diff path',()=>expect(()=>parseRecap({...doc,keyChanges:[{path:'secrets.txt',summary:'x',before:'',after:'',annotations:[]}]},snap)).toThrow(/unknown/))
 it('rejects executable markdown',()=>expect(()=>parseRecap({...doc,summary:'<script>alert(1)</script>'},snap)).toThrow(/active/))
 it('rejects code excerpts absent from the actual patch',()=>expect(()=>parseRecap({...doc,keyChanges:[{path:'app/a.ts',summary:'unsupported',before:'const invented = true',after:'',annotations:[]}]},snap)).toThrow(/excerpt/))
 it('rejects broken connections',()=>expect(()=>parseRecap({...doc,edges:[{from:'a',to:'missing',label:'uses'}]},snap)).toThrow(/dangling/))
})

it('rejects changed patch while keeping matching path and counts',()=>expect(()=>parseRecap({...doc,files:[{...doc.files[0],patch:'@@ -1 +1 @@\n-bad\n+bad'}]},snap)).toThrow(/changed file/))
it('accepts three-dash and three-plus code lines from actual hunk',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n---counter\n+++counter'}]}
 const parsed=parseRecap({...doc,files:ss.files,keyChanges:[{path:'app/a.ts',summary:'counter',before:'--counter',after:'++counter',annotations:[]}]},ss)
 expect(parsed.keyChanges).toHaveLength(1)
})
it('rejects unsupported API claims even from changed paths',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n-old\n+new'}]}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[{kind:'api',name:'POST /invented',status:'added',before:'',after:'new',file:'app/a.ts'}]},ss)).toThrow(/contract claim/)
})
it('rejects dotted routes when only their suffix appears in the patch',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n-old\n+res.json({ok:true})'}]}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[{kind:'api',name:'POST /not-a-real-endpoint.json',status:'added',before:'',after:'res.json({ok:true})',file:'app/a.ts'}]},ss)).toThrow(/contract claim/)
})
it('accepts a bounded suffix match for qualified code symbols',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n-old\n+register(createWidget)'}]}
 const contract={kind:'api' as const,name:'WidgetApi.createWidget',status:'added' as const,before:'',after:'register(createWidget)',file:'app/a.ts'}
 expect(parseRecap({...doc,files:ss.files,contracts:[contract]},ss).contracts).toHaveLength(1)
})
it('rejects route and symbol prefix collisions',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1,2 @@\n-old\n+GET /program/status\n+WidgetApi.createWidgetExtra'}]}
 const route={kind:'api' as const,name:'GET /program',status:'added' as const,before:'',after:'GET /program/status',file:'app/a.ts'}
 const symbol={kind:'api' as const,name:'WidgetApi.createWidget',status:'added' as const,before:'',after:'WidgetApi.createWidgetExtra',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[route]},ss)).toThrow(/contract claim/)
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[symbol]},ss)).toThrow(/contract claim/)
})
it('rejects added and removed contracts supported only by the wrong patch side',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n-GET /removed\n+GET /added'}]}
 const mislabeled={kind:'api' as const,name:'GET /removed',status:'added' as const,before:'',after:'GET /added',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[mislabeled]},ss)).toThrow(/patch side/)
})
it('rejects contract status/excerpt inconsistencies',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n-GET /old\n+GET /new'}]}
 const addedWithBefore={kind:'api' as const,name:'GET /new',status:'added' as const,before:'GET /old',after:'GET /new',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[addedWithBefore]},ss)).toThrow(/status\/excerpt/)
})
it('rejects added and removed contracts supported only by unchanged context',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1,2 +1,2 @@\n GET /existing\n-old detail\n+new detail'}]}
 const added={kind:'api' as const,name:'GET /existing',status:'added' as const,before:'',after:'GET /existing',file:'app/a.ts'}
 const removed={kind:'api' as const,name:'GET /existing',status:'removed' as const,before:'GET /existing',after:'',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[added]},ss)).toThrow(/changed patch side/)
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[removed]},ss)).toThrow(/changed patch side/)
})
it('rejects modified contracts supported only by unchanged context',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1,2 +1,2 @@\n interface Widget {}\n-old unrelated\n+new unrelated'}]}
 const contract={kind:'schema' as const,name:'Widget',status:'modified' as const,before:'interface Widget {}',after:'interface Widget {}',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[contract]},ss)).toThrow(/changed patch side/)
})
it('accepts one-sided field additions and removals as modified contracts',()=>{
 const addedFile={...snap.files[0],patch:'@@ -1,2 +1,3 @@\n interface Widget {\n+newField: string\n }'}
 const addedSnap={...snap,files:[addedFile]}
 const added={kind:'schema' as const,name:'Widget',status:'modified' as const,before:'interface Widget {',after:'interface Widget {\nnewField: string',file:'app/a.ts'}
 expect(parseRecap({...doc,files:[addedFile],contracts:[added]},addedSnap).contracts).toHaveLength(1)
 const removedFile={...snap.files[0],patch:'@@ -1,3 +1,2 @@\n interface Widget {\n-oldField: string\n }'}
 const removedSnap={...snap,files:[removedFile]}
 const removed={kind:'schema' as const,name:'Widget',status:'modified' as const,before:'interface Widget {\noldField: string',after:'interface Widget {',file:'app/a.ts'}
 expect(parseRecap({...doc,files:[removedFile],contracts:[removed]},removedSnap).contracts).toHaveLength(1)
})
it('rejects in-place schema modifications mislabeled as added or removed contracts',()=>{
 const file={...snap.files[0],patch:'@@ -1 +1 @@\n-interface Widget { name: string }\n+interface Widget { name: string; age: number }'}
 const ss={...snap,files:[file]}
 const added={kind:'schema' as const,name:'Widget',status:'added' as const,before:'',after:'interface Widget { name: string; age: number }',file:'app/a.ts'}
 const removed={kind:'schema' as const,name:'Widget',status:'removed' as const,before:'interface Widget { name: string }',after:'',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:[file],contracts:[added]},ss)).toThrow(/opposite patch side/)
 expect(()=>parseRecap({...doc,files:[file],contracts:[removed]},ss)).toThrow(/opposite patch side/)
})
it('accepts unquoted YAML schema keys with trailing colons',()=>{
 const file={...snap.files[0],patch:'@@ -1,2 +1,2 @@\n Widget:\n-old: string\n+new: number'}
 const ss={...snap,files:[file]}
 const contract={kind:'schema' as const,name:'Widget',status:'modified' as const,before:'Widget:\nold: string',after:'Widget:\nnew: number',file:'app/a.ts'}
 expect(parseRecap({...doc,files:[file],contracts:[contract]},ss).contracts).toHaveLength(1)
})
it('rejects contract excerpts taken from the wrong diff side',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1,2 +1,2 @@\n-Widget old\n-old field\n+Widget new\n+new field'}]}
 const contract={kind:'schema' as const,name:'Widget',status:'modified' as const,before:'Widget new\nnew field',after:'Widget old\nold field',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[contract]},ss)).toThrow(/contract excerpt|patch side/)
})
it('accepts multiline contract excerpts on their correct sides',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1,2 +1,2 @@\n-Widget old\n-old field\n+Widget new\n+new field'}]}
 const contract={kind:'schema' as const,name:'Widget',status:'modified' as const,before:'Widget old\nold field',after:'Widget new\nnew field',file:'app/a.ts'}
 expect(parseRecap({...doc,files:ss.files,contracts:[contract]},ss).contracts).toHaveLength(1)
})
it('accepts a renamed contract with explicit old and new names',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n-interface OldWidget {}\n+interface NewWidget {}'}]}
 const contract={kind:'schema' as const,name:'OldWidget -> NewWidget',status:'renamed' as const,before:'interface OldWidget {}',after:'interface NewWidget {}',file:'app/a.ts'}
 expect(parseRecap({...doc,files:ss.files,contracts:[contract]},ss).contracts).toHaveLength(1)
})
it('rejects a renamed contract without side-specific names',()=>{
 const ss={...snap,files:[{...snap.files[0],patch:'@@ -1 +1 @@\n-interface OldWidget {}\n+interface NewWidget {}'}]}
 const contract={kind:'schema' as const,name:'NewWidget',status:'renamed' as const,before:'interface OldWidget {}',after:'interface NewWidget {}',file:'app/a.ts'}
 expect(()=>parseRecap({...doc,files:ss.files,contracts:[contract]},ss)).toThrow(/renamed contract/)
})
it('rejects model claiming full evidence after truncation',()=>{
 const ss={...snap,evidenceCompleteness:'partial' as const}
 expect(()=>parseRecap(doc,ss)).toThrow(/partial evidence/)
})

