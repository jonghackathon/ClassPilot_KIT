'use client'

import { useMemo, useState } from 'react'
import { FileText, LoaderCircle, Printer, Sparkles, TrendingUp, Users, X } from 'lucide-react'
import useSWR, { mutate } from 'swr'

import {
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'
import { apiRequest, fetcher } from '@/lib/fetcher'
import { useReports } from '@/hooks/useReports'

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'

type ApiEnvelope<T> = {
  success: boolean
  data: T
}

type PaginatedData<T> = {
  items: T[]
  total: number
}

type StudentItem = {
  id: string
  name: string
  enrollments: Array<{
    class: {
      id: string
      name: string
    }
  }>
}

type ReportItem = {
  id: string
  studentId: string
  monthStr: string
  comment: string | null
  growth: string | null
  attendanceSummary: string | null
  assignmentSummary: string | null
  student: {
    id: string
    name: string
    email: string
  }
}

function toMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function toMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split('-')
  return `${year}년 ${Number(month)}월`
}

function PrintDialog({
  open,
  onClose,
  studentName,
  monthLabel,
}: {
  open: boolean
  onClose: () => void
  studentName: string
  monthLabel: string
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[520px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Report Preview</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">출력 준비</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{studentName} · {monthLabel} 보고서 인쇄 전 미리보기 단계입니다.</p>
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="rounded-[28px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
            표지, 출결/과제 요약, AI 성장 평가, 강사 최종 코멘트 순서로 출력됩니다.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className={secondaryButton} onClick={onClose} type="button">닫기</button>
            <button className={cx(primaryButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={onClose} type="button">출력 진행</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TeacherReportsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(new Date()))
  const [comment, setComment] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const studentsKey = '/api/users?role=STUDENT&limit=100'
  const reportsQuery = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })
    if (selectedStudentId) params.set('studentId', selectedStudentId)
    if (selectedMonth) params.set('monthStr', selectedMonth)
    return `?${params.toString()}`
  }, [selectedMonth, selectedStudentId])

  const { data: studentsResponse } = useSWR<ApiEnvelope<PaginatedData<StudentItem>>>(studentsKey, fetcher)
  const { data: reportsResponse, mutate: mutateReports } = useReports<ApiEnvelope<PaginatedData<ReportItem>>>(reportsQuery)

  const students = studentsResponse?.data.items ?? []
  const effectiveStudentId = selectedStudentId || students[0]?.id || ''
  const selectedStudent = students.find((item) => item.id === effectiveStudentId) ?? students[0] ?? null
  const reports = reportsResponse?.data.items ?? []
  const report = reports[0] ?? null
  const reportComment = comment || report?.comment || ''
  const currentClass = selectedStudent?.enrollments[0]?.class.name ?? '담당 반'

  async function handleGenerate() {
    if (!effectiveStudentId) return

    setIsGenerating(true)
    try {
      const response = await apiRequest<ApiEnvelope<ReportItem>>('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          studentId: effectiveStudentId,
          monthStr: selectedMonth,
        }),
      })
      await mutateReports()
      mutate(studentsKey)
      setComment(response.data.comment ?? '')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="월간 보고서"
        title="학생별 월간 보고서를 실데이터 기준으로 정리해요"
        description="학생 선택, 월 선택, AI 성장 평가 생성, 출력 미리보기를 한 흐름으로 묶었습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButton} onClick={() => setPrintOpen(true)} type="button">
              <Printer className="h-4 w-4" />
              출력 미리보기
            </button>
            <button className={cx(primaryButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} disabled={isGenerating || !effectiveStudentId} onClick={handleGenerate} type="button">
              {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI 성장 평가 생성
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="대상 학생" value={`${students.length}명`} detail="보고서 생성 가능 학생" icon={Users} tone="violet" />
        <MetricCard label="현재 반" value={currentClass} detail={selectedStudent?.name ?? '학생 선택 필요'} icon={TrendingUp} tone="emerald" />
        <MetricCard label="생성 상태" value={report ? '준비됨' : '미생성'} detail={report ? toMonthLabel(report.monthStr) : '선택한 월 기준'} icon={FileText} tone="sky" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard>
          <SectionHeading title="보고서 설정" subtitle="학생과 월을 선택하면 오른쪽 미리보기가 바뀝니다." />
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">학생 선택</span>
              <select
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                onChange={(event) => setSelectedStudentId(event.target.value)}
                value={effectiveStudentId}
              >
                {students.length ? (
                  students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} · {student.enrollments[0]?.class.name ?? '반 미배정'}
                    </option>
                  ))
                ) : (
                  <option value="">학생 없음</option>
                )}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">월 선택</span>
              <input
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                onChange={(event) => setSelectedMonth(event.target.value)}
                type="month"
                value={selectedMonth}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">강사 코멘트</span>
              <textarea
                className="min-h-[160px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
                onChange={(event) => setComment(event.target.value)}
                value={reportComment}
              />
            </label>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading title={`${toMonthLabel(selectedMonth)} 보고서 미리보기`} subtitle={`${selectedStudent?.name ?? '학생 선택 필요'} · ${currentClass}`} />
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge label={report?.attendanceSummary ?? '출결 요약 대기'} tone="emerald" />
              <StatusBadge label={report?.assignmentSummary ?? '과제 요약 대기'} tone="sky" />
              <StatusBadge label={report ? 'AI 평가 생성됨' : 'AI 평가 대기'} tone={report ? 'violet' : 'slate'} />
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-500">AI 성장 평가</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {report?.growth ?? 'AI 성장 평가 생성을 누르면 학습 변화와 다음 단계 제안을 정리합니다.'}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                <p className="text-sm font-medium text-slate-300">강사 최종 코멘트</p>
                <p className="mt-2 text-sm leading-7 text-slate-100">
                  {reportComment || '강사 코멘트를 입력해 주세요.'}
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <PrintDialog
        monthLabel={toMonthLabel(selectedMonth)}
        onClose={() => setPrintOpen(false)}
        open={printOpen}
        studentName={selectedStudent?.name ?? '학생'}
      />
    </div>
  )
}
