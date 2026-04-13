import useSWR from 'swr'

export function useClasses<T = unknown>(query = '') {
  return useSWR<T>(`/api/classes${query}`)
}
