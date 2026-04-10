import useSWR from 'swr'

export function useAttendance(query = '') {
  return useSWR(`/api/attendance${query}`)
}
