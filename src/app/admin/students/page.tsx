import type { Metadata } from 'next'
import { AdminStudentsManagerPage } from '@/components/admin/admin-students-manager'

export const metadata: Metadata = {
  title: '학생 관리',
  description: '등록 학생 목록, 인적사항, 수강반 및 출석률을 통합 관리합니다.',
}

export default function Page() {
  return <AdminStudentsManagerPage />
}
