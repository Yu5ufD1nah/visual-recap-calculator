import {readFile,writeFile,appendFile} from 'node:fs/promises'
import {buildEvidenceOnlyRecap} from '../src/lib/copilot'
import {classifySourceBeforeModel} from '../src/lib/release-policy'
import type {PrSnapshot} from '../src/lib/types'
const snapshot=JSON.parse(await readFile('.recap/snapshot.json','utf8')) as PrSnapshot
if(snapshot.repository!=='Yu5ufD1nah/visual-recap-calculator')throw Error('Wrong demo repository')
const screening=classifySourceBeforeModel(snapshot)
if(!screening.allow)throw Error('Source screening denied evidence-only recap')
const recap=buildEvidenceOnlyRecap(snapshot)
recap.summary='Evidence-only demo: verified GitHub file changes. Copilot is not configured in this repository; inferred architecture, contracts and UI behavior are unavailable.'
recap.reviewNotes=recap.reviewNotes.filter(note=>!note.includes('both attempts'))
recap.reviewNotes.unshift('Copilot is not configured. This is an explicitly selected metadata-only demo, not an AI generation success.')
await writeFile('.recap/recap.json',JSON.stringify(recap))
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'### Evidence-only demo\n\nCopilot is not configured. Verified file metadata is published without inferred insights.\n')
console.log('Evidence-only mode: Copilot not configured; '+recap.files.length+' verified files')
