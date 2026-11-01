import {chromium} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
import {createServer} from 'node:http'
import {join,resolve,relative,extname} from 'node:path'
import type {AddressInfo} from 'node:net'
const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'}
export async function capturePreviews(folder:string):Promise<void>{
 const root=resolve(folder)
 const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname)
  const target=resolve(root,'.'+pathname.replace(/\/$/,'/index.html'))
  if(relative(root,target).startsWith('..')){res.writeHead(403);res.end();return}
  try{const data=await readFile(target);res.setHeader('Content-Type',types[extname(target)]||'application/octet-stream');res.end(data)}
  catch{res.writeHead(404);res.end('Not found')}
 })
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
 let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined
 try{
  const port=(server.address() as AddressInfo).port
  browser=await chromium.launch({headless:true})
  const page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1})
  const failures:string[]=[]
  page.on('pageerror',e=>failures.push(String(e)))
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle'})
  await page.getByRole('heading',{name:'Change impact, made visual.'}).waitFor()
  await page.getByRole('button',{name:'Architecture',exact:true}).click()
  for(const theme of ['dark','light'] as const){
   if(theme==='light')await page.getByRole('button',{name:'Toggle light/dark theme'}).click()
   await page.screenshot({path:join(root,'preview-'+theme+'.png'),animations:'disabled'})
  }
  if(failures.length)throw Error('Viewer error during screenshot: '+failures.join('; '))
  // Keep a conventional image URL that can be embedded in PR comments.
  await writeFile(join(root,'preview.png'),await readFile(join(root,'preview-dark.png')))
 }finally{if(browser)await browser.close();await new Promise<void>(resolve=>server.close(()=>resolve()))}
}
if(process.argv[1]?.endsWith('render-previews.ts'))await capturePreviews(process.env.RECAP_DEST||'site')

