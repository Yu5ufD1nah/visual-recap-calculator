import type {RecapDocumentV1} from './types'
/** Legacy documents remain readable; new titles come from trusted GitHub metadata. */
export function recapTitle(recap:RecapDocumentV1):string {
 return recap.title || recap.summary.split(/(?<=[.!?])\s+/)[0].slice(0,160) || 'PR #'+recap.source.number
}
