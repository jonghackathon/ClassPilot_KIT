'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

import { ActionButton, PageHero, SectionHeading, StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { useReview } from '@/hooks/useReview'

import { formatKoreanDate, unwrapItems } from './student-data'

type ReviewItem = {
  id: string
  summary: string
  preview: string | null
  readAt: string | null
  lesson: { id: string; date: string; topic: string | null } | null
}

export function StudentReviewPage() {
  const { data, error, isLoading } = useReview<ReviewItem>('limit=100')
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')
  const items = unwrapItems(data)

  const filteredItems = useMemo(
    () => items.filter((item) => (filter === 'all' ? true : !item.readAt)),
    [filter, items],
  )

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="복습 자료"
        title="복습 자료를 실제 기록 기준으로 읽고 다음 복습으로 이어가요"
        description="읽음 여부와 최근 수업 주제를 함께 보여줘서, 복습 흐름을 빠르게 이어갈 수 있게 했습니다."
        backHref="/student/home"
        backLabel="홈으로"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <button
            className={cx(
              'rounded-full px-3 py-2 text-sm font-medium transition',
              filter === 'unread'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white text-slate-600 ring-1 ring-slate-200',
            )}
            onClick={() => setFilter('unread')}
            type="button"
          >
            읽지 않음 우선
          </button>
          <button
            className={cx(
              'rounded-full px-3 py-2 text-sm font-medium transition',
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                : 'bg-white text-slate-600 ring-1 ring-slate-200',
            )}
            onClick={() => setFilter('all')}
            type="button"
          >
            전체 보기
          </button>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="복습 목록" subtitle="읽음 여부를 기준으로 먼저 확인할 수 있어요." />
        <div className="mt-5 space-y-3">
          {error ? (
            <p className="rounded-[24px] bg-rose-50 px-5 py-6 text-sm text-rose-700">복습 목록을 불러오지 못했어요.</p>
          ) : null}
          {isLoading ? (
            <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">복습 목록을 불러오는 중이에요.</p>
          ) : null}
          {!isLoading && !filteredItems.length ? (
            <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">현재 조건에 맞는 복습이 없어요.</p>
          ) : null}
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              href={`/student/review/${item.id}`}
              className="block rounded-[28px] border border-slate-200 bg-white px-5 py-5 transition hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <StatusBadge label={item.readAt ? '읽음' : '읽지 않음'} tone={item.readAt ? 'emerald' : 'amber'} />
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">{item.summary}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.lesson?.date ? `${formatKoreanDate(item.lesson.date)} · ` : ''}
                    {item.lesson?.topic ?? '수업 요약'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.preview ?? '요약 미리보기가 없어요.'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
