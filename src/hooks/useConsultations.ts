import useSWR from 'swr'

export function useConsultations(query = '') {
  return useSWR(`/api/consultations${query}`)
}
