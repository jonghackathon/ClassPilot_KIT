import useSWR from 'swr'

export function usePayments(query = '') {
  return useSWR(`/api/payments${query}`)
}
