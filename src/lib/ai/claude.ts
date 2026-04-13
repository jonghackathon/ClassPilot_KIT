import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-3-7-sonnet-latest'

let cachedClient: Anthropic | null = null

export function getClaudeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.')
  }

  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey })
  }

  return cachedClient
}

export function getClaudeModel() {
  return DEFAULT_CLAUDE_MODEL
}
