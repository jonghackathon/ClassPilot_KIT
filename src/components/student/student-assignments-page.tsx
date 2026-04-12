'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowRight, NotebookPen } from 'lucide-react'

import { ActionButton, PageHero, SectionHeading, StatusBadge, SurfaceCard } from '@/components/frontend/common'
import { fetcher } from '@/lib/fetcher'

import { formatKoreanDate, type ApiEnvelope, type PaginatedData, unwrapItems } from './student-data'

type AssignmentItem = {
  id: string
  title: string
  type: 'CODING' | 'ESSAY' | 'IMAGE'
  dueDate: string | null
  class: { id: string; name: string }
  teacher: { id: string; name: string }
}

const typeLabels: Record<AssignmentItem['type'], string> = {
  CODING: '코딩',
  ESSAY: '서술',
  IMAGE: '이미지',
}

export function StudentAssignmentsPage() {
  const { data, error, isLoading } = useSWR<ApiEnvelope<PaginatedData<AssignmentItem>>>(
    '/api/assignments?limit=100',
    fetcher,
  )

  const items = unwrapItems(data)
  const nextDue = items.find((item) => item.dueDate) ?? items[0]

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="내 과제"
        title="과제 목록을 실데이터로 확인하고 바로 상세로 들어가요"
        description="과제 제목, 반, 담당 선생님, 마감일을 실제 API에서 받아오도록 바꿨습니다."
        backHref="/student/home"
        backLabel="홈으로"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">과제 개수</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{items.length}건</p>
          </div>
          <StatusBadge
            label={nextDue ? `다음 마감 ${formatKoreanDate(nextDue.dueDate)}` : '마감 예정 과제 없음'}
            tone={nextDue ? 'amber' : 'slate'}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="과제 목록" subtitle="가까운 마감일부터 순서대로 확인할 수 있어요." />
        <div className="mt-5 space-y-3">
          {error ? (
            <p className="rounded-[24px] bg-rose-50 px-5 py-6 text-sm text-rose-700">과제 목록을 불러오지 못했어요.</p>
          ) : null}
          {isLoading ? (
            <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">과제 목록을 불러오는 중이에요.</p>
          ) : null}
          {!isLoading && !items.length ? (
            <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">현재 확인할 과제가 없어요.</p>
          ) : null}
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/student/assignments/${item.id}`}
              className="block rounded-[28px] border border-slate-200 bg-white px-5 py-5 transition hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <NotebookPen className="h-4 w-4 text-indigo-600" />
                    <p className="font-semibold text-slate-950">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.class.name} · {item.teacher.name}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={typeLabels[item.type]} tone="indigo" />
                <StatusBadge label={formatKoreanDate(item.dueDate)} tone="amber" />
              </div>
            </Link>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
