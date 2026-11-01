import { useMemo,useState,useRef } from 'react'
import type { GraphNode,GraphEdge,Source,ChangedFile } from '../lib/types'
import { evidenceFileUrl } from '../lib/links'
export function ArchitectureGraph({nodes,edges,source,files}:{nodes:GraphNode[];edges:GraphEdge[];source:Source;files:ChangedFile[]}) {
 const [selected,setSelected]=useState(nodes[0]?.id||'')
 const [zoom,setZoom]=useState(1)
 const [pan,setPan]=useState({x:0,y:0})
 function movePan(x:number,y:number){setPan(p=>({x:p.x+x,y:p.y+y}))}
 const origin=useRef<{x:number;y:number;px:number;py:number}|null>(null)
 const layout=useMemo(()=>Object.fromEntries(nodes.map((n,i)=>[n.id,{x:90+(i%3)*235,y:90+Math.floor(i/3)*140}])),[nodes])
 const focus=nodes.find(n=>n.id===selected)
 const connected=new Set([selected,...edges.filter(e=>e.from===selected||e.to===selected).flatMap(e=>[e.from,e.to])])
 function moveScale(n:number){setZoom(z=>Math.min(2.4,Math.max(0.6,Math.round((z+n)*10)/10)))}
 return <div className="graph-layout">
   <div className="graph-frame" aria-label="Interactive architecture diagram">
     <div className="graph-actions"><button onClick={()=>moveScale(.2)} aria-label="Zoom in">+</button><button onClick={()=>moveScale(-.2)} aria-label="Zoom out">−</button><button onClick={()=>movePan(-70,0)} aria-label="Pan left">←</button><button onClick={()=>movePan(70,0)} aria-label="Pan right">→</button><button onClick={()=>movePan(0,-70)} aria-label="Pan up">↑</button><button onClick={()=>movePan(0,70)} aria-label="Pan down">↓</button><button onClick={()=>{setZoom(1);setPan({x:0,y:0})}}>Reset</button></div>
     {nodes.length===0?<p className="empty">No supported component relationships for this change.</p>:<svg viewBox="0 0 790 430" role="group" aria-label="Components and their relationships" onWheel={e=>{if(e.ctrlKey){e.preventDefault();moveScale(e.deltaY>0?-.1:.1)}}} onPointerDown={e=>{if(e.target===e.currentTarget){origin.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};e.currentTarget.setPointerCapture(e.pointerId)}}} onPointerMove={e=>{if(origin.current){setPan({x:origin.current.px+e.clientX-origin.current.x,y:origin.current.py+e.clientY-origin.current.y})}}} onPointerUp={()=>origin.current=null}>
      <g transform={'translate('+pan.x+' '+pan.y+') scale('+zoom+')'}>
       {edges.map((e,i)=>{const a=layout[e.from],b=layout[e.to];return a&&b?<g key={i} opacity={connected.has(e.from)&&connected.has(e.to)?1:.25}><line x1={a.x+78} y1={a.y+24} x2={b.x+78} y2={b.y+24} stroke="#6a92bb" strokeWidth="2"/><title>{e.label}</title></g>:null})}
       {nodes.map(n=>{const p=layout[n.id];return <g role="button" tabIndex={0} aria-label={'Select component '+n.label} aria-pressed={selected===n.id} key={n.id} transform={'translate('+p.x+' '+p.y+')'} onClick={()=>setSelected(n.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(n.id)}}} opacity={connected.has(n.id)?1:.4} className="graph-node">
          <rect rx="12" width="156" height="52" fill={selected===n.id?'#0e7490':'#243951'} stroke={selected===n.id?'#67e8f9':'#486887'} strokeWidth="2"/>
          <text x="78" y="31" textAnchor="middle" fill="#f0f9ff" fontSize="13">{n.label.slice(0,20)}</text>
         </g>})}
      </g>
     </svg>}
   </div>
   <aside className="detail-pane" aria-live="polite">{focus?<><span className="eyebrow">Selected component</span><h3>{focus.label}</h3><p>{focus.description}</p><h4>Evidence</h4><ul>{focus.files.map(p=><li key={p}><a href={evidenceFileUrl(source,p,files)} target="_blank" rel="noopener noreferrer">{p} ↗</a></li>)}</ul><h4>Relationships</h4><ul>{edges.filter(e=>e.from===focus.id||e.to===focus.id).map((e,i)=><li key={i}>{e.from===focus.id?'→':'←'} {e.label} · {nodes.find(n=>n.id===(e.from===focus.id?e.to:e.from))?.label}</li>)}</ul></>:<p className="empty">Select a component to explore impact and source evidence.</p>}</aside>
 </div>
}

