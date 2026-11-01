import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {parseRecap} from '../src/lib/validate'
import {classifyPublication} from '../src/lib/release-policy'
import type {PrSnapshot,RecapDocumentV1} from '../src/lib/types'
export async function stageRecap(siteRoot:string,assetDir:string,snapshot:PrSnapshot,recap:RecapDocumentV1):Promise<string>{
 const doc=parseRecap(recap,snapshot)
 if(snapshot.repository!=='Yu5ufD1nah/visual-recap-calculator')throw Error('Calculator Lab-only public site')
 const html=await readFile(join(assetDir,'index.html'),'utf8')
 const check=classifyPublication(snapshot,doc,{visibility:'public',publicApproved:true,sourceRepoAllowlist:['Yu5ufD1nah/visual-recap-calculator']},html)
 if(!check.allow)throw Error('Final output denied: '+check.reason)
 const root=resolve(siteRoot),page=join(root,'recaps','pr-'+snapshot.number)
 await mkdir(page,{recursive:true})
 // Copy only the trusted compiled viewer, never a repository checkout or untrusted PR scripts.
 await cp(assetDir,page,{recursive:true,force:true,filter:s=>!(/(^|\/)node_modules\//.test(s))})
 await writeFile(join(page,'recap.json'),JSON.stringify(doc))
 await writeFile(join(root,'.nojekyll'),'')
 const dirs=await readdir(join(root,'recaps'),{withFileTypes:true})
 const pages=dirs.filter(x=>x.isDirectory()&&/^pr-\d+$/.test(x.name)).map(x=>x.name).sort((a,b)=>Number(a.slice(3))-Number(b.slice(3)))
 await writeFile(join(root,'recaps','index.html'),['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calculator Lab Visual Recaps</title><body><h1>Calculator Lab · PR Visual Recaps</h1><p>Public test-project review aids, not merge approvals.</p><ul>',...pages.map(p=>'<li><a href="./'+p+'/">PR #'+p.slice(3)+'</a></li>'),'</ul></body></html>'].join('\n'))
 return page
}
if(process.argv[1]?.endsWith('publish-site.ts')){
 const snapshot=JSON.parse(await readFile('.recap/snapshot.json','utf8')) as PrSnapshot
 const recap=JSON.parse(await readFile('.recap/recap.json','utf8')) as RecapDocumentV1
 const dest=await stageRecap(process.env.PAGES_ROOT||'site',process.env.VIEWER_ASSETS||'.recap/web',snapshot,recap)
 console.log('Staged '+dest)
}

