import type { Metadata } from 'next'
import { AdminTeachersManagerPage } from '@/components/admin/admin-teachers-manager'

export const metadata: Metadata = {
  title: '강사 관리',
  description: '강사 프로필, 담당 반, 수업 시간을 확인하고 관리합니다.',
}

export default function Page() {
  return <AdminTeachersManagerPage />
}
