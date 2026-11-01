import type { ChangedFile,PrSnapshot } from './types'
type Response = { status:number; data:unknown }
export interface GitHubApi { get(path:string):Promise<Response> }
export interface LivePullRequest { head?:{sha?:string;repo?:{full_name?:string}}; draft?:boolean; user?:{type?:string}; state?:string; base?:{sha?:string} }
type RawPr={number:number;title:string;draft:boolean;head:{sha:string;repo:{full_name:string}};base:{sha:string};user:{type:string}}
type RawCompare={merge_base_commit?:{sha?:string}}
type RawFile={filename:string;previous_filename?:string;status:string;additions:number;deletions:number;patch?:string}
const statuses:Record<string,ChangedFile['status']>={added:'added',modified:'modified',removed:'removed',deleted:'removed',renamed:'renamed'}
const commit=/^[a-f0-9]{40}$/i
export async function collectSnapshot(api:GitHubApi,repository:string,number:number):Promise<PrSnapshot>{
 if(!/^[\w.-]+\/[\w.-]+$/.test(repository)||!Number.isInteger(number)||number<1)throw Error('Invalid repository or PR')
 const pr=await api.get('/repos/'+repository+'/pulls/'+number)
 if(pr.status!==200)throw Error('Could not fetch PR')
 const data=pr.data as RawPr
 if(data.draft||data.user?.type==='Bot'||data.head?.repo?.full_name!==repository)throw Error('Ineligible PR')
 if(!commit.test(data.head.sha)||!commit.test(data.base.sha))throw Error('Invalid PR commit')
 const comparison=await api.get('/repos/'+repository+'/compare/'+data.base.sha+'...'+data.head.sha)
 const baseSha=(comparison.data as RawCompare)?.merge_base_commit?.sha
 if(comparison.status!==200||!baseSha||!commit.test(baseSha))throw Error('Could not determine PR merge base')
 const files:ChangedFile[]=[]
 let evidenceIncomplete=false
 for(let page=1;page<=2;page++){
  const reply=await api.get('/repos/'+repository+'/pulls/'+number+'/files?per_page=100&page='+page)
  if(reply.status!==200||!Array.isArray(reply.data))throw Error('Could not fetch PR files')
  const rows=reply.data as RawFile[]
  for(const row of rows){
   if(files.length>=120)throw Error('PR exceeds 120-file limit')
   if(!statuses[row.status])throw Error('Unsupported change status: '+row.status)
   // Match the existing recap schema limit; a larger patch remains partial.
   if(!row.patch || row.patch.length>20000) evidenceIncomplete=true
   files.push({path:row.filename,status:statuses[row.status],previousPath:row.previous_filename,additions:row.additions,deletions:row.deletions,patch:row.patch?.slice(0,20000)})
  }
  if(rows.length<100)break
 }
 // The total budget bounds all evidence even when several files reach the schema cap.
 // The publisher recollects this same bounded snapshot before release.
 let budget=36000
 for(const file of files){const original=file.patch||'';const patch=original.slice(0,Math.max(0,budget));if(patch.length!==original.length)evidenceIncomplete=true;budget-=patch.length;file.patch=patch}
 return {repository,number,baseSha,headSha:data.head.sha,title:data.title.slice(0,300),files,evidenceCompleteness:evidenceIncomplete?'partial':'full'}
}

/** The artifact is not an authority for any source path, patch, or source revision. */
export function assertArtifactMatchesTrustedSnapshot(supplied:PrSnapshot,trusted:PrSnapshot):void {
 if(JSON.stringify(supplied)!==JSON.stringify(trusted))throw Error('Artifact snapshot does not match fresh GitHub data')
}

/** The target-branch tip may differ from the PR merge base stored in the snapshot. */
export function assertLivePullRequestMatchesSnapshot(live:LivePullRequest,snapshot:PrSnapshot):void {
 if(live.head?.sha!==snapshot.headSha||live.head?.repo?.full_name!==snapshot.repository||live.draft||live.user?.type==='Bot'||live.state!=='open')throw Error('Stale or ineligible PR')
}

