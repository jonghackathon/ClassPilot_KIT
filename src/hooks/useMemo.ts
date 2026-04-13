import useSWR from 'swr'

export function useMemoData<T = unknown>(query = '') {
  return useSWR<T>(`/api/memo${query}`)
}
