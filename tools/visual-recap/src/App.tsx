import {useState} from 'react'
import type {RecapDocumentV1} from './lib/types'
import {pullRequestUrl} from './lib/links'
import {FileTree} from './components/FileTree'
import {ArchitectureGraph} from './components/ArchitectureGraph'
import {KeyDiffTabs} from './components/KeyDiffTabs'
import {ContractChanges} from './components/ContractChanges'
import {UIStateCompare} from './components/UIStateCompare'
import {SectionNav,type SectionKey} from './components/SectionNav'
export function App({recap}:{recap:RecapDocumentV1}){
 const [active,setActive]=useState<SectionKey>('overview')
 const [selectedFile,setSelectedFile]=useState<string | undefined>()
 const [theme,setTheme]=useState<'dark'|'light'>('dark')
 const pr=pullRequestUrl(recap.source)
 const evidenceOnly=recap.insightSource==='evidence-only'
 return <div className={'app theme-'+theme}>
   <header className="topbar"><div className="brand"><div className="brand-mark">C</div><div><strong>Calculator Lab</strong><small>VISUAL RECAP</small></div></div>
    <div className="top-actions"><span className="sha-chip" title={recap.source.headSha}>{recap.source.headSha.slice(0,7)}</span><button onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label="Toggle light/dark theme">{theme==='dark'?'☀':'☾'}</button><a className="primary-link" href={pr} target="_blank" rel="noopener noreferrer">Back to PR ↗</a></div>
   </header>
   <div className="content"><div className="breadcrumb">GITHUB / {recap.source.repository.toUpperCase()} / PR #{recap.source.number}</div>
   <div className="hero"><div><p className="eyebrow">PULL REQUEST INTELLIGENCE · SOURCE-GROUNDED</p><h1>Change impact, made visual.</h1><p className="hero-summary">{recap.summary}</p></div><div className="hero-badge"><span>{recap.files.length}</span><small>FILES<br/>CHANGED</small></div></div>
   {recap.evidenceCompleteness==='partial'?<p role="status" className="warning">Partial diff evidence. This recap may omit impacts.</p>:null}
   {evidenceOnly?<p role="status" className="warning">Automated Copilot insights are unavailable. File-change evidence is shown without contract, UI, or architectural conclusions.</p>:null}
   <div className="metrics"><div><span>{recap.nodes.length}</span><small>Components mapped</small></div><div><span>{recap.keyChanges.length}</span><small>Focus changes</small></div><div><span>{recap.contracts.length}</span><small>{evidenceOnly?'Contract insights unavailable':'Contract impacts'}</small></div><div><span>{recap.uiStates.length}</span><small>{evidenceOnly?'UI insights unavailable':'UI state sequences'}</small></div></div>
   <SectionNav active={active} onChange={setActive}/>
   <main id="main-content" className="main-panel">
    {active==='overview'&&<><div className="section-head"><div><p className="eyebrow">REVIEW BRIEF</p><h2>What reviewers should know</h2></div><span className="hint">Advisory only · verify code</span></div><div className="overview-grid"><section className="panel"><h3>Summary</h3><p>{recap.summary}</p><button className="inline-action" onClick={()=>setActive('architecture')}>Explore architecture →</button></section><section className="panel"><h3>Review focus</h3>{recap.reviewNotes.length?<ul>{recap.reviewNotes.map((n,i)=><li key={i}>{n}</li>)}</ul>:<p>No specific review risks identified.</p>}<button className="inline-action" onClick={()=>setActive('changes')}>Inspect key changes →</button></section></div><div className="panel preview-section"><div className="section-head"><h3>Change map</h3><button className="inline-action" onClick={()=>setActive('architecture')}>Full explorer →</button></div><ArchitectureGraph nodes={recap.nodes} edges={recap.edges} source={recap.source} files={recap.files}/></div></>}
    {active==='architecture'&&<><div className="section-head"><div><p className="eyebrow">01 / SYSTEM MAP</p><h2>Architecture and relationships</h2></div><span className="hint">Select a node · use +/- to zoom</span></div><ArchitectureGraph nodes={recap.nodes} edges={recap.edges} source={recap.source} files={recap.files}/></>}
    {active==='changes'&&<><div className="section-head"><div><p className="eyebrow">02 / EVIDENCE</p><h2>Annotated code changes</h2></div><span className="hint">Key excerpts · not a substitute for the full diff</span></div><KeyDiffTabs changes={recap.keyChanges} source={recap.source} selectedPath={selectedFile} files={recap.files}/></>}
    {active==='files'&&<><div className="section-head"><div><p className="eyebrow">03 / MODIFIED PATHS</p><h2>Changed files</h2></div></div><FileTree files={recap.files} source={recap.source} onSelect={(path)=>{const index=recap.keyChanges.findIndex(x=>x.path===path);if(index>=0){setSelectedFile(path);setActive('changes')}}}/></>}
    {active==='contracts'&&<><div className="section-head"><div><p className="eyebrow">04 / COMPATIBILITY</p><h2>API and data contracts</h2></div></div><ContractChanges changes={recap.contracts} source={recap.source} files={recap.files} insightsAvailable={!evidenceOnly}/></>}
    {active==='ui'&&<><div className="section-head"><div><p className="eyebrow">05 / USER EXPERIENCE</p><h2>UI before and after</h2></div></div><UIStateCompare states={recap.uiStates} source={recap.source} files={recap.files} insightsAvailable={!evidenceOnly}/></>}
   </main>
   <footer>CALCULATOR LAB · COPILOT-ASSISTED PR RECAP <span>Review aid only. Human code review remains mandatory.</span></footer>
   </div>
 </div>
}

