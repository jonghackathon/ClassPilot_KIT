'use client'

import { useMemo, useState } from 'react'
import { Archive, NotebookPen, Search, Sparkles, Star, X } from 'lucide-react'

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

const memoRows = [
  {
    id: 1,
    title: '중급 A반 질문 패턴 메모',
    category: '수업운영',
    target: '중급 A반',
    summary: '리스트 컴프리헨션에서 조건식 위치를 자주 헷갈립니다. 다음 수업 도입부에서 3분 정도 더 설명하면 좋아요.',
    archived: false,
    highlight: true,
    updatedAt: '오늘 14:20',
  },
  {
    id: 2,
    title: '김민수 학부모 상담 포인트',
    category: '학부모',
    target: '김민수',
    summary: '결석 사유 전달은 빠르지만 숙제 수행률이 낮습니다. 출결보다 과제 루틴 이야기를 먼저 꺼내면 좋겠습니다.',
    archived: false,
    highlight: false,
    updatedAt: '어제 18:10',
  },
  {
    id: 3,
    title: '한소영 발표 자신감 관찰',
    category: '학생관찰',
    target: '한소영',
    summary: '개별 질문에는 답을 잘하지만 전체 발표에서 목소리가 작아집니다. 짧은 발표 기회를 먼저 주는 방식이 좋아 보여요.',
    archived: true,
    highlight: false,
    updatedAt: '4월 7일',
  },
  {
    id: 4,
    title: '4월 평가안 준비',
    category: '행정',
    target: '전체 강사',
    summary: '월간 보고서에서 성취도 서술 문장을 통일하려면 메모 템플릿을 먼저 정리해 둘 필요가 있습니다.',
    archived: false,
    highlight: true,
    updatedAt: '4월 6일',
  },
] as const

function MemoDialog({
  open,
  onClose,
  title,
}: {
  open: boolean
  onClose: () => void
  title: string
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[560px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Teacher Memo</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">강사 메모는 카테고리와 대상이 바로 보이도록 기존 카드 리듬에 맞췄습니다.</p>
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">메모 제목</span>
            <input className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" defaultValue="새 메모 제목" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">카테고리</span>
            <input className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" defaultValue="수업운영" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">메모 내용</span>
            <textarea className="min-h-[140px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none" defaultValue="수업 흐름, 상담 포인트, 학생 관찰 내용을 자유롭게 남깁니다." />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button className={secondaryButton} onClick={onClose} type="button">취소</button>
            <button className={cx(primaryButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={onClose} type="button">메모 저장</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MemoPage() {
  const [category, setCategory] = useState<'전체' | '수업운영' | '학부모' | '학생관찰' | '행정'>('전체')
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredRows = useMemo(
    () =>
      memoRows.filter((row) => {
        if (!showArchived && row.archived) {
          return false
        }

        if (category !== '전체' && row.category !== category) {
          return false
        }

        return `${row.title} ${row.target} ${row.summary}`.toLowerCase().includes(query.toLowerCase())
      }),
    [category, query, showArchived],
  )

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="강사 메모"
        title="수업 메모와 상담 포인트를 검색하고 아카이브까지 관리해요"
        description="강사 화면 안에서 따로 놀지 않도록 기존 카드 구조를 유지하면서 카테고리, 검색, 보관 흐름을 붙였습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button className={cx(primaryButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setDialogOpen(true)} type="button">
            <NotebookPen className="h-4 w-4" />
            메모 작성
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="활성 메모" value={`${memoRows.filter((row) => !row.archived).length}개`} detail="즉시 참고 가능" icon={NotebookPen} tone="violet" />
        <MetricCard label="하이라이트" value={`${memoRows.filter((row) => row.highlight).length}개`} detail="반복 확인 메모" icon={Star} tone="amber" />
        <MetricCard label="보관 메모" value={`${memoRows.filter((row) => row.archived).length}개`} detail="기록 아카이브" icon={Archive} tone="slate" />
      </div>

      <SurfaceCard>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="학생, 학부모, 반 이름으로 메모를 찾아보세요"
              value={query}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(['전체', '수업운영', '학부모', '학생관찰', '행정'] as const).map((item) => (
              <button
                key={item}
                className={cx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  category === item ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
            <button
              className={cx(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                showArchived ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setShowArchived((current) => !current)}
              type="button"
            >
              보관 메모 보기
            </button>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <SurfaceCard key={row.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-950">{row.title}</h2>
                      {row.highlight ? <StatusBadge label="중요" tone="amber" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{row.target} · {row.updatedAt}</p>
                  </div>
                  <StatusBadge label={row.category} tone={row.category === '수업운영' ? 'violet' : row.category === '학부모' ? 'sky' : row.category === '학생관찰' ? 'emerald' : 'slate'} />
                </div>
                <p className="text-sm leading-7 text-slate-600">{row.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButton} onClick={() => setDialogOpen(true)} type="button">수정</button>
                  <button className={secondaryButton} onClick={() => setShowArchived(true)} type="button">
                    {row.archived ? '보관 해제' : '보관'}
                  </button>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="h-fit">
          <SectionHeading title="메모 활용 가이드" subtitle="보고서, 진도, 상담 화면과 이어지는 톤으로 정리했습니다." />
          <div className="mt-5 space-y-3">
            {[
              '수업 메모는 보고서 코멘트와 연결되도록 문장을 짧게 유지',
              '학생관찰 메모는 행동 변화와 다음 액션을 함께 기록',
              '학부모 메모는 전달 내용보다 합의한 후속조치를 먼저 남김',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              월간 보고서와 문장 톤을 맞추기 좋아요.
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              강사 메모를 먼저 남겨두면 이후 보고서와 상담 기록에서 같은 관찰 포인트를 반복 없이 재사용할 수 있습니다.
            </p>
          </div>
        </SurfaceCard>
      </div>

      <MemoDialog onClose={() => setDialogOpen(false)} open={dialogOpen} title="메모 작성" />
    </div>
  )
}
