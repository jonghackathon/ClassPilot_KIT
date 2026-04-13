import type { Metadata } from 'next'
import { AdminClassesManagerPage } from '@/components/admin/admin-classes-manager'

export const metadata: Metadata = {
  title: '반 관리',
  description: '개설된 반의 정원, 강사 배정, 수강생 현황을 관리합니다.',
}

export default function Page() {
  return <AdminClassesManagerPage />
}
