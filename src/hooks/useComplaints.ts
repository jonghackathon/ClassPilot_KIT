import useSWR from 'swr'

export function useComplaints<T = unknown>(query = '') {
  return useSWR<T>(`/api/complaints${query}`)
}
