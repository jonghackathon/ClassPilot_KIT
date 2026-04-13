import type { Metadata } from 'next'
import { AdminDashboardManagerPage } from '@/components/admin/admin-dashboard-manager'

export const metadata: Metadata = {
  title: '운영 대시보드',
  description: '미납, 출석 하락, 민원 등 오늘의 리스크 지표를 한 곳에서 확인합니다.',
}

export default function Page() {
  return <AdminDashboardManagerPage />
}
