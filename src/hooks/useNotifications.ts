'use client'

import useSWR from 'swr'

type NotificationTone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type NotificationAudience = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ALL'

export type NotificationItem = {
  id: string
  title: string
  detail: string
  href: string | null
  tone: NotificationTone
  audience: NotificationAudience
  source: 'system' | 'manual'
  createdAt: string
}

type NotificationsPayload = {
  items: NotificationItem[]
  total: number
  unreadCount: number
}

type ApiEnvelope<T> = {
  success: boolean
  data: T
}

export function useNotifications(limit = 5) {
  const response = useSWR<ApiEnvelope<NotificationsPayload>>(`/api/notifications?limit=${limit}`)

  return {
    ...response,
    items: response.data?.data.items ?? [],
    unreadCount: response.data?.data.unreadCount ?? 0,
    total: response.data?.data.total ?? 0,
  }
}
