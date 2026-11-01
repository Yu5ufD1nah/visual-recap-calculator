/**
 * Copilot CLI --output-format json writes JSONL event envelopes, not a
 * schema-constrained response. Only the final assistant.message is eligible.
 * Never log or serialize the raw stream: it can contain source code or tokens.
 */
export function extractCopilotAnswer(stdout: string): string {
  if (stdout.length > 250000) throw new Error('Copilot CLI output too large')
  const lines = stdout.split(/\r?\n/).filter(line => line.trim().length > 0)
  let lastAnswer: string | undefined
  let events = 0
  for (const line of lines) {
    let envelope: unknown
    try { envelope = JSON.parse(line) } catch {
      // Reject broken framing, rather than accidentally treating a
      // partially parsed JSONL stream as the final answer.
      throw new Error('Copilot CLI returned malformed JSONL')
    }
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
      throw new Error('Copilot CLI returned malformed JSONL')
    }
    const record = envelope as Record<string, unknown>
    if (typeof record.type !== 'string') throw new Error('Copilot CLI returned malformed JSONL')
    events += 1
    if (record.type === 'assistant.message') {
      const data = record.data
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Copilot CLI returned malformed assistant message')
      }
      const content = (data as Record<string, unknown>).content
      if (typeof content !== 'string') {
        throw new Error('Copilot CLI returned malformed assistant message')
      }
      if (!content.trim()) {
        lastAnswer = undefined
        continue
      }
      lastAnswer = content
    }
  }
  if (events === 0 || !lastAnswer) throw new Error('Copilot CLI produced no final assistant message')
  return lastAnswer
}

