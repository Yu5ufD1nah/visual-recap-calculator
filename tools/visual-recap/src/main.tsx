import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import architecture from './fixtures/demo-architecture.json'
import ui from './fixtures/demo-ui-api.json'
import code from './fixtures/demo-code-only.json'
import { parseRecap } from './lib/validate'
import type { RecapDocumentV1,PrSnapshot } from './lib/types'
import {recapTitle} from './lib/presentation'
import './styles.css'

function sourceSnapshot(doc: RecapDocumentV1): PrSnapshot { return {...doc.source,baseSha:doc.source.baseSha||'f'.repeat(40),title:doc.title||'Visual recap',files:doc.files} }
async function load() {
 const params = new URLSearchParams(location.search)
 const fixture = params.get('fixture') || 'architecture'
 // Local demo does not require GitHub, Copilot, Pages or live network credentials.
 const provided = fixture==='ui' ? ui : fixture==='code' ? code : architecture
 let raw:unknown = provided
 if (!import.meta.env.DEV) {
   const response = await fetch('./recap.json', {cache:'no-store'})
   if(!response.ok) throw Error('Published recap.json is missing; refusing to show example data')
   raw=await response.json()
 }
 const d=raw as RecapDocumentV1
 const recap = parseRecap(d,sourceSnapshot(d))
 document.title=recapTitle(recap)+' · Visual Recap'
 createRoot(document.getElementById('root')!).render(<React.StrictMode><App recap={recap} preview={params.get('preview')==='architecture'} initialTheme={params.get('theme')==='light'?'light':'dark'}/></React.StrictMode>)
}
load().catch(error=>{ const el=document.getElementById('root');if(el) el.textContent='Unable to load verified recap: '+String(error) })

