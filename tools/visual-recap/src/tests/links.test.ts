import {it,expect} from 'vitest'
import {sourceFileUrl,pullRequestUrl,changedFileUrl,evidenceFileUrl} from '../lib/links'
const source={repository:'Yu5ufD1nah/visual-recap-calculator',number:12,headSha:'a'.repeat(40)}
it('links to exact revision',()=>expect(sourceFileUrl(source,'app/a file.ts',12)).toContain('a%20file.ts#L12'))
it('rejects path traversal',()=>expect(()=>sourceFileUrl(source,'../.env')).toThrow())
it('links to PR',()=>expect(pullRequestUrl(source)).toMatch(/pull\/12$/))

it('links deleted and renamed files to appropriate revisions',()=>{
 const withBase={...source,baseSha:'b'.repeat(40)}
 const removed={path:'app/removed.ts',status:'removed' as const,additions:0,deletions:9}
 expect(changedFileUrl(withBase,removed)).toContain('/blob/'+withBase.baseSha+'/app/removed.ts')
 expect(evidenceFileUrl(withBase,removed.path,[removed])).toContain('/blob/'+withBase.baseSha+'/')
 expect(changedFileUrl(source,removed)).toContain('/pull/12/files')
})

it('prefers an exact current path over a rename previous-path alias',()=>{
 const files=[
  {path:'app/a.ts',previousPath:'app/z.ts',status:'renamed' as const,additions:1,deletions:1},
  {path:'app/z.ts',status:'added' as const,additions:3,deletions:0}
 ]
 expect(evidenceFileUrl(source,'app/z.ts',files)).toContain('/blob/'+source.headSha+'/app/z.ts')
})

