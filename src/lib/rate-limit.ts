import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-response'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory rate limiter (per IP, resets per window).
 * Suitable for AI endpoints where per-user throttling is needed.
 * On multi-instance deployments this is per-instance only — use Redis for global limits.
 */
export function rateLimit(
  request: NextRequest,
  options: { limit: number; windowMs: number },
) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const key = `${request.nextUrl.pathname}:${ip}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs })
    return null
  }

  if (entry.count >= options.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return errorResponse('RATE_LIMIT', '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', 429, {
      retryAfter,
    })
  }

  entry.count += 1
  return null
}
