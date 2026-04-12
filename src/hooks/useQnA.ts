import useSWR from 'swr'

export function useQnA(query = '') {
  return useSWR(`/api/qna${query}`)
}
