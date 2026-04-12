'use client'

import Link from 'next/link'
import useSWR from 'swr'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  NotebookPen,
  Sparkles,
  MessageCircleQuestion,
} from 'lucide-react'

import { ActionButton, MetricCard, PageHero, SectionHeading, StatusBadge, SurfaceCard } from '@/components/frontend/common'
import { fetcher } from '@/lib/fetcher'

import {
  type ApiEnvelope,
  type PaginatedData,
  formatKoreanDate,
  formatKoreanDateTime,
  unwrapItems,
} from './student-data'

type StudentMe = {
  id: string
  name: string | null
  email: string
}

type AssignmentItem = {
  id: string
  title: string
  type: 'CODING' | 'ESSAY' | 'IMAGE'
  dueDate: string | null
  class: { id: string; name: string }
  teacher: { id: string; name: string }
}

type ReviewItem = {
  id: string
  summary: string
  preview: string | null
  readAt: string | null
  lesson: { id: string; date: string; topic: string | null } | null
}

type QnaItem = {
  id: string
  question: string
  status: 'PENDING' | 'AI_ANSWERED' | 'TEACHER_ANSWERED'
  aiAnswer: string | null
  teacherAnswer: string | null
  createdAt: string
}

type AttendanceItem = {
  id: string
  date: string
  status: 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT'
}

function badgeToneForReview(review: ReviewItem) {
  return review.readAt ? 'emerald' : 'amber'
}

function questionTone(status: QnaItem['status']) {
  if (status === 'TEACHER_ANSWERED') return 'emerald'
  if (status === 'AI_ANSWERED') return 'violet'
  return 'amber'
}

export function StudentHomePage() {
  const { data: meResponse } = useSWR<ApiEnvelope<StudentMe>>('/api/auth/me', fetcher)
  const { data: assignmentsResponse } = useSWR<ApiEnvelope<PaginatedData<AssignmentItem>>>(
    '/api/assignments?limit=8',
    fetcher,
  )
  const { data: reviewsResponse } = useSWR<ApiEnvelope<PaginatedData<ReviewItem>>>(
    '/api/reviews?limit=8',
    fetcher,
  )
  const { data: qnaResponse } = useSWR<ApiEnvelope<PaginatedData<QnaItem>>>(
    '/api/qna?limit=8',
    fetcher,
  )
  const { data: attendanceResponse } = useSWR<ApiEnvelope<PaginatedData<AttendanceItem>>>(
    '/api/attendance?limit=50',
    fetcher,
  )

  const me = meResponse?.data
  const assignments = unwrapItems(assignmentsResponse)
  const reviews = unwrapItems(reviewsResponse)
  const qnaItems = unwrapItems(qnaResponse)
  const attendance = unwrapItems(attendanceResponse)

  const currentClass = assignments[0]?.class.name ?? '내 수업'
  const nextAssignment = assignments.find((item) => item.dueDate) ?? assignments[0]
  const latestReview = reviews[0]
  const latestQuestion = qnaItems[0]
  const attendanceTotal = attendance.length
  const attendanceAttended = attendance.filter(
    (item) => item.status === 'PRESENT' || item.status === 'EARLY_LEAVE',
  ).length
  const attendanceRate = attendanceTotal ? Math.round((attendanceAttended / attendanceTotal) * 100) : 0

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="학생 홈"
        title={`${me?.name ?? '학생'}님, 오늘도 학습 흐름을 이어가요`}
        description="과제, 복습, 질문, 출석을 한 화면에서 묶어서 보여주는 학생 전용 홈입니다."
        backHref="/"
        backLabel="메인으로"
        action={<ActionButton href="/student/assignments" label="과제 보기" tone="indigo" />}
      />

      <SurfaceCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">현재 반</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{currentClass}</h2>
            <p className="mt-2 text-sm text-slate-500">최근 기록 기준으로 실데이터를 불러옵니다.</p>
          </div>
          <StatusBadge label={`출석률 ${attendanceRate}%`} tone={attendanceRate >= 80 ? 'emerald' : 'amber'} />
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="남은 과제"
          value={`${assignments.length}건`}
          detail={nextAssignment ? `${nextAssignment.title} · ${formatKoreanDate(nextAssignment.dueDate)}` : '새 과제를 기다리고 있어요'}
          icon={NotebookPen}
          tone="amber"
          href="/student/assignments"
        />
        <MetricCard
          label="복습 자료"
          value={`${reviews.length}건`}
          detail={latestReview ? `최근 ${formatKoreanDate(latestReview.lesson?.date)}` : '복습 자료를 불러오는 중'}
          icon={Sparkles}
          tone="violet"
          href="/student/review"
        />
        <MetricCard
          label="질문 이력"
          value={`${qnaItems.length}건`}
          detail={latestQuestion ? `${latestQuestion.question.slice(0, 22)}${latestQuestion.question.length > 22 ? '…' : ''}` : '질문을 남겨보세요'}
          icon={MessageCircleQuestion}
          tone="sky"
          href="/student/qna"
        />
        <MetricCard
          label="최근 출결"
          value={`${attendanceAttended}/${attendanceTotal || 0}`}
          detail={attendanceTotal ? `${attendanceAttended}회 출석 · ${attendanceTotal - attendanceAttended}회 미출석` : '출결 기록을 불러오는 중'}
          icon={CalendarDays}
          tone="emerald"
          href="/student/attendance"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard>
          <SectionHeading title="지금 확인하면 좋은 과제" subtitle="마감이 가까운 과제를 앞에 배치했습니다." action={<ActionButton href="/student/assignments" label="전체 보기" tone="amber" />} />
          <div className="mt-5 space-y-3">
            {assignments.length ? (
              assignments.slice(0, 3).map((item) => (
                <Link key={item.id} href={`/student/assignments/${item.id}`} className="block rounded-[28px] border border-slate-200 bg-white px-5 py-5 transition hover:border-indigo-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-sky-600">{item.class.name}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{item.teacher.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge label={item.type} tone="amber" />
                    <StatusBadge label={formatKoreanDate(item.dueDate)} tone="slate" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">현재 보여줄 과제가 없어요.</p>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="최근 흐름" subtitle="복습과 질문을 빠르게 이어볼 수 있어요." />
          <div className="mt-5 space-y-4">
            <div className="rounded-[28px] bg-violet-50 px-5 py-5">
              <p className="text-sm font-medium text-violet-700">최근 복습</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{latestReview?.lesson?.topic ?? '복습 자료 없음'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{latestReview?.summary ?? '새 복습이 올라오면 이곳에 표시됩니다.'}</p>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge label={latestReview ? (latestReview.readAt ? '읽음' : '읽지 않음') : '대기 중'} tone={latestReview ? badgeToneForReview(latestReview) : 'slate'} />
                {latestReview ? (
                  <Link href={`/student/review/${latestReview.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                    자세히
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] bg-sky-50 px-5 py-5">
              <p className="text-sm font-medium text-sky-700">최근 질문</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{latestQuestion?.question ?? '질문 기록 없음'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {latestQuestion
                  ? latestQuestion.teacherAnswer ?? latestQuestion.aiAnswer ?? '답변 대기 중'
                  : '질문을 남기면 답변 기록이 여기에 표시됩니다.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <StatusBadge label={latestQuestion ? latestQuestion.status : '대기 중'} tone={latestQuestion ? questionTone(latestQuestion.status) : 'slate'} />
                {latestQuestion ? <span className="text-xs text-slate-500">{formatKoreanDateTime(latestQuestion.createdAt)}</span> : null}
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" />
          <div>
            <p className="font-semibold text-slate-900">지금은 홈에서 전체 흐름을 먼저 보고, 세부 화면으로 내려가면 돼요.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              과제, 복습, 질문, 출결은 각각 상세 화면에서 바로 이어집니다.
            </p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}
