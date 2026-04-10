import useSWR from 'swr'

export function useSchedule(query = '') {
  return useSWR(`/api/schedule${query}`)
}
