import type { RecapDocumentV1 } from './types'
import {pullRequestUrl} from './links'
export const COMMENT_MARKER='<!-- walle-visual-recap-v2 -->'
export interface CommentApi { list(path:string):Promise<Array<{id:number;body:string;user?:{type?:string;login?:string}}>>; write(method:'POST'|'PATCH',path:string,body:{body:string}):Promise<void> }
export function recapComment(recap:RecapDocumentV1,viewerUrl:string,previewUrl:string):string {
 for(const url of [viewerUrl,previewUrl])if(!/^https:\/\/[-\w.]+(?:\/[-\w.%]+)*\/?$/.test(url))throw Error('Unsafe hosted URL')
 const pr=pullRequestUrl(recap.source)
 return [COMMENT_MARKER,'### Architecture diagram', '', '['+'![Static architecture diagram preview]('+previewUrl+')'+']('+viewerUrl+')','', 'Static preview — open the linked viewer for interactive diagrams, diffs and source navigation.', '', '**[Open interactive recap]('+viewerUrl+')**', '', '**Source:** [PR #'+recap.source.number+']('+pr+') · revision `'+recap.source.headSha.slice(0,12)+'`', '',recap.summary.replace(/[\[\]<>]/g,''), '', '> Source-grounded review aid; evidence-only mode omits AI insights. Verify against the real diff; human review remains required.'].join('\n')
}
export async function upsertRecapComment(api:CommentApi,recap:RecapDocumentV1,viewerUrl:string,previewUrl:string){
 let match:{id:number;body:string;user?:{type?:string;login?:string}}|undefined
 for(let page=1;page<=50;page++){
  const batch=await api.list('/repos/'+recap.source.repository+'/issues/'+recap.source.number+'/comments?per_page=100&page='+page)
  match=batch.find(x=>x.body?.includes(COMMENT_MARKER)&&x.user?.login==='github-actions[bot]')
  if(match||batch.length<100)break
  if(page===50)throw Error('Comment pagination limit reached')
 }
 const body={body:recapComment(recap,viewerUrl,previewUrl)}
 if(match)await api.write('PATCH','/repos/'+recap.source.repository+'/issues/comments/'+match.id,body)
 else await api.write('POST','/repos/'+recap.source.repository+'/issues/'+recap.source.number+'/comments',body)
}

