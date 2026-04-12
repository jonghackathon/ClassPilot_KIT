import useSWR from 'swr'

export function useReview(query = '') {
  return useSWR(`/api/review${query}`)
}
