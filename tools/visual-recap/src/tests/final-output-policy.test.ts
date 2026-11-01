import {it,expect} from 'vitest'
import {classifyPublication} from '../lib/release-policy'
import type {PrSnapshot,RecapDocumentV1} from '../lib/types'
const source={repository:'Yu5ufD1nah/visual-recap-calculator',number:1,headSha:'a'.repeat(40)}
const snap:PrSnapshot={...source,baseSha:'b'.repeat(40),title:'safe',files:[]}
const doc:RecapDocumentV1={version:1,source,summary:'safe',nodes:[],edges:[],files:[],keyChanges:[],contracts:[],uiStates:[],reviewNotes:[],evidenceCompleteness:'full'}
it('screens final generated markup',()=>expect(classifyPublication(snap,doc,{visibility:'public',publicApproved:true,sourceRepoAllowlist:[source.repository]},'<div>token = ghp_abcdefghijklmnopqrstuvwxyz12345</div>').allow).toBe(false))
it('rejects altered PR SHA',()=>expect(classifyPublication(snap,{...doc,source:{...source,headSha:'d'.repeat(40)}},{visibility:'public',publicApproved:true,sourceRepoAllowlist:[source.repository]}).allow).toBe(false))

