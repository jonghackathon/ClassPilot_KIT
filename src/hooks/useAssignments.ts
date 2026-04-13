import useSWR from 'swr'

export function useAssignments<T = unknown>(query = '') {
  return useSWR<T>(`/api/assignments${query}`)
}
