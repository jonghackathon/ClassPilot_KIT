'use client'

import Link from 'next/link'
import { Bell, RefreshCcw } from 'lucide-react'

import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/useNotifications'

const toneStyles = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
  slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
} as const

export function NotificationPopover({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  const { items, unreadCount, isLoading, error, mutate } = useNotifications(5)

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => void mutate()}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            {unreadCount}건
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </>
        ) : error ? (
          <EmptyState
            title="알림을 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            className="px-4 py-6"
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="새 알림이 없습니다."
            description="중요한 변화가 생기면 이곳에 최근 알림이 표시됩니다."
            icon={Bell}
            className="px-4 py-6"
          />
        ) : (
          items.map((item) => {
            const content = (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 transition hover:bg-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneStyles[item.tone]}`}
                  >
                    {item.source === 'manual' ? '공지' : '알림'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            )

            return item.href ? (
              <Link key={item.id} href={item.href}>
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            )
          })
        )}
      </div>
    </div>
  )
}
