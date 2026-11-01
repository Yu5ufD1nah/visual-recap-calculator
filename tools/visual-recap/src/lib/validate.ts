import { z } from 'zod'
import type { PrSnapshot, RecapDocumentV1 } from './types'
const short = z.string().max(4000)
const path = z.string().min(1).max(400).refine(x => !x.startsWith('/') && !x.split('/').includes('..') && !/[\x00-\x1f]/.test(x))
const file = z.object({ path, previousPath: path.optional(), status: z.enum(['added','modified','removed','renamed']), additions: z.number().int().nonnegative().max(100000), deletions: z.number().int().nonnegative().max(100000), patch: z.string().max(20000).optional() }).strict()
const schema = z.object({
 version: z.literal(1), source: z.object({ repository: z.string().max(180), number: z.number().int().positive(), headSha: z.string().regex(/^[a-f0-9]{40}$/i), baseSha: z.string().regex(/^[a-f0-9]{40}$/i).optional() }).strict(),
 title: z.string().min(1).max(300).optional(), summary: short,
 nodes: z.array(z.object({ id:z.string().min(1).max(80).regex(/^[\w.-]+$/), label:z.string().min(1).max(160), description:short, files:z.array(path).max(20) }).strict()).max(60),
 edges: z.array(z.object({from:z.string(),to:z.string(),label:z.string().max(160)}).strict()).max(100),
 files:z.array(file).max(120),
 keyChanges:z.array(z.object({path,summary:short,before:z.string().max(12000),after:z.string().max(12000),annotations:z.array(short).max(20)}).strict()).max(8),
 contracts:z.array(z.object({kind:z.enum(['api','schema']),name:z.string().max(200),status:z.enum(['added','modified','removed','renamed']),before:short,after:short,file:path}).strict()).max(40),
 uiStates:z.array(z.object({title:z.string().max(200),before:short,interaction:short,after:short,files:z.array(path).max(20)}).strict()).max(20),
 reviewNotes:z.array(short).max(40), evidenceCompleteness:z.enum(['full','partial']), insightSource:z.enum(['copilot','evidence-only']).optional()
}).strict()
function fail(s: string): never { throw new Error('Invalid recap: ' + s) }
function patchSides(patch = ''): { before:Set<string>; after:Set<string>; beforeChanged:Set<string>; afterChanged:Set<string> } {
 const lines=patch.split('\n')
 const before=new Set(lines.filter(s=>s.startsWith('-')||s.startsWith(' ')).map(s=>s.slice(1).trim()))
 const after=new Set(lines.filter(s=>s.startsWith('+')||s.startsWith(' ')).map(s=>s.slice(1).trim()))
 const beforeChanged=new Set(lines.filter(s=>s.startsWith('-')).map(s=>s.slice(1).trim()))
 const afterChanged=new Set(lines.filter(s=>s.startsWith('+')).map(s=>s.slice(1).trim()))
 return {before,after,beforeChanged,afterChanged}
}
function verifiedExcerpt(excerpt:string,allowed:Set<string>):boolean {
 return excerpt.split('\n').filter(s=>s.trim().length>0).every(s=>allowed.has(s.trim()))
}
function includesChangedExcerpt(excerpt:string,changed:Set<string>):boolean {
 return excerpt.split('\n').some(s=>s.trim().length>0&&changed.has(s.trim()))
}
function isAbsent(value:string):boolean {
 return !value || value==='(absent)' || value==='Not present'
}
function escaped(value:string):string { return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') }
function containsCompleteName(name:string,line:string,kind:'api'|'schema'):boolean {
 // A colon delimits an unquoted YAML/OpenAPI schema key, but remains part of API route tokens.
 const boundary=kind==='schema'?'A-Za-z0-9_$/\.\\-':'A-Za-z0-9_$/.:\\-'
 return new RegExp('(?:^|[^'+boundary+'])'+escaped(name)+'(?:$|[^'+boundary+'])').test(line)
}
function supportedContractName(name:string,lines:Set<string>,kind:'api'|'schema'):boolean {
 if ([...lines].some(line=>containsCompleteName(name,line,kind))) return true
 // Only qualified code symbols may fall back to their final identifier.
 if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/.test(name)) return false
 const suffix=name.split('.').at(-1)!
 const identifier=new RegExp('(?:^|[^A-Za-z0-9_$])'+escaped(suffix)+'(?:$|[^A-Za-z0-9_$])')
 return [...lines].some(line=>identifier.test(line))
}
function renamedContractNames(name:string):[string,string]|undefined {
 const names=name.split(/\s*(?:->|→)\s*/)
 return names.length===2&&names.every(Boolean)?[names[0],names[1]]:undefined
}
export function parseRecap(raw: unknown, snapshot: PrSnapshot): RecapDocumentV1 {
 const result = schema.safeParse(raw)
 if (!result.success) return fail(result.error.issues.slice(0,3).map(x => x.message).join('; '))
 const d = result.data
 if (d.source.repository !== snapshot.repository || d.source.number !== snapshot.number || d.source.headSha !== snapshot.headSha || (d.source.baseSha && d.source.baseSha !== snapshot.baseSha)) fail('source identity mismatch')
 if (d.title !== undefined && d.title !== snapshot.title) fail('PR title does not match trusted snapshot')
 const actual = new Map(snapshot.files.map(f => [f.path,f]))
 const nodes = new Set<string>()
 for (const n of d.nodes) { if (nodes.has(n.id)) fail('duplicate node id'); nodes.add(n.id); for (const p of n.files) if (!actual.has(p)) fail('unknown diagram file') }
 for (const e of d.edges) if (!nodes.has(e.from) || !nodes.has(e.to)) fail('dangling graph edge')
 const shown = new Set(d.files.map(f => f.path))
 if (d.files.length !== snapshot.files.length || shown.size !== snapshot.files.length || snapshot.files.some(f => !shown.has(f.path)) || d.files.some(f => !actual.has(f.path) || actual.get(f.path)?.status !== f.status || actual.get(f.path)?.additions !== f.additions || actual.get(f.path)?.deletions !== f.deletions || actual.get(f.path)?.patch !== f.patch || actual.get(f.path)?.previousPath !== f.previousPath)) fail('changed file mismatch')
 for (const c of d.keyChanges) {
   const file = actual.get(c.path)
   if (!file) fail('unknown key change file')
   const sides=patchSides(file.patch)
   if (!verifiedExcerpt(c.before,sides.before) || !verifiedExcerpt(c.after,sides.after)) fail('code excerpt absent from PR patch')
 }
 for (const c of d.contracts) {
  const file=actual.get(c.file)
  if (!file) fail('unknown contract source')
  const sides=patchSides(file.patch)
  const beforeAbsent=isAbsent(c.before),afterAbsent=isAbsent(c.after)
  if(c.status==='added'){
   if(!beforeAbsent||afterAbsent) fail('contract status/excerpt mismatch')
   if(!supportedContractName(c.name,sides.afterChanged,c.kind)) fail('contract claim unsupported by changed patch side')
   if(supportedContractName(c.name,sides.before,c.kind)) fail('contract status conflicts with opposite patch side')
  }else if(c.status==='removed'){
   if(beforeAbsent||!afterAbsent) fail('contract status/excerpt mismatch')
   if(!supportedContractName(c.name,sides.beforeChanged,c.kind)) fail('contract claim unsupported by changed patch side')
   if(supportedContractName(c.name,sides.after,c.kind)) fail('contract status conflicts with opposite patch side')
  }else if(c.status==='renamed'){
   if(beforeAbsent||afterAbsent) fail('contract status/excerpt mismatch')
   const names=renamedContractNames(c.name)
   if(!names||!supportedContractName(names[0],sides.beforeChanged,c.kind)||!supportedContractName(names[1],sides.afterChanged,c.kind)) fail('renamed contract claim unsupported by changed patch side')
  }else{
   if(beforeAbsent||afterAbsent) fail('contract status/excerpt mismatch')
   if(!supportedContractName(c.name,sides.before,c.kind)||!supportedContractName(c.name,sides.after,c.kind)) fail('contract claim unsupported by patch side')
   if(!includesChangedExcerpt(c.before,sides.beforeChanged)&&!includesChangedExcerpt(c.after,sides.afterChanged)) fail('contract excerpt absent from changed patch side')
  }
  if(!beforeAbsent&&!verifiedExcerpt(c.before,sides.before)) fail('contract excerpt absent from patch')
  if(!afterAbsent&&!verifiedExcerpt(c.after,sides.after)) fail('contract excerpt absent from patch')
 }
 if (snapshot.evidenceCompleteness==='partial' && d.evidenceCompleteness==='full') fail('partial evidence cannot be called full')
 for (const s of d.uiStates) for (const p of s.files) if (!actual.has(p)) fail('unknown UI source')
 const unsafe = /<script\b|<iframe\b|javascript:|data:text\/html|onerror\s*=|<svg\b/i
 const strings = [d.title||'',d.summary,...d.nodes.flatMap(n => [n.label,n.description]),...d.keyChanges.flatMap(c => [c.summary,c.before,c.after,...c.annotations]),...d.contracts.flatMap(c => [c.before,c.after]),...d.uiStates.flatMap(u => [u.before,u.after,u.interaction]),...d.reviewNotes]
 if (strings.some(x => unsafe.test(x))) fail('active content')
 return d
}

