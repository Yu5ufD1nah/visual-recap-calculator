import type { ContractChange,Source,ChangedFile } from '../lib/types'
import {evidenceFileUrl} from '../lib/links'
export function ContractChanges({changes,source,files,insightsAvailable=true}:{changes:ContractChange[];source:Source;files:ChangedFile[];insightsAvailable?:boolean}) {
 if(!insightsAvailable)return <p className="empty">Automated Copilot contract insights are unavailable for this evidence-only recap.</p>
 if(!changes.length)return <p className="empty">No API or data contract changes supported by this diff.</p>
 return <div className="contract-grid">{changes.map((c,i)=><article key={i} className="contract-card"><p className="eyebrow">{c.kind} · {c.status}</p><h3>{c.name}</h3><div className="contract-pair"><div><h4>Before</h4><pre>{c.before||'Not present'}</pre></div><div><h4>After</h4><pre>{c.after||'Not present'}</pre></div></div><a href={evidenceFileUrl(source,c.file,files)} target="_blank" rel="noopener noreferrer">Source: {c.file} ↗</a></article>)}</div>
}

