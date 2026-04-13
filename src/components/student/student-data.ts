export type ApiEnvelope<T> = {
  success: boolean
  data: T
}

export type PaginatedData<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function unwrapItems<T>(response?: ApiEnvelope<PaginatedData<T>>) {
  return response?.data.items ?? []
}

export function formatKoreanDate(value?: string | Date | null) {
  if (!value) {
    return '날짜 미정'
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '날짜 미정'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

export function formatKoreanDateTime(value?: string | Date | null) {
  if (!value) {
    return '기록 없음'
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '기록 없음'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
