import useSWR from 'swr'

export function useCopilot<T = unknown>(key: string | null) {
  return useSWR<T>(key)
}
