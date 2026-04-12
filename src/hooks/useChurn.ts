import useSWR from 'swr'

export function useChurn<T = unknown>(query = '') {
  return useSWR<T>(`/api/churn${query}`)
}
