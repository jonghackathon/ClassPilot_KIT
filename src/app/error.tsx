'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto flex min-h-screen max-w-[760px] items-center justify-center px-4 py-16">
          <div className="w-full rounded-[32px] border border-rose-100 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-slate-950">서버 오류가 발생했습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              잠시 후 다시 시도하거나, 문제가 계속되면 새로고침 후 다시 확인해 주세요.
            </p>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => reset()}
              type="button"
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
