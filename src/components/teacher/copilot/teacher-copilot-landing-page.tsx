'use client'

import Link from 'next/link'
import { PlayCircle, Sparkles } from 'lucide-react'

import { PageHero, StatusBadge, SurfaceCard } from '@/components/frontend/common'
import { useCopilot } from '@/hooks/useCopilot'

type ApiEnvelope<T> = {
  success: boolean
  data: T
}

type PaginatedData<T> = {
  items: T[]
  total: number
}

type LessonItem = {
  id: string
  date: string
  topic: string | null
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  class: {
    id: string
    name: string
  }
}

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

function formatLessonTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function TeacherCopilotLandingPage() {
  const today = getDateKey()
  const { data, isLoading } = useCopilot<ApiEnvelope<PaginatedData<LessonItem>>>(
    `/api/lessons?from=${today}&to=${today}&limit=20`,
  )

  const lessons = data?.data.items ?? []

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="AI 수업 코파일럿"
        title="오늘 수업 중 바로 시작할 세션을 선택해 주세요"
        description="실제 lesson 데이터를 기준으로 오늘 수업을 골라 세션으로 들어갑니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {isLoading ? (
          <SurfaceCard className="xl:col-span-2">
            <p className="text-sm text-slate-500">오늘 수업을 불러오는 중입니다.</p>
          </SurfaceCard>
        ) : lessons.length ? (
          lessons.map((lesson) => (
            <SurfaceCard key={lesson.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-violet-600">
                    {formatLessonTime(lesson.date)}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{lesson.class.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lesson.topic ?? '오늘 수업 주제를 아직 입력하지 않았습니다.'}
                  </p>
                </div>
                <PlayCircle className="h-6 w-6 text-violet-500" />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge label={lesson.status === 'COMPLETED' ? '완료 수업' : '진행 대상'} tone={lesson.status === 'COMPLETED' ? 'emerald' : 'violet'} />
                <StatusBadge label={new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(lesson.date))} tone="slate" />
              </div>
              <div className="mt-5">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
                  href={`/teacher/copilot/${lesson.id}`}
                >
                  <Sparkles className="h-4 w-4" />
                  세션 열기
                </Link>
              </div>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard className="xl:col-span-2">
            <p className="text-sm text-slate-500">오늘 등록된 수업이 없습니다.</p>
          </SurfaceCard>
        )}
      </div>
    </div>
  )
}
