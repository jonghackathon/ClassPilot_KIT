import useSWR from 'swr'

export function useCurriculum(query = '') {
  return useSWR(`/api/curriculum${query}`)
}
