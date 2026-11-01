import {it,expect} from 'vitest'
import {upsertRecapComment,recapComment,COMMENT_MARKER} from '../lib/pr-comment'
import type {RecapDocumentV1} from '../lib/types'
const doc:RecapDocumentV1={version:1,source:{repository:'Yu5ufD1nah/visual-recap-calculator',number:7,headSha:'a'.repeat(40)},summary:'A reviewed change',nodes:[],edges:[],files:[],keyChanges:[],contracts:[],uiStates:[],reviewNotes:[],evidenceCompleteness:'full'}
const viewer='https://example.github.io/visual-recap-calculator/recaps/pr-7/'
it('creates preview and link only from safe URL',()=>{expect(recapComment(doc,viewer,viewer+'preview.png')).toContain(COMMENT_MARKER);expect(()=>recapComment(doc,'javascript:alert(1)',viewer)).toThrow()})
it('updates existing bot comment',async()=>{const calls:string[]=[];await upsertRecapComment({list:async()=>[{id:8,body:COMMENT_MARKER,user:{login:'github-actions[bot]'}}],write:async(m)=>{calls.push(m)}},doc,viewer,viewer+'preview.png');expect(calls).toEqual(['PATCH'])})
it('creates if no marker',async()=>{const calls:string[]=[];await upsertRecapComment({list:async()=>[],write:async(m)=>{calls.push(m)}},doc,viewer,viewer+'preview.png');expect(calls).toEqual(['POST'])})

it('finds bot comment on the second GitHub page',async()=>{
 const pages:string[]=[];const writes:string[]=[]
 await upsertRecapComment({list:async p=>{pages.push(p);return p.endsWith('page=1')?Array.from({length:100},(_,i)=>({id:i,body:'noise',user:{login:'human'}})):[{id:991,body:COMMENT_MARKER,user:{login:'github-actions[bot]'}}]},write:async(m)=>{writes.push(m)}},doc,viewer,viewer+'preview.png')
 expect(pages.length).toBe(2);expect(writes).toEqual(['PATCH'])
})

it('stops pagination immediately after finding the bot comment',async()=>{
 const pages:string[]=[]
 await upsertRecapComment({list:async p=>{pages.push(p);return [{id:8,body:COMMENT_MARKER,user:{login:'github-actions[bot]'}},...Array.from({length:99},(_,i)=>({id:i+10,body:'noise'}))]},write:async()=>{}},doc,viewer,viewer+'preview.png')
 expect(pages).toHaveLength(1)
})

