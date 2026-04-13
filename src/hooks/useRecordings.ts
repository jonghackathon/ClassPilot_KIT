import useSWR from 'swr'

export function useRecordings<T = unknown>(key: string | null) {
  return useSWR<T>(key)
}
