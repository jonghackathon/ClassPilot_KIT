'use client'

import { SessionProvider } from 'next-auth/react'
import { SWRConfig } from 'swr'

import { fetcher } from '@/lib/fetcher'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          dedupingInterval: 5000,
          errorRetryCount: 2,
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  )
}
