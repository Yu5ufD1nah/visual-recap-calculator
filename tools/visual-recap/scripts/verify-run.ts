import {readFile,writeFile} from 'node:fs/promises'
import {parseRecap} from '../src/lib/validate'
import {classifyPublication,classifySourceBeforeModel} from '../src/lib/release-policy'
import {collectSnapshot,assertArtifactMatchesTrustedSnapshot,assertLivePullRequestMatchesSnapshot} from '../src/lib/pr-source'
import {github} from './github'
import type {PrSnapshot} from '../src/lib/types'
const repo='Yu5ufD1nah/visual-recap-calculator'
const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH||'', 'utf8'))
const run=event.workflow_run
if(event.repository?.full_name!==repo||run?.event!=='pull_request'||run?.name!=='PR Visual Recap'||run?.conclusion!=='success'||run?.head_repository?.full_name!==repo)throw Error('Untrusted workflow provenance')
const supplied=JSON.parse(await readFile('.recap/snapshot.json','utf8')) as PrSnapshot
if(supplied.repository!==repo||!Number.isInteger(supplied.number)||supplied.number<1||!run.pull_requests?.some((p:{number:number})=>p.number===supplied.number))throw Error('Artifact is not associated with originating PR')
const current=await github('/repos/'+repo+'/pulls/'+supplied.number)
const live=current.data as {head?:{sha:string;repo?:{full_name:string}};base?:{sha:string};draft?:boolean;user?:{type:string};state?:string}
if(current.status!==200)throw Error('Could not fetch PR')
assertLivePullRequestMatchesSnapshot(live,supplied)
const linked=run.pull_requests.find((p:{number:number})=>p.number===supplied.number)
if(linked.head?.sha && linked.head.sha!==supplied.headSha)throw Error('Workflow run source commit does not match PR head')
// Never use artifact-provided patches as authoritative evidence.
const snapshot=await collectSnapshot({get:path=>github(path)},repo,supplied.number)
if(snapshot.headSha!==supplied.headSha||snapshot.baseSha!==supplied.baseSha)throw Error('PR changed during trusted collection')
assertArtifactMatchesTrustedSnapshot(supplied,snapshot)
const screening=classifySourceBeforeModel(snapshot)
if(!screening.allow)throw Error('Source contains sensitive content: '+screening.reason)
const recap=parseRecap(JSON.parse(await readFile('.recap/recap.json','utf8')),snapshot)
const release=classifyPublication(snapshot,recap,{visibility:'public',publicApproved:process.env.PUBLIC_RECAP_APPROVED==='true',sourceRepoAllowlist:[repo]})
if(!release.allow)throw Error('Publication denied: '+release.reason)
await writeFile('.recap/snapshot.json',JSON.stringify(snapshot))
await writeFile('.recap/recap.json',JSON.stringify(recap))
console.log('Verified trusted GitHub patch data for PR #'+snapshot.number+' at '+snapshot.headSha)

