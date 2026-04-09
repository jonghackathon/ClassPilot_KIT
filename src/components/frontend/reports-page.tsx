'use client'

import { useMemo, useState } from 'react'
import { FileText, Printer, Sparkles, TrendingUp, Users, X } from 'lucide-react'

import {
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'

const reportRows = [
  {
    student: '이지은',
    group: '중급 A반',
    attendance: '94%',
    assignments: '9 / 10',
    participation: '질문 활발, 예제 응용 빠름',
    growth: '개념 이해는 안정적이고 설명형 답변이 자연스러워졌습니다.',
    nextStep: '리스트 컴프리헨션에서 조건식 위치를 더 연습하면 좋습니다.',
  },
  {
    student: '정우진',
    group: '중급 A반',
    attendance: '82%',
    assignments: '7 / 10',
    participation: '초반 집중도는 좋지만 후반부 질문이 줄어듭니다.',
    growth: '문제 해결 속도는 좋아졌지만 실수 체크 루틴이 아직 약합니다.',
    nextStep: '숙제 제출 일정을 먼저 안정화하면 성과가 빨라질 수 있어요.',
  },
  {
    student: '한소영',
    group: '초급 B반',
    attendance: '98%',
    assignments: '10 / 10',
    participation: '발표는 조심스럽지만 개별 수행 완성도가 높습니다.',
    growth: '레이아웃 이해가 빠르고 피드백 반영 속도도 안정적입니다.',
    nextStep: '작은 발표 기회를 늘려 자신감을 키워보면 좋겠습니다.',
  },
] as const

function PrintDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
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
            <p className="mt-2 text-sm leading-6 text-slate-500">실제 인쇄 연동 전 단계에서 미리보기와 출력 옵션을 프론트 흐름으로만 정리해 두었습니다.</p>
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="rounded-[28px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
            표지, 학생별 요약, 강사 코멘트, AI 성장 평가 섹션 순서로 출력됩니다.
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

export function ReportsPage() {
  const [selectedStudent, setSelectedStudent] = useState(reportRows[0].student)
  const [selectedMonth, setSelectedMonth] = useState('2026년 4월')
  const [comment, setComment] = useState(
    '이번 달은 반복문 단원에서 이해도가 안정적으로 올라왔습니다. 과제 루틴이 유지되면 다음 단계 진입도 무리 없겠습니다.',
  )
  const [growthReady, setGrowthReady] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)

  const report = useMemo(
    () => reportRows.find((row) => row.student === selectedStudent) ?? reportRows[0],
    [selectedStudent],
  )

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="월간 보고서"
        title="학생별 월간 보고서를 미리보고 AI 성장 평가까지 정리해요"
        description="강사 메모와 진도 흐름을 이어받을 수 있도록 학생 선택, 월 선택, 미리보기, 출력 버튼을 같은 화면 안에 모았습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButton} onClick={() => setPrintOpen(true)} type="button">
              <Printer className="h-4 w-4" />
              출력 미리보기
            </button>
            <button className={cx(primaryButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setGrowthReady(true)} type="button">
              <Sparkles className="h-4 w-4" />
              AI 성장 평가 생성
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="대상 학생" value={`${reportRows.length}명`} detail="이달 보고서 준비" icon={Users} tone="violet" />
        <MetricCard label="출석 요약" value={report.attendance} detail="현재 선택 학생 기준" icon={TrendingUp} tone="emerald" />
        <MetricCard label="과제 제출" value={report.assignments} detail="월간 과제 현황" icon={FileText} tone="sky" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard>
          <SectionHeading title="보고서 설정" subtitle="학생과 월을 고르면 오른쪽 미리보기가 즉시 바뀝니다." />
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">학생 선택</span>
              <select
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                onChange={(event) => setSelectedStudent(event.target.value)}
                value={selectedStudent}
              >
                {reportRows.map((row) => (
                  <option key={row.student} value={row.student}>
                    {row.student} · {row.group}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">월 선택</span>
              <select
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                onChange={(event) => setSelectedMonth(event.target.value)}
                value={selectedMonth}
              >
                {['2026년 4월', '2026년 3월', '2026년 2월'].map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">강사 코멘트</span>
              <textarea
                className="min-h-[160px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
                onChange={(event) => setComment(event.target.value)}
                value={comment}
              />
            </label>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading title={`${selectedMonth} 보고서 미리보기`} subtitle={`${report.student} · ${report.group}`} />
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge label={`출석 ${report.attendance}`} tone="emerald" />
              <StatusBadge label={`과제 ${report.assignments}`} tone="sky" />
              <StatusBadge label={growthReady ? 'AI 평가 생성됨' : 'AI 평가 대기'} tone={growthReady ? 'violet' : 'slate'} />
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-500">수업 참여</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{report.participation}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-500">AI 성장 평가</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {growthReady
                    ? report.growth
                    : 'AI 성장 평가 생성을 누르면 이번 달 학습 변화와 다음 단계 제안을 한 문단으로 정리합니다.'}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-500">다음 액션</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{report.nextStep}</p>
              </div>
              <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                <p className="text-sm font-medium text-slate-300">강사 최종 코멘트</p>
                <p className="mt-2 text-sm leading-7 text-slate-100">{comment}</p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <PrintDialog onClose={() => setPrintOpen(false)} open={printOpen} />
    </div>
  )
}
