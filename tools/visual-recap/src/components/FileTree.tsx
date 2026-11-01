import { useState } from 'react'
import type { ChangedFile,Source } from '../lib/types'
import { changedFileUrl } from '../lib/links'
export function FileTree({files,source,onSelect}:{files:ChangedFile[];source:Source;onSelect?:(path:string)=>void}) {
 const [search,setSearch]=useState('')
 const [status,setStatus]=useState('all')
 const visible=files.filter(f=>f.path.toLowerCase().includes(search.toLowerCase()) && (status==='all'||f.status===status))
 return <section aria-label="Changed files"><div className="toolbar">
   <label className="sr-only" htmlFor="file-search">Search changed files</label>
   <input id="file-search" placeholder="Filter paths…" type="search" value={search} onChange={e=>setSearch(e.target.value)}/>
   <label className="sr-only" htmlFor="file-status">Change status</label>
   <select id="file-status" value={status} onChange={e=>setStatus(e.target.value)}>
    {['all','added','modified','removed','renamed'].map(x=><option key={x}>{x}</option>)}
   </select></div>
   <ul className="file-list">{visible.map(f=><li key={f.path} className="file-item">
     <span className={'status-pill '+f.status}>{f.status}</span>
     <button onClick={()=>onSelect?.(f.path)} className="file-path" title={'Inspect '+f.path}>{f.path}</button>
     <small className="stat"><span>+{f.additions}</span> −{f.deletions}</small>
     <a href={changedFileUrl(source,f)} target="_blank" rel="noopener noreferrer" aria-label={'Open '+f.path+' in GitHub'}>↗</a>
   </li>)}</ul>
   {visible.length===0?<p className="empty">No matching changed files.</p>:null}
  </section>
}

