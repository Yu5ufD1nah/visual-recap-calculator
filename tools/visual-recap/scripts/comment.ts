import {readFile} from 'node:fs/promises'
import type {RecapDocumentV1} from '../src/lib/types'
import {upsertRecapComment} from '../src/lib/pr-comment'
import {github} from './github'
const recap=JSON.parse(await readFile('.recap/recap.json','utf8')) as RecapDocumentV1
const viewer=process.env.VIEWER_URL||''
if(!viewer||!viewer.startsWith('https://'))throw Error('Published Pages URL missing')
await upsertRecapComment({
 list:async(path)=>{const result=await github(path);if(result.status!==200||!Array.isArray(result.data))throw Error('Cannot enumerate PR comments');return result.data as Array<{id:number;body:string;user?:{login?:string}}>},
 write:async(method,path,body)=>{const r=await github(path,method,body);if(r.status!==200&&r.status!==201)throw Error('Could not publish recap comment')}
},recap,viewer,viewer+'preview.png')
console.log('Reviewer comment updated for PR #'+recap.source.number)

