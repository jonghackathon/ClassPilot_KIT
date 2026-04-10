import useSWR from 'swr'

export function useMemoData(query = '') {
  return useSWR(`/api/memo${query}`)
}
