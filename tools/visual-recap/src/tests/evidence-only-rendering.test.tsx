import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {ContractChanges} from '../components/ContractChanges'
import {UIStateCompare} from '../components/UIStateCompare'
import {buildEvidenceOnlyRecap} from '../lib/copilot'
import type {PrSnapshot} from '../lib/types'

it('renders unavailable analysis states for evidence-only recaps without no-change conclusions',()=>{
 const snapshot:PrSnapshot={
  repository:'Yu5ufD1nah/visual-recap-calculator',number:91,baseSha:'b'.repeat(40),headSha:'a'.repeat(40),title:'fallback',
  files:[{path:'app/App.tsx',status:'modified',additions:1,deletions:1,patch:'@@ -1 +1 @@\n-old\n+new'}]
 }
 const recap=buildEvidenceOnlyRecap(snapshot)
 expect(recap.insightSource).toBe('evidence-only')
 const contracts=renderToStaticMarkup(<ContractChanges changes={recap.contracts} source={recap.source} files={recap.files} insightsAvailable={recap.insightSource!=='evidence-only'}/>)
 const ui=renderToStaticMarkup(<UIStateCompare states={recap.uiStates} source={recap.source} files={recap.files} insightsAvailable={recap.insightSource!=='evidence-only'}/>)
 expect(contracts).toContain('contract insights are unavailable')
 expect(contracts).not.toContain('No API or data contract changes')
 expect(ui).toContain('UI insights are unavailable')
 expect(ui).not.toContain('No UI behaviour change')
})

