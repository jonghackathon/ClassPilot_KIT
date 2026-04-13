import useSWR from 'swr'

export function useProgress<T = unknown>(query = '') {
  return useSWR<T>(`/api/week-notes${query}`)
}
