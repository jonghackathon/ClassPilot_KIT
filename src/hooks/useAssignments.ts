import useSWR from 'swr'

export function useAssignments(query = '') {
  return useSWR(`/api/assignments${query}`)
}
