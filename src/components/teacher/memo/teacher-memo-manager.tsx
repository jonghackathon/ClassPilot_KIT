'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Archive, NotebookPen, Search, Save, Sparkles, Star, X } from 'lucide-react'

import { apiRequest } from '@/lib/fetcher'
import { useClasses } from '@/hooks/useClasses'
import { useMemoData } from '@/hooks/useMemo'
import {
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type MemoCategory = 'NOTICE' | 'NOTABLE' | 'STUDENT_NOTE' | 'OTHER'

type MemoItem = {
  id: string
  title?: string | null
  content: string
  category: MemoCategory
  targetName?: string | null
  archived?: boolean
  classId?: string | null
  class?: { id: string; name: string } | null
  teacher?: { id: string; name: string; email: string } | null
  createdAt?: string
  updatedAt?: string
}

type MemoDraft = {
  title: string
  content: string
  category: MemoCategory
  targetName: string
  classId: string
  archived: boolean
}

function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[680px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Teacher Memo</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

const categoryTone: Record<MemoCategory, 'violet' | 'sky' | 'emerald' | 'amber' | 'slate'> = {
  NOTICE: 'violet',
  NOTABLE: 'amber',
  STUDENT_NOTE: 'sky',
  OTHER: 'slate',
}

function categoryLabel(category: MemoCategory) {
  switch (category) {
    case 'NOTICE':
      return '수업운영'
    case 'NOTABLE':
      return '중요'
    case 'STUDENT_NOTE':
      return '학생관찰'
    default:
      return '기타'
  }
}

const emptyDraft: MemoDraft = {
  title: '',
  content: '',
  category: 'NOTICE',
  targetName: '',
  classId: '',
  archived: false,
}

export function TeacherMemoManager() {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'전체' | MemoCategory>('전체')
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState<MemoItem | null>(null)
  const [draft, setDraft] = useState<MemoDraft>(emptyDraft)

  const classesResponse = useClasses<{ data?: { items?: Array<{ id: string; name: string }> } }>()
  const classes = classesResponse.data?.data?.items ?? []

  useEffect(() => {
    if (!selectedClassId && classes[0]?.id) {
      setSelectedClassId(classes[0].id)
      setDraft((current) => ({ ...current, classId: classes[0].id }))
    }
  }, [classes, selectedClassId])

  const memoQuery = useMemo(() => {
    const params = new URLSearchParams()

    if (selectedClassId) {
      params.set('classId', selectedClassId)
    }

    if (selectedCategory !== '전체') {
      params.set('category', selectedCategory)
    }

    if (!showArchived) {
      params.set('archived', 'false')
    }

    const value = params.toString()
    return value ? `?${value}` : ''
  }, [selectedClassId, selectedCategory, showArchived])

  const memoResponse = useMemoData<{ data?: { items?: MemoItem[] } }>(memoQuery)
  const memoItems = memoResponse.data?.data?.items ?? []

  const filteredItems = useMemo(
    () =>
      memoItems.filter((item) => {
        if (!showArchived && item.archived) {
          return false
        }

        if (query.trim()) {
          const keyword = query.toLowerCase()
          const searchTarget = `${item.title ?? ''} ${item.targetName ?? ''} ${item.content} ${item.class?.name ?? ''}`.toLowerCase()
          if (!searchTarget.includes(keyword)) {
            return false
          }
        }

        return true
      }),
    [memoItems, query, showArchived],
  )

  const openModal = (item?: MemoItem) => {
    setEditingMemo(item ?? null)
    setDraft(
      item
        ? {
            title: item.title ?? '',
            content: item.content ?? '',
            category: item.category ?? 'NOTICE',
            targetName: item.targetName ?? '',
            classId: item.classId ?? selectedClassId,
            archived: item.archived ?? false,
          }
        : {
            ...emptyDraft,
            classId: selectedClassId,
          },
    )
    setDialogOpen(true)
  }

  const saveMemo = async () => {
    if (!draft.content.trim()) {
      return
    }

    const payload = {
      title: draft.title.trim() || null,
      content: draft.content.trim(),
      category: draft.category,
      targetName: draft.targetName.trim() || null,
      classId: draft.classId || null,
      archived: draft.archived,
    }

    if (editingMemo) {
      await apiRequest(`/api/memo/${editingMemo.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/memo', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    await memoResponse.mutate()
    setDialogOpen(false)
    setEditingMemo(null)
  }

  const deleteMemo = async (id: string) => {
    await apiRequest(`/api/memo/${id}`, { method: 'DELETE' })
    await memoResponse.mutate()
  }

  const toggleArchived = async (item: MemoItem) => {
    await apiRequest(`/api/memo/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: !item.archived }),
    })
    await memoResponse.mutate()
  }

  const activeCount = memoItems.filter((item) => !item.archived).length
  const archivedCount = memoItems.filter((item) => item.archived).length
  const importantCount = memoItems.filter((item) => item.category === 'NOTABLE').length

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="강사 메모"
        title="학생, 반, 수업 메모를 실데이터로 기록하고 보관해요"
        description="메모 카드와 보관 흐름을 API에 연결해서, 검색과 아카이브 전환까지 실제 저장소 기준으로 움직이게 했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
            onClick={() => openModal()}
            type="button"
          >
            <NotebookPen className="h-4 w-4" />
            메모 작성
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="활성 메모" value={`${activeCount}개`} detail="즉시 참고 가능" icon={NotebookPen} tone="violet" />
        <MetricCard label="중요 메모" value={`${importantCount}개`} detail="강조 확인 항목" icon={Star} tone="amber" />
        <MetricCard label="보관 메모" value={`${archivedCount}개`} detail="히스토리 아카이브" icon={Archive} tone="slate" />
      </div>

      <SurfaceCard>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="학생, 반 이름, 메모 내용으로 찾기"
              value={query}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(['전체', 'NOTICE', 'NOTABLE', 'STUDENT_NOTE', 'OTHER'] as const).map((item) => (
              <button
                key={item}
                className={cx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  selectedCategory === item
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setSelectedCategory(item)}
                type="button"
              >
                {item === '전체' ? item : categoryLabel(item)}
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
          <label className="flex min-w-[220px] max-w-[360px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Class</span>
            <select
              className="w-full bg-transparent text-sm text-slate-800 outline-none"
              onChange={(event) => {
                setSelectedClassId(event.target.value)
                setDraft((current) => ({ ...current, classId: event.target.value }))
              }}
              value={selectedClassId}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <SurfaceCard key={item.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-950">{item.title || '제목 없음'}</h2>
                      {item.archived ? <StatusBadge label="보관" tone="slate" /> : <StatusBadge label="활성" tone="emerald" />}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.class?.name ?? '반 미지정'} · {item.targetName ?? '대상 없음'}
                    </p>
                  </div>
                  <StatusBadge label={categoryLabel(item.category)} tone={categoryTone[item.category]} />
                </div>
                <p className="text-sm leading-7 text-slate-600">{item.content}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
                    onClick={() => openModal(item)}
                    type="button"
                  >
                    수정
                  </button>
                  <button
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
                    onClick={() => toggleArchived(item)}
                    type="button"
                  >
                    {item.archived ? '보관 해제' : '보관'}
                  </button>
                  <button
                    className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                    onClick={() => deleteMemo(item.id)}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="h-fit">
          <SectionHeading
            title="메모 활용 가이드"
            subtitle="수업운영, 학생관찰, 기타 메모를 같은 리듬으로 관리합니다."
          />
          <div className="mt-5 space-y-3">
            {[
              '수업운영 메모는 보고서와 이어질 수 있게 간결한 문장으로 남김',
              '학생관찰 메모는 다음 행동과 체크 포인트를 함께 기록',
              '보관 메모는 나중에 다시 꺼내볼 수 있도록 대상명을 함께 저장',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              메모 저장과 보관 전환이 실제 API에 연결돼 있습니다.
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              수업 중 관찰한 내용을 바로 남기면 상담, 보고서, 반 운영 메모로 자연스럽게 재활용할 수 있습니다.
            </p>
          </div>
        </SurfaceCard>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingMemo ? '메모 수정' : '메모 작성'}
        description="수업운영, 학생관찰, 기타 메모를 한 번에 저장합니다."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">제목</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              value={draft.title}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">대상명</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setDraft((current) => ({ ...current, targetName: event.target.value }))}
              value={draft.targetName}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">카테고리</span>
            <select
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as MemoCategory }))}
              value={draft.category}
            >
              <option value="NOTICE">수업운영</option>
              <option value="NOTABLE">중요</option>
              <option value="STUDENT_NOTE">학생관찰</option>
              <option value="OTHER">기타</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">반</span>
            <select
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setDraft((current) => ({ ...current, classId: event.target.value }))}
              value={draft.classId}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">메모 내용</span>
          <textarea
            className="min-h-[160px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
            value={draft.content}
          />
        </label>
        <button
          className={cx(
            'flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left text-sm font-medium transition',
            draft.archived ? 'bg-slate-100 text-slate-600' : 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
          )}
          onClick={() => setDraft((current) => ({ ...current, archived: !current.archived }))}
          type="button"
        >
          <span>보관 상태</span>
          <span>{draft.archived ? 'ARCHIVED' : 'ACTIVE'}</span>
        </button>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
            onClick={() => setDialogOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
            onClick={saveMemo}
            type="button"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
        </div>
      </Dialog>
    </div>
  )
}
