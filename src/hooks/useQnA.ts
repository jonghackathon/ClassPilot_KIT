import useSWR from 'swr'

import { fetcher } from '@/lib/fetcher'

import type { ApiEnvelope, PaginatedData } from '@/components/student/student-data'

function buildUrl(path: string, query?: string) {
  if (!query) {
    return path
  }

  if (query.startsWith('?') || query.startsWith('&')) {
    return `${path}${query}`
  }

  return `${path}?${query}`
}

export function useQnA<T>(query = '') {
  return useSWR<ApiEnvelope<PaginatedData<T>>>(
    buildUrl('/api/qna', query),
    fetcher,
  )
}
