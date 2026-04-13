'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileAudio2, LoaderCircle, Upload } from 'lucide-react'
import { mutate } from 'swr'

import { PageHero, ProgressBar, SectionHeading, StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { useCopilot } from '@/hooks/useCopilot'
import { useRecordings } from '@/hooks/useRecordings'

const filledButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const lineButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'

type ApiEnvelope<T> = {
  success: boolean
  data: T
}

type PaginatedData<T> = {
  items: T[]
}

type LessonItem = {
  id: string
  date: string
  topic: string | null
  class: {
    id: string
    name: string
  }
}

type RecordingItem = {
  id: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  createdAt: string
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

function getDateKey() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(new Date())
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function TeacherRecordingPage() {
  const today = getDateKey()
  const lessonsKey = `/api/lessons?from=${today}&to=${today}&limit=20`
  const recordingsKey = '/api/recordings?limit=20'
  const { data: lessonsResponse } = useCopilot<ApiEnvelope<PaginatedData<LessonItem>>>(lessonsKey)
  const { data: recordingsResponse } = useRecordings<ApiEnvelope<PaginatedData<RecordingItem>>>(recordingsKey)
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('선택된 파일 없음')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const lessons = lessonsResponse?.data.items ?? []
  const recordings = recordingsResponse?.data.items ?? []
  const effectiveLessonId = selectedLessonId || lessons[0]?.id || ''
  const effectiveLesson =
    lessons.find((lesson) => lesson.id === effectiveLessonId) ?? lessons[0] ?? null

  async function handleUpload() {
    if (!effectiveLessonId || !selectedFile) return

    setIsUploading(true)
    setUploadProgress(25)
    try {
      const formData = new FormData()
      formData.set('lessonId', effectiveLessonId)
      formData.set('file', selectedFile)

      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '녹음 정리를 생성하지 못했습니다.')
      }

      setUploadProgress(100)
      await mutate(recordingsKey)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="녹음 정리"
        title="수업 녹음 업로드부터 요약 확인까지 이어집니다"
        description="실제 lesson/recording 데이터를 기준으로 업로드 대기, 처리중, 완료 상태를 확인할 수 있습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading title="녹음 목록" subtitle="최근 생성된 정리 결과" />
          <div className="mt-5 space-y-3">
            {recordings.length ? (
              recordings.map((recording) => (
                <Link
                  key={recording.id}
                  className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:border-violet-200"
                  href={`/teacher/recording/${recording.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{recording.lesson.class.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {recording.lesson.topic ?? '수업 주제 미기재'} · {formatDate(recording.createdAt)}
                      </p>
                    </div>
                    <StatusBadge
                      label={recording.status === 'COMPLETED' ? '요약 완료' : recording.status === 'FAILED' ? '실패' : '처리 중'}
                      tone={recording.status === 'COMPLETED' ? 'emerald' : recording.status === 'FAILED' ? 'rose' : 'amber'}
                    />
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                아직 녹음 정리 이력이 없습니다.
              </p>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="새 녹음 등록" subtitle="파일 입력과 진행 상태" />
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <p className="text-sm font-medium text-slate-300">선택된 수업</p>
            <p className="mt-2 text-2xl font-semibold">{effectiveLesson?.class.name ?? '오늘 수업 없음'}</p>
            <p className="mt-3 text-sm text-slate-300">{effectiveLesson?.topic ?? '수업을 먼저 선택해 주세요.'}</p>
            <p className="mt-2 text-sm text-slate-300">파일: {selectedFileName}</p>
            <p className="mt-2 text-sm text-slate-300">
              현재 단계에서는 업로드한 파일명을 기록하고, 요약 작업을 생성합니다.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <select
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
              onChange={(event) => setSelectedLessonId(event.target.value)}
              value={effectiveLessonId}
            >
              {lessons.length ? (
                lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.class.name} · {lesson.topic ?? '주제 미기재'}
                  </option>
                ))
              ) : (
                <option value="">오늘 수업 없음</option>
              )}
            </select>

            <div>
              <ProgressBar value={uploadProgress} tone={uploadProgress >= 100 ? 'emerald' : 'violet'} />
              <p className="mt-3 text-sm text-slate-500">업로드 진행률 {uploadProgress}%</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className={lineButton}>
                <FileAudio2 className="h-4 w-4" />
                파일 선택
                <input
                  className="hidden"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0]
                    if (!nextFile) return
                    setSelectedFile(nextFile)
                    setSelectedFileName(nextFile.name)
                    setUploadProgress(0)
                  }}
                  type="file"
                />
              </label>
              <button
                className={cx(
                  filledButton,
                  'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
                )}
                disabled={isUploading || !effectiveLessonId || !selectedFile}
                onClick={handleUpload}
                type="button"
              >
                {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                요약 작업 생성
              </button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
