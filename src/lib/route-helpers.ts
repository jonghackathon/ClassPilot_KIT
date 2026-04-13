import type { ZodSchema } from 'zod'

import { errorResponse } from './api-response'

type RouteParams = { id: string }

export async function getRouteId(context: { params: Promise<RouteParams> | RouteParams }) {
  const params = await context.params
  return params.id
}

export async function parseRequestBody<T>(request: Request, schema: ZodSchema<T>) {
  const json = await request.json().catch(() => undefined)
  const result = schema.safeParse(json)

  if (!result.success) {
    return {
      data: undefined as T | undefined,
      error: errorResponse('VALIDATION', '입력값이 올바르지 않습니다.', 400, result.error.flatten()),
    }
  }

  return {
    data: result.data,
    error: undefined,
  }
}

export function toDate(value?: string | null) {
  return value ? new Date(value) : null
}

export function searchContains(value?: string | null) {
  const keyword = value?.trim()

  if (!keyword) {
    return undefined
  }

  return {
    contains: keyword,
    mode: 'insensitive' as const,
  }
}

export function getStringArray(searchParams: URLSearchParams, key: string) {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
}
