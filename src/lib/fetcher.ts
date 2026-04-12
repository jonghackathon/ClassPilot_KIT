export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(
      body?.error?.message ?? body?.message ?? 'API 요청에 실패했습니다.',
    ) as Error & {
      status?: number
      info?: unknown
    }

    error.status = response.status
    error.info = body
    throw error
  }

  return response.json()
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(
      body?.error?.message ?? body?.message ?? 'API 요청에 실패했습니다.',
    ) as Error & {
      status?: number
      info?: unknown
    }

    error.status = response.status
    error.info = body
    throw error
  }

  return response.json()
}
