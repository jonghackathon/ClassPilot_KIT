import type { Metadata } from 'next'
import { AdminScheduleManagerPage } from '@/components/admin/admin-schedule-manager'

export const metadata: Metadata = {
  title: '시간표 관리',
  description: '반별 수업 시간표를 확인하고 일정 충돌 없이 편성합니다.',
}

export default function Page() {
  return <AdminScheduleManagerPage />
}
