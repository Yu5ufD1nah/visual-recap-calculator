import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {App} from '../App'
import {recapTitle} from '../lib/presentation'
import {buildEvidenceOnlyRecap,generateRecap} from '../lib/copilot'
import {parseRecap} from '../lib/validate'
import type {PrSnapshot} from '../lib/types'
const snapshot:PrSnapshot={repository:'Yu5ufD1nah/visual-recap-calculator',number:1,headSha:'a'.repeat(40),baseSha:'b'.repeat(40),title:'Add keyboard controls to the calculator',files:[]}

it('uses the GitHub PR title in both model and evidence-only recaps',async()=>{
 const generated=await generateRecap(snapshot,async()=>JSON.stringify({summary:'Adds keyboard support.',nodes:[],edges:[],keyChanges:[],contracts:[],uiStates:[],reviewNotes:[]}))
 expect(generated.title).toBe(snapshot.title)
 const fallback=buildEvidenceOnlyRecap(snapshot)
 expect(fallback.title).toBe(snapshot.title)
 expect(()=>parseRecap({...fallback,title:'Fabricated title'},snapshot)).toThrow(/title/)
})
it('cannot accept a model-supplied PR title',async()=>{
 await expect(generateRecap(snapshot,async()=>JSON.stringify({title:'Model title',summary:'Adds keys.'}))).rejects.toThrow(/metadata/)
})
it('renders the PR title as text while retaining legacy recap support',()=>{
 const recap=buildEvidenceOnlyRecap(snapshot)
 expect(renderToStaticMarkup(<App recap={recap}/>)).toContain('<h1>Add keyboard controls to the calculator</h1>')
 const legacy={...recap,title:undefined,summary:'Adds keyboard controls. Further details.'}
 expect(recapTitle(legacy)).toBe('Adds keyboard controls.')
 expect(()=>parseRecap(legacy,snapshot)).not.toThrow()
 const escaped=renderToStaticMarkup(<App recap={{...recap,title:'Add <keys> & shortcuts'}}/>)
 expect(escaped).toContain('Add &lt;keys&gt; &amp; shortcuts')
})
it('renders a dedicated static architecture preview without dashboard controls',()=>{
 const recap=buildEvidenceOnlyRecap(snapshot)
 const html=renderToStaticMarkup(<App recap={recap} preview/>)
 expect(html).toContain('data-testid="architecture-preview"')
 expect(html).toContain(snapshot.title)
 expect(html).toContain('File-change diagram')
 expect(html).not.toContain('Zoom in')
 expect(html).not.toContain('Selected component')
 expect(html).not.toContain('Recap sections')
 expect(html).not.toContain('Focus changes')
})
