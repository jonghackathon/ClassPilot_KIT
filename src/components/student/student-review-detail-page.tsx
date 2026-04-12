'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { CheckCircle2, Sparkles } from 'lucide-react'

import { ActionButton, PageHero, SectionHeading, StatusBadge, SurfaceCard } from '@/components/frontend/common'
import { apiRequest, fetcher } from '@/lib/fetcher'

import { formatKoreanDate, formatKoreanDateTime, type ApiEnvelope } from './student-data'

type ReviewQuizItem = {
  question?: string
  choices?: string[]
  correctIndex?: number
  explanation?: string
}

type ReviewDetail = {
  id: string
  summary: string
  preview: string | null
  readAt: string | null
  quiz: unknown
  lesson: { id: string; date: string; topic: string | null } | null
  student: { id: string; name: string; email: string } | null
}

export function StudentReviewDetailPage({ reviewId }: { reviewId: string }) {
  const { data, error, isLoading, mutate } = useSWR<ApiEnvelope<ReviewDetail>>(
    reviewId ? `/api/reviews/${reviewId}` : null,
    fetcher,
  )

  const review = data?.data
  const quizItems = useMemo(
    () => (Array.isArray(review?.quiz) ? (review?.quiz as ReviewQuizItem[]) : []),
    [review?.quiz],
  )

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="복습 상세"
        title={review?.summary ?? '복습 정보를 불러오는 중이에요'}
        description="복습 요약, 퀴즈, 읽음 처리까지 실제 복습 기록 API로 연결했습니다."
        backHref="/student/review"
        backLabel="복습 목록"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={review?.readAt ? '읽음' : '읽지 않음'} tone={review?.readAt ? 'emerald' : 'amber'} />
          <StatusBadge label={review?.lesson?.date ? formatKoreanDate(review.lesson.date) : '수업 날짜 없음'} tone="sky" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">{review?.lesson?.topic ?? '복습 자료'}</h2>
        <p className="mt-2 text-sm text-slate-500">{review?.student?.name ?? '학생'} · {review?.student?.email ?? ''}</p>
        <div className="mt-5 rounded-[28px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-600">
          {review?.preview ?? '미리보기 내용이 없어요.'}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!review || Boolean(review.readAt)}
            onClick={async () => {
              await apiRequest(`/api/reviews/${reviewId}`, {
                method: 'PATCH',
                body: JSON.stringify({ readAt: new Date().toISOString() }),
              })
              await mutate()
            }}
            type="button"
          >
            읽음 처리
          </button>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="핵심 요약" subtitle="선생님이 정리한 핵심 개념을 다시 볼 수 있어요." />
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          {review?.summary ? <p>{review.summary}</p> : <p>요약을 불러오는 중이에요.</p>}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="복습 퀴즈" subtitle="원본 quiz 데이터가 배열이면 카드로 보여줍니다." />
        <div className="mt-5 space-y-3">
          {quizItems.length ? (
            quizItems.map((item, index) => (
              <div key={`${item.question ?? 'quiz'}-${index}`} className="rounded-[28px] bg-violet-50 px-5 py-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-violet-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-950">{item.question ?? `퀴즈 ${index + 1}`}</p>
                    {item.choices?.length ? (
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                        {item.choices.map((choice) => (
                          <li key={choice} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-violet-100">
                            {choice}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {item.explanation ? (
                      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-violet-700 ring-1 ring-violet-100">
                        {item.explanation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">
              퀴즈 데이터가 없어서 요약 중심으로만 보여주고 있어요.
            </p>
          )}
        </div>
      </SurfaceCard>

      {review?.readAt ? (
        <SurfaceCard className="border border-emerald-100 bg-emerald-50/80">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">읽음 처리됨</p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">
                {formatKoreanDateTime(review.readAt)} 에 읽음 처리했어요.
              </p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      {isLoading ? (
        <SurfaceCard>
          <p className="text-sm text-slate-500">복습 상세를 불러오는 중이에요.</p>
        </SurfaceCard>
      ) : null}

      {error ? (
        <SurfaceCard className="border border-rose-100 bg-rose-50/80">
          <p className="text-sm text-rose-700">복습 상세를 불러오지 못했어요.</p>
        </SurfaceCard>
      ) : null}
    </div>
  )
}
