export type FileStatus = 'added' | 'modified' | 'removed' | 'renamed'
export interface ChangedFile { path: string; previousPath?: string; status: FileStatus; additions: number; deletions: number; patch?: string }
export interface PrSnapshot { repository: string; number: number; baseSha: string; headSha: string; title: string; files: ChangedFile[]; evidenceCompleteness?: 'full' | 'partial' }
export interface Source { repository: string; number: number; headSha: string; baseSha?: string }
export interface GraphNode { id: string; label: string; description: string; files: string[] }
export interface GraphEdge { from: string; to: string; label: string }
export interface KeyChange { path: string; summary: string; before: string; after: string; annotations: string[] }
export interface ContractChange { kind: 'api' | 'schema'; name: string; status: FileStatus; before: string; after: string; file: string }
export interface UIState { title: string; before: string; interaction: string; after: string; files: string[] }
export interface RecapDocumentV1 { version: 1; source: Source; title?: string; insightSource?: 'copilot' | 'evidence-only'; summary: string; nodes: GraphNode[]; edges: GraphEdge[]; files: ChangedFile[]; keyChanges: KeyChange[]; contracts: ContractChange[]; uiStates: UIState[]; reviewNotes: string[]; evidenceCompleteness: 'full' | 'partial' }

