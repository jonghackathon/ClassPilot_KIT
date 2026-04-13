import useSWR from 'swr'

import { fetcher } from '@/lib/fetcher'

export function useAttendance<T = unknown>(query: string | null = '') {
  const key = query === null ? null : `/api/attendance${query}`
  return useSWR<T>(key, fetcher)
}
