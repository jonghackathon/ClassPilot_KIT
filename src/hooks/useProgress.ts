import useSWR from 'swr'

export function useProgress(query = '') {
  return useSWR(`/api/week-notes${query}`)
}
