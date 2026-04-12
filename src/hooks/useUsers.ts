import useSWR from 'swr'

export function useUsers(query = '') {
  return useSWR(`/api/users${query}`)
}
