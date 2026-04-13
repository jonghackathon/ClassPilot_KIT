import useSWR, { type SWRConfiguration } from 'swr'

export function useRecordings<T = unknown>(
  key: string | null,
  refreshInterval?: SWRConfiguration<T>['refreshInterval'],
) {
  return useSWR<T>(key, { refreshInterval })
}
