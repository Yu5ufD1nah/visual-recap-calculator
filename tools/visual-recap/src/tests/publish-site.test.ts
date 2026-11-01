import {it,expect} from 'vitest'
import {mkdtemp,writeFile,readFile,mkdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {stageRecap} from '../../scripts/publish-site'
import type {PrSnapshot,RecapDocumentV1} from '../lib/types'
const source={repository:'Yu5ufD1nah/visual-recap-calculator',number:1,headSha:'a'.repeat(40)}
const snap:PrSnapshot={...source,title:'x',baseSha:'b'.repeat(40),files:[]}
const doc:RecapDocumentV1={version:1,source,summary:'safe',nodes:[],edges:[],files:[],keyChanges:[],contracts:[],uiStates:[],reviewNotes:[],evidenceCompleteness:'full'}
it('retains earlier PR pages',async()=>{
 const root=await mkdtemp(join(tmpdir(),'walle-pages-')),asset=join(root,'assets'),site=join(root,'site')
 await mkdir(asset);await writeFile(join(asset,'index.html'),'<html>safe</html>')
 await stageRecap(site,asset,snap,doc);await stageRecap(site,asset,{...snap,number:2},{...doc,source:{...source,number:2}})
 expect((await readFile(join(site,'recaps','index.html'),'utf8'))).toContain('pr-1')
 expect((await readFile(join(site,'recaps','index.html'),'utf8'))).toContain('pr-2')
})
it('rejects non Calculator Lab source',async()=>{
 await expect(stageRecap('/tmp/unused','/tmp/unused',{...snap,repository:'Other/Private'},doc)).rejects.toThrow()
})

