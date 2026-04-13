import useSWR from 'swr'

export function useReports<T = unknown>(query = '') {
  return useSWR<T>(`/api/reports${query}`)
}
