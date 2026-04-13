import type { Message } from '@anthropic-ai/sdk/resources/messages'

export function extractClaudeText(message: Message) {
  return message.content
    .filter((block): block is Extract<(typeof message.content)[number], { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}
