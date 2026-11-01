export const sections=[['overview','Overview'],['architecture','Architecture'],['changes','Key changes'],['files','Files'],['contracts','API / Schema'],['ui','UI states']] as const
export type SectionKey=typeof sections[number][0]
export function SectionNav({active,onChange}:{active:SectionKey;onChange:(key:SectionKey)=>void}){return <nav className="section-nav" aria-label="Recap sections">{sections.map(([id,label])=><button type="button" className={active===id?'active':''} aria-current={active===id?'page':undefined} key={id} onClick={()=>onChange(id)}>{label}</button>)}</nav>}

