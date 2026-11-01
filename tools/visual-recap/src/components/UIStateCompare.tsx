import type { UIState,Source,ChangedFile } from '../lib/types'
import {evidenceFileUrl} from '../lib/links'
export function UIStateCompare({states,source,files,insightsAvailable=true}:{states:UIState[];source:Source;files:ChangedFile[];insightsAvailable?:boolean}) {
 if(!insightsAvailable)return <p className="empty">Automated Copilot UI insights are unavailable for this evidence-only recap.</p>
 if(!states.length)return <p className="empty">No UI behaviour change evidenced by this PR.</p>
 return <div className="ui-cards"><p className="inferred">Inferred from source code — not an application screenshot</p>{states.map((s,i)=><article key={i} className="ui-card"><h3>{s.title}</h3><div className="state-grid"><div className="mock-screen"><span className="eyebrow">01 · BEFORE</span><div className="mock-widget">{s.before}</div></div><div className="mock-screen"><span className="eyebrow">02 · INTERACTION</span><div className="mock-widget">{s.interaction}</div></div><div className="mock-screen"><span className="eyebrow">03 · AFTER</span><div className="mock-widget">{s.after}</div></div></div><p className="source-list">{s.files.map(p=><a key={p} href={evidenceFileUrl(source,p,files)} target="_blank" rel="noopener noreferrer">{p} ↗ </a>)}</p></article>)}</div>
}

