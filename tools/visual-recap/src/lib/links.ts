import type { ChangedFile,Source } from './types'
const sha = /^[a-f0-9]{40}$/i
export function sourceFileUrl(source: Source, path: string, line?: number): string {
 if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository) || !sha.test(source.headSha)) throw Error('Untrusted source')
 if (!path || path.startsWith('/') || path.split('/').some(x => x === '..' || x === '') || /[\x00-\x1f]/.test(path)) throw Error('Untrusted path')
 if (line !== undefined && (!Number.isInteger(line) || line < 1)) throw Error('Untrusted line')
 return 'https://github.com/' + source.repository + '/blob/' + source.headSha + '/' + path.split('/').map(encodeURIComponent).join('/') + (line ? '#L' + line : '')
}
export function changedFileUrl(source: Source,file:ChangedFile):string{
 if(file.status==='removed'){
  if(!source.baseSha) return pullRequestUrl(source)+'/files'
  return sourceFileUrl({...source,headSha:source.baseSha},file.previousPath||file.path)
 }
 return sourceFileUrl(source,file.path)
}
export function evidenceFileUrl(source:Source,path:string,files:ChangedFile[]):string{
 // A replacement can reuse a renamed file's previous path. Prefer the exact current path.
 const file=files.find(f=>f.path===path)||files.find(f=>f.previousPath===path)
 return file?changedFileUrl(source,file):pullRequestUrl(source)+'/files'
}
export function pullRequestUrl(source: Source): string {
 if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository) || !Number.isInteger(source.number) || source.number < 1) throw Error('Untrusted PR')
 return 'https://github.com/' + source.repository + '/pull/' + source.number
}

