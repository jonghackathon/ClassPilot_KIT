import useSWR from 'swr'

export function useComplaints(query = '') {
  return useSWR(`/api/complaints${query}`)
}
