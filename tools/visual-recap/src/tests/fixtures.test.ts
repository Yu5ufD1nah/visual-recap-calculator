import { describe,it,expect } from 'vitest'
import architecture from '../fixtures/demo-architecture.json'
import ui from '../fixtures/demo-ui-api.json'
import code from '../fixtures/demo-code-only.json'
describe('representative independent demos',()=>{it('has three identities',()=>expect(new Set([architecture.source.number,ui.source.number,code.source.number]).size).toBe(3))
it('exercises graph and source files',()=>expect(architecture.edges.length).toBeGreaterThan(1))
it('exercises UI and API',()=>{expect(ui.uiStates.length).toBeGreaterThan(0);expect(ui.contracts.length).toBeGreaterThan(0)})
it('omits ungrounded UI',()=>{expect(code.uiStates).toEqual([]);expect(code.contracts).toEqual([])})})

