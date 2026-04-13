import type { Metadata } from 'next'
import { AdminComplaintsManagerPage } from '@/components/admin/admin-complaints-manager'

export const metadata: Metadata = {
  title: '민원 관리',
  description: '학부모·학생 민원을 접수·처리하고 AI 초안으로 빠르게 답변합니다.',
}

export default function Page() {
  return <AdminComplaintsManagerPage />
}
