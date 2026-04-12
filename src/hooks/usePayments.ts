import useSWR from 'swr'

export function usePayments<T = unknown>(query = '') {
  return useSWR<T>(`/api/payments${query}`)
}
