import {it,expect} from 'vitest'
import {parseRecap} from '../lib/validate'
import type {PrSnapshot,RecapDocumentV1} from '../lib/types'
const source={repository:'Yu5ufD1nah/visual-recap-calculator',number:1,headSha:'a'.repeat(40)}
const snapshot:PrSnapshot={...source,baseSha:'b'.repeat(40),title:'demo',files:[]}
const recap:RecapDocumentV1={version:1,source,summary:'ok',nodes:[],edges:[],files:[],keyChanges:[],contracts:[],uiStates:[],reviewNotes:[],evidenceCompleteness:'full'}
it('rejects forged SHA before trusted publisher uses it',()=>expect(()=>parseRecap({...recap,source:{...source,headSha:'f'.repeat(40)}},snapshot)).toThrow())

