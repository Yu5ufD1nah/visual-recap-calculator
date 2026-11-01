import { useState,useEffect,useRef } from 'react'
import type { KeyChange,Source,ChangedFile } from '../lib/types'
import { evidenceFileUrl } from '../lib/links'
export function KeyDiffTabs({changes,source,selectedPath,files}:{changes:KeyChange[];source:Source;selectedPath?:string;files:ChangedFile[]}) {
 const [index,setIndex]=useState(0)
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 useEffect(()=>{const i=changes.findIndex(c=>c.path===selectedPath);if(i>=0)setIndex(i)},[selectedPath,changes])
 function select(i:number){setIndex(i);refs.current[i]?.focus()}
 if(!changes.length) return <p className="empty">No focused code excerpts were available for this change.</p>
 const current=changes[Math.min(index,changes.length-1)]
 return <div><div role="tablist" aria-label="Key changed files" className="change-tabs">{changes.map((x,i)=><button role="tab" aria-selected={index===i} tabIndex={index===i?0:-1} ref={el=>{refs.current[i]=el}} key={x.path} onClick={()=>select(i)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select((index+(e.key==='ArrowRight'?1:changes.length-1))%changes.length)}}}>{x.path.split('/').at(-1)}</button>)}</div>
   <div role="tabpanel" className="diff-body"><h3>{current.summary}</h3><a href={evidenceFileUrl(source,current.path,files)} target="_blank" rel="noopener noreferrer">Inspect source on GitHub ↗</a>
    <div className="diff-grid"><div><h4>Before</h4><pre className="code-before"><code>{current.before}</code></pre></div><div><h4>After</h4><pre className="code-after"><code>{current.after}</code></pre></div></div>
    <h4>Review annotations</h4><ul>{current.annotations.map((a,i)=><li key={i}>{a}</li>)}</ul>
   </div></div>
}

