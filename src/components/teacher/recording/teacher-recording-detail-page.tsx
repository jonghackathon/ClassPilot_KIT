'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'

import { PageHero, StatusBadge, SurfaceCard } from '@/components/frontend/common'
import { useRecordings } from '@/hooks/useRecordings'

const lineButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'

type ApiEnvelope<T> = {
  success: boolean
  data: T
}

type RecordingDetail = {
  id: string
  audioUrl: string | null
  transcript: string | null
  summary: string | null
  questions: string | null
  nextPoints: string | null
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  lesson: {
    id: string
    date: string
    topic: string | null
    class: {
      id: string
      name: string
    }
  }
}

export function TeacherRecordingDetailPage({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const { data, isLoading } = useRecordings<ApiEnvelope<RecordingDetail>>(
    `/api/recordings/${id}`,
    (latestData: ApiEnvelope<RecordingDetail> | undefined) =>
      latestData?.data.status === 'PROCESSING' ? 3000 : 0,
  )
  const item = data?.data

  async function handleCopy() {
    if (!item?.summary) return
    try {
      await navigator.clipboard.writeText(item.summary)
      setCopied(true)
    } catch {
      setCopied(true)
    }
  }

  if (isLoading) {
    return <SurfaceCard><p className="text-sm text-slate-500">녹음 상세를 불러오는 중입니다.</p></SurfaceCard>
  }

  if (!item) {
    return <SurfaceCard><p className="text-sm text-slate-500">녹음 상세를 찾을 수 없습니다.</p></SurfaceCard>
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="녹음 상세"
        title={`${item.lesson.class.name} · ${item.lesson.topic ?? '수업 녹음'}`}
        description="요약, 전사본, 질문 후보, 다음 수업 연결 포인트를 한 번에 볼 수 있습니다."
        backHref="/teacher/recording"
        backLabel="녹음 목록"
        action={
          <StatusBadge
            label={item.status === 'COMPLETED' ? '요약 완료' : item.status === 'FAILED' ? '실패' : '처리 중'}
            tone={item.status === 'COMPLETED' ? 'emerald' : item.status === 'FAILED' ? 'rose' : 'amber'}
          />
        }
      />

      <SurfaceCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">요약</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">수업 핵심 정리</h2>
          </div>
          <button className={lineButton} onClick={handleCopy} type="button">
            <Copy className="h-4 w-4" />
            {copied ? '복사됨' : '요약 복사'}
          </button>
        </div>
        <div className="mt-5 rounded-[28px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700">
          {item.summary ?? '요약이 아직 준비되지 않았습니다.'}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard>
          <p className="text-sm font-medium text-sky-600">학생 질문 후보</p>
          <div className="mt-4 whitespace-pre-line rounded-[28px] bg-sky-50 px-5 py-5 text-sm leading-7 text-sky-900">
            {item.questions ?? '질문 후보를 생성하는 중입니다.'}
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm font-medium text-amber-600">다음 수업 포인트</p>
          <div className="mt-4 rounded-[28px] bg-amber-50 px-5 py-5 text-sm leading-7 text-amber-900">
            {item.nextPoints ?? '다음 수업 연결 포인트를 생성하는 중입니다.'}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        {item.audioUrl ? (
          <div className="mb-5 rounded-[28px] bg-slate-50 px-5 py-5">
            <p className="text-sm font-medium text-slate-600">원본 오디오</p>
            <audio className="mt-3 w-full" controls src={item.audioUrl}>
              브라우저가 오디오 재생을 지원하지 않습니다.
            </audio>
          </div>
        ) : null}
        <p className="text-sm font-medium text-slate-600">전사본</p>
        <div className="mt-4 rounded-[28px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700">
          {item.transcript ?? '전사본이 아직 없습니다.'}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <StatusBadge label={`진행률 ${item.progress}%`} tone={item.progress >= 100 ? 'emerald' : 'violet'} />
          <StatusBadge
            label={new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(item.lesson.date))}
            tone="slate"
          />
        </div>
      </SurfaceCard>
    </div>
  )
}
