import type { PrSnapshot, RecapDocumentV1 } from './types'
export interface PublishPolicy { visibility: 'public'|'private'; sourceRepoAllowlist: string[]; publicApproved: boolean }
export type PublicationDecision = { allow: boolean; reason: string }
const credential = /(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:password|api[_-]?key|secret|token)\s*[:=]\s*['"]?\S{10,})/i
const quotedCredential = /(["'])(?:password|api[_-]?key|secret|token)\1\s*:\s*(["'])((?:\\.|(?!\2)[\s\S]){10,})/i
const sensitive = /(?:child(?:ren)?\s+(?:name|address|phone)|student\s+(?:email|record)|customer\s+(?:email|address)|private\s+key|production\s+credential)/i
function decodedStrings(value: unknown): string[] {
 if (typeof value === 'string') return [value]
 if (Array.isArray(value)) return value.flatMap(decodedStrings)
 if (value && typeof value === 'object') return Object.values(value).flatMap(decodedStrings)
 return []
}
function reconstructedPatchSides(patch = ''): string[] {
 const before:string[]=[]
 const after:string[]=[]
 for (const line of patch.split('\n')) {
  if (line.startsWith('@@') || line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) continue
  if (line.startsWith('-')) before.push(line.slice(1))
  else if (line.startsWith('+')) after.push(line.slice(1))
  else if (line.startsWith(' ')) { before.push(line.slice(1)); after.push(line.slice(1)) }
 }
 return [before.join('\n'),after.join('\n')]
}
// Match only a source-code reference to the injected Copilot env var with an
// empty literal default. It is not a credential value. Do not exempt arbitrary
// env expressions or nonempty fallback strings: those remain subject to scans.
function normalizeKnownNonSecretReference(value: string): string {
 return value.replace(/\bCOPILOT_GITHUB_TOKEN\s*:\s*process\.env\.COPILOT_GITHUB_TOKEN\s*\|\|\s*''(?=\s*[,}])/g,'COPILOT_ENV_REFERENCE')
}
function unsafeText(values: string[]): boolean {
 return values.some(value => {
  const checked=normalizeKnownNonSecretReference(value)
  return credential.test(checked) || quotedCredential.test(checked) || sensitive.test(checked)
 })
}
function snapshotStrings(snapshot:PrSnapshot):string[] {
 return [snapshot.title,...snapshot.files.flatMap(f=>[f.path,f.previousPath||'',f.patch||'',...reconstructedPatchSides(f.patch)])]
}
export function classifySourceBeforeModel(snapshot: PrSnapshot): PublicationDecision {
 if(snapshot.repository!=='Yu5ufD1nah/visual-recap-calculator') return {allow:false,reason:'wrong source repository'}
 if(unsafeText(snapshotStrings(snapshot)))return {allow:false,reason:'potential sensitive PR content'}
 return {allow:true,reason:'no sensitive signatures detected'}
}
export function classifyPublication(snapshot: PrSnapshot, recap: RecapDocumentV1, policy: PublishPolicy, finalHtml = ''): PublicationDecision {
 if (recap.source.repository !== snapshot.repository || recap.source.headSha !== snapshot.headSha || recap.source.number !== snapshot.number) return {allow:false,reason:'stale or wrong source'}
 if (policy.visibility === 'public' && (snapshot.repository !== 'Yu5ufD1nah/visual-recap-calculator' || !policy.publicApproved || !policy.sourceRepoAllowlist.includes(snapshot.repository))) return {allow:false,reason:'public publication not authorized'}
 if (policy.visibility === 'private' && !policy.sourceRepoAllowlist.includes(snapshot.repository)) return {allow:false,reason:'private repository not allowlisted'}
 // Scan reconstructed before/after hunks and decoded model strings: diff/JSON escaping must not hide key/value signatures.
 const values=[...snapshotStrings(snapshot),...decodedStrings(recap),finalHtml]
 if (unsafeText(values)) return {allow:false,reason:'potential secret or sensitive content'}
 if (policy.visibility === 'public' && (snapshot.evidenceCompleteness === 'partial' || recap.evidenceCompleteness === 'partial')) return {allow:false,reason:'incomplete public recap requires human review'}
 return {allow:true,reason:'approved by configured policy and screening'}
}

