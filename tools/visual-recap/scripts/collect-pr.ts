import {writeFile,mkdir} from 'node:fs/promises'
import {collectSnapshot} from '../src/lib/pr-source'
import {github} from './github'
import {classifySourceBeforeModel} from '../src/lib/release-policy'
const repo=process.env.TARGET_REPO||''
const pr=Number(process.env.PR_NUMBER)
const snapshot=await collectSnapshot({get:path=>github(path)},repo,pr)
const screening=classifySourceBeforeModel(snapshot)
if(!screening.allow)throw Error('Source screening blocked Copilot analysis: '+screening.reason)
await mkdir('.recap',{recursive:true})
await writeFile('.recap/snapshot.json',JSON.stringify(snapshot))
console.log('Collected '+snapshot.files.length+' files at '+snapshot.headSha.slice(0,8))

