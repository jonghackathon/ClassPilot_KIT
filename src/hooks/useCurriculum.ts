import useSWR from 'swr'

export function useCurriculum<T = unknown>(query = '') {
  return useSWR<T>(`/api/curriculum${query}`)
}
