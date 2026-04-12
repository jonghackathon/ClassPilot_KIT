import useSWR from 'swr'

export function useUsers<T = unknown>(query = '') {
  return useSWR<T>(`/api/users${query}`)
}
