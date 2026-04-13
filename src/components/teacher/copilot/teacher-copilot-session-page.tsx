'use client'

import { useState } from 'react'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { mutate } from 'swr'

import { CopilotPanel } from '@/components/ai/CopilotPanel'
import { PageHero, StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { useCopilot } from '@/hooks/useCopilot'
import { apiRequest } from '@/lib/fetcher'

const filledButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'

type ApiEnvelope<T> = {
  success: boolean
  data: T
}

type PaginatedData<T> = {
  items: T[]
}

type LessonDetail = {
  id: string
  date: string
  topic: string | null
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  class: {
    id: string
    name: string
  }
}

type CopilotSessionListItem = {
  id: string
  topic: string | null
  status: 'ACTIVE' | 'COMPLETED'
}

type CopilotSessionDetail = {
  id: string
  topic: string | null
  status: 'ACTIVE' | 'COMPLETED'
  questions: Array<{
    id: string
    question: string
    beginner: string | null
    example: string | null
    advanced: string | null
    summary: string | null
    usedCards: string[]
    createdAt: string
  }>
}

export function TeacherCopilotSessionPage({ lessonId }: { lessonId: string }) {
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const lessonKey = `/api/lessons/${lessonId}`
  const sessionsKey = `/api/copilot/sessions?lessonId=${lessonId}&limit=10`
  const { data: lessonResponse, isLoading: lessonLoading } = useCopilot<ApiEnvelope<LessonDetail>>(lessonKey)
  const { data: sessionsResponse, isLoading: sessionLoading } = useCopilot<ApiEnvelope<PaginatedData<CopilotSessionListItem>>>(sessionsKey)

  const lesson = lessonResponse?.data
  const sessions = sessionsResponse?.data.items ?? []
  const currentSession = sessions.find((item) => item.status === 'ACTIVE') ?? sessions[0] ?? null
  const sessionDetailKey = currentSession ? `/api/copilot/sessions/${currentSession.id}` : null
  const { data: sessionDetailResponse, isLoading: sessionDetailLoading } = useCopilot<ApiEnvelope<CopilotSessionDetail>>(sessionDetailKey)

  async function handleCreateSession() {
    if (!lesson) return

    setIsCreating(true)
    setCreateError(null)
    try {
      await apiRequest('/api/copilot/sessions', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: lesson.id,
          topic: lesson.topic,
        }),
      })
      await mutate(sessionsKey)
    } catch (caught) {
      setCreateError(
        caught instanceof Error ? caught.message : '세션을 시작하지 못했습니다. 다시 시도해 주세요.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  if (lessonLoading) {
    return <SurfaceCard><p className="text-sm text-slate-500">수업 정보를 불러오는 중입니다.</p></SurfaceCard>
  }

  if (!lesson) {
    return <SurfaceCard><p className="text-sm text-slate-500">수업 정보를 찾을 수 없습니다.</p></SurfaceCard>
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="AI 수업 코파일럿"
        title={`${lesson.class.name} · ${lesson.topic ?? '오늘 수업'}`}
        description="lesson 기반으로 세션을 만들고, 질문 이력을 누적하며 카드 답변을 바로 복사할 수 있습니다."
        backHref="/teacher/copilot"
        backLabel="수업 선택"
        action={
          currentSession ? (
            <StatusBadge label={currentSession.status === 'ACTIVE' ? '세션 진행 중' : '세션 종료'} tone={currentSession.status === 'ACTIVE' ? 'emerald' : 'slate'} />
          ) : null
        }
      />

      {!currentSession ? (
        <SurfaceCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">아직 세션이 없습니다</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                수업별 코파일럿은 세션 단위로 질문 이력을 쌓습니다. 먼저 세션을 시작해 주세요.
              </p>
            </div>
            <button
              className={cx(
                filledButton,
                'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
              )}
              disabled={isCreating}
              onClick={handleCreateSession}
              type="button"
            >
              {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              세션 시작
            </button>
          </div>
          {createError ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {createError}
            </p>
          ) : null}
        </SurfaceCard>
      ) : sessionLoading || sessionDetailLoading || !sessionDetailResponse?.data ? (
        <SurfaceCard>
          <p className="text-sm text-slate-500">코파일럿 세션을 준비하는 중입니다.</p>
        </SurfaceCard>
      ) : (
        <CopilotPanel
          lessonTitle={`${lesson.class.name} · ${lesson.topic ?? '오늘 수업'}`}
          onRefresh={async () => {
            await Promise.all([mutate(sessionsKey), mutate(sessionDetailKey)])
          }}
          session={sessionDetailResponse.data}
        />
      )}
    </div>
  )
}
