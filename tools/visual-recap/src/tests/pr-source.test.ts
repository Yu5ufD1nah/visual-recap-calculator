import {it,expect} from 'vitest'
import {collectSnapshot,assertArtifactMatchesTrustedSnapshot,assertLivePullRequestMatchesSnapshot} from '../lib/pr-source'
const repo='Yu5ufD1nah/visual-recap-calculator',sha='a'.repeat(40),mergeBase='c'.repeat(40)
const pr={number:7,title:'fix',draft:false,user:{type:'User'},head:{sha,repo:{full_name:repo}},base:{sha:'b'.repeat(40)}}
const response=(p:string,files:unknown[])=>({status:200,data:p.includes('/compare/')?{merge_base_commit:{sha:mergeBase}}:p.includes('/files?')?files:pr})
it('collects a source-linked file snapshot with the PR merge base',async()=>{
 const data=await collectSnapshot({get:async p=>response(p,[{filename:'app/a.ts',status:'modified',additions:1,deletions:1,patch:'-x\n+y'}])},repo,7)
 expect(data.headSha).toBe(sha);expect(data.baseSha).toBe(mergeBase);expect(data.files[0].path).toBe('app/a.ts')
})
it('blocks a fork PR',async()=>await expect(collectSnapshot({get:async()=>({status:200,data:{...pr,head:{...pr.head,repo:{full_name:'evil/fork'}}}})},repo,7)).rejects.toThrow(/Ineligible/))
it('blocks excessive diff size',async()=>await expect(collectSnapshot({get:async p=>response(p,Array.from({length:121},(_,i)=>({filename:'a'+i,status:'modified',additions:1,deletions:1})))},repo,7)).rejects.toThrow(/120-file/))
it('fails closed when GitHub does not return a merge base',async()=>await expect(collectSnapshot({get:async p=>p.includes('/compare/')?{status:200,data:{}}:response(p,[])},repo,7)).rejects.toThrow(/merge base/))

it('accepts a live target tip that differs from the stored merge base',()=>{
 const snapshot={repository:repo,number:7,baseSha:mergeBase,headSha:sha,title:'fix',files:[]}
 expect(()=>assertLivePullRequestMatchesSnapshot({...pr,state:'open',base:{sha:'d'.repeat(40)}},snapshot)).not.toThrow()
 expect(()=>assertLivePullRequestMatchesSnapshot({...pr,state:'open',head:{...pr.head,sha:'e'.repeat(40)}},snapshot)).toThrow(/Stale/)
})

it('marks capped or omitted GitHub patches as partial evidence',async()=>{
 const result=await collectSnapshot({get:async p=>response(p,[{filename:'app/a.ts',status:'modified',additions:3,deletions:3,patch:'+'+'x'.repeat(36000)}])},repo,7)
 expect(result.evidenceCompleteness).toBe('partial')
 expect(result.files[0].patch?.length).toBe(20000)
 const missing=await collectSnapshot({get:async p=>response(p,[{filename:'image.png',status:'added',additions:0,deletions:0}])},repo,7)
 expect(missing.evidenceCompleteness).toBe('partial')
})

it('rejects an artifact that fabricates patch evidence despite matching head SHA',async()=>{
 const trusted=await collectSnapshot({get:async p=>response(p,[{filename:'app/a.ts',status:'modified',additions:1,deletions:1,patch:'-old\\n+new'}])},repo,7)
 const forged={...trusted,files:[{...trusted.files[0],patch:'-credential\\n+fabricated'}]}
 expect(()=>assertArtifactMatchesTrustedSnapshot(forged,trusted)).toThrow(/Artifact snapshot/)
})

