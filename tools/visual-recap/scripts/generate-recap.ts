import {appendFile,readFile,writeFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {generateRecapWithFallback} from '../src/lib/copilot'
import {extractCopilotAnswer} from '../src/lib/copilot-output'
import type {PrSnapshot} from '../src/lib/types'
const snapshot=JSON.parse(await readFile('.recap/snapshot.json','utf8')) as PrSnapshot
if(!process.env.COPILOT_GITHUB_TOKEN)throw Error('COPILOT_GITHUB_TOKEN not configured')
const generated=await generateRecapWithFallback(snapshot,prompt=>new Promise<string>((resolve,reject)=>{
 const child=spawn('copilot',['-p',prompt,'--output-format=json','--no-ask-user','--no-auto-update','--no-custom-instructions','--disable-builtin-mcps','--excluded-tools=task,ask_user,web_fetch,create,edit,view,bash,glob,grep','--deny-tool=shell,read,write,url,memory','--secret-env-vars=COPILOT_GITHUB_TOKEN'],{env:{PATH:process.env.PATH||'',HOME:process.env.HOME||'',COPILOT_GITHUB_TOKEN:process.env.COPILOT_GITHUB_TOKEN||'',CI:'true'},stdio:['ignore','pipe','pipe']})
 let stdout='',stderrChars=0
 const timeout=setTimeout(()=>child.kill('SIGKILL'),600000)
 child.stdout.on('data',b=>{stdout+=String(b);if(stdout.length>250000)child.kill('SIGKILL')})
 child.stderr.on('data',b=>{stderrChars+=String(b).length})
 child.on('error',e=>{clearTimeout(timeout);reject(e)})
 child.on('exit',code=>{clearTimeout(timeout);if(code===0){try{resolve(extractCopilotAnswer(stdout))}catch(error){reject(error)}}else reject(Error('Copilot failed (exit '+code+'; stderr chars '+stderrChars+')'))})
}),diagnostic=>console.log('Copilot recap attempt '+diagnostic.attempt+': '+diagnostic.outcome+' (response chars: '+diagnostic.responseChars+')'))
if(generated.source==='evidence-only'){
 console.log('::warning title=Evidence-only Visual Recap::Both Copilot responses failed content validation. The recap uses verified GitHub file metadata only; no AI insight claims were published.')
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'### Visual Recap: evidence-only fallback\n\nCopilot did not return valid insights after two attempts. The recap includes **verified changed-file metadata only**; no model-derived architecture or UI claims are shown.\n')
}
const result=generated.recap
result.source.baseSha=snapshot.baseSha
await writeFile('.recap/recap.json',JSON.stringify(result))
console.log('Recap source: '+generated.source+'; '+result.nodes.length+' diagram nodes')

