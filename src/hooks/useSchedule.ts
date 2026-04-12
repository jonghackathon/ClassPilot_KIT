import useSWR from 'swr'

export function useSchedule<T = unknown>(query = '') {
  return useSWR<T>(`/api/schedule${query}`)
}
