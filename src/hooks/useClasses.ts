import useSWR from 'swr'

export function useClasses(query = '') {
  return useSWR(`/api/classes${query}`)
}
