import useSWR from 'swr'

export function useAttendance<T = unknown>(query?: string | null) {
  if (query === null) {
    return useSWR<T>(null)
  }

  return useSWR<T>(`/api/attendance${query ?? ''}`)
}
