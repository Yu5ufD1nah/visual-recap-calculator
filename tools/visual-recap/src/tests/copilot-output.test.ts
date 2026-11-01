import {expect,it} from 'vitest'
import {extractCopilotAnswer} from '../lib/copilot-output'

const event=(type:string,data:unknown)=>JSON.stringify({type,data})

it('extracts only the final assistant response from Copilot JSONL events',()=>{
 const transcript=[
  event('session.start',{sessionId:'ignored'}),
  event('user.message',{content:'untrusted prompt that must never become recap content'}),
  event('assistant.message',{content:'first answer'}),
  event('assistant.message',{content:'{\"summary\":\"final answer\"}' }),
  event('session.shutdown',{codeChanges:{}})
 ].join('\n')
 expect(extractCopilotAnswer(transcript)).toBe('{"summary":"final answer"}')
})

it('never reuses an earlier answer when the final assistant event is unusable',()=>{
 const valid=event('assistant.message',{content:'earlier answer'})
 expect(()=>extractCopilotAnswer(valid+'\n'+event('assistant.message',{}))).toThrow(/malformed assistant message/)
 expect(()=>extractCopilotAnswer(valid+'\n'+event('assistant.message',{content:42}))).toThrow(/malformed assistant message/)
 expect(()=>extractCopilotAnswer(valid+'\n'+event('assistant.message',{content:'   '}))).toThrow(/no final assistant message/)
})

it('handles escaped newlines, braces and quoted fields inside assistant content',()=>{
 const answer=JSON.stringify({summary:'complex } text with \"quotes\"\nnewline'})
 expect(extractCopilotAnswer(event('assistant.message',{content:answer}))).toBe(answer)
})

it('rejects an empty output or progress-only transcript without echoing its data',()=>{
 expect(()=>extractCopilotAnswer('')).toThrow(/no final assistant/)
 expect(()=>extractCopilotAnswer(event('user.message',{content:'PRIVATE-CONTENT'}))).toThrow(/no final assistant/)
})

it('rejects malformed JSONL and does not misread partial model output as its final response',()=>{
 expect(()=>extractCopilotAnswer(event('assistant.message',{content:'ok'})+'\n{broken')).toThrow(/malformed JSONL/)
 expect(()=>extractCopilotAnswer('not json')).toThrow(/malformed JSONL/)
})

it('rejects model-like output from untrusted event types',()=>{
 expect(()=>extractCopilotAnswer(event('tool.execution_complete',{content:'{\"summary\":\"untrusted\"}'}))).toThrow(/no final assistant/)
})

it('bounds the output stream size and does not include it in errors',()=>{
 expect(()=>extractCopilotAnswer('x'.repeat(250001))).toThrow('Copilot CLI output too large')
})

