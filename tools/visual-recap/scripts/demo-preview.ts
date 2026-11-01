import {spawn} from 'node:child_process'
import {chromium} from '@playwright/test'
import {mkdir} from 'node:fs/promises'
const port=4183
const child=spawn(process.execPath,['./node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined
try{
 let ready=false
 for(let attempt=0;attempt<50;attempt++){
  if(child.exitCode!==null)throw Error('Preview server exited')
  try {const result=await fetch('http://127.0.0.1:'+port+'/');if(result.ok){ready=true;break}}catch{/* server starting */}
  await new Promise(r=>setTimeout(r,200))
 }
 if(!ready)throw Error('Preview server unavailable')
 browser=await chromium.launch()
 const page=await browser.newPage({viewport:{width:1280,height:850}})
 await mkdir('demo-artifacts',{recursive:true})
 for(const [name,fixture] of [['architecture','architecture'],['ui-states','ui']] as const){
  await page.goto('http://127.0.0.1:'+port+'/?fixture='+fixture,{waitUntil:'networkidle'})
  await page.getByRole('heading',{level:1}).waitFor()
  if(fixture==='ui')await page.getByRole('button',{name:'UI states'}).click()
  await page.screenshot({path:'demo-artifacts/'+name+'.png',fullPage:true,animations:'disabled'})
 }
 console.log('Saved deterministic demo screenshots from actual browser render.')
} finally {
 if(browser)await browser.close()
 child.kill('SIGTERM')
}

