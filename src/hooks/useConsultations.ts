import useSWR from 'swr'

export function useConsultations<T = unknown>(query = '') {
  return useSWR<T>(`/api/consultations${query}`)
}
