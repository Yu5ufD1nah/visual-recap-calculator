import {readdir,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {upsertRecapComment} from '../src/lib/pr-comment'
import type {RecapDocumentV1} from '../src/lib/types'
import {github} from './github'

const repo='Yu5ufD1nah/visual-recap-calculator'
const root=process.env.SITE_ROOT||''
const pages=(process.env.PAGES_ROOT_URL||'').replace(/\/$/,'')
if(!root||!/^https:\/\/[a-z\d.-]+\.github\.io\/visual-recap-calculator$/i.test(pages))throw Error('Unexpected Pages deployment URL')
const items=await readdir(join(root,'recaps'),{withFileTypes:true})
let checked=0
for(const item of items.filter(x=>x.isDirectory()&&/^pr-\d+$/.test(x.name))){
 const prNumber=Number(item.name.slice(3))
 const recap=JSON.parse(await readFile(join(root,'recaps',item.name,'recap.json'),'utf8')) as RecapDocumentV1
 if(recap.source.repository!==repo||recap.source.number!==prNumber)throw Error('Site recap identity mismatch')
 const result=await github('/repos/'+repo+'/pulls/'+prNumber)
 if(result.status!==200)throw Error('Failed to check current PR '+prNumber)
 const live=result.data as {state:string;head:{sha:string;repo:{full_name:string}}}
 // Never publish an out-of-date comment. New commits will get a new prepared recap.
 if(live.state!=='open'||live.head.sha!==recap.source.headSha||live.head.repo.full_name!==repo)continue
 const viewer=pages+'/recaps/'+item.name+'/'
 await upsertRecapComment({
  list:async path=>{const r=await github(path);if(r.status!==200||!Array.isArray(r.data))throw Error('Cannot read PR comments');return r.data as Array<{id:number;body:string;user?:{login?:string}}>},
  write:async(method,path,body)=>{const r=await github(path,method,body);if(r.status!==200&&r.status!==201)throw Error('Cannot update PR comment (GitHub HTTP '+r.status+')')}
 },recap,viewer,viewer+'preview.png')
 checked++
}
console.log('Reconciled '+checked+' current PR Visual Recap comments')

