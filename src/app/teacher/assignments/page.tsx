import type { Metadata } from 'next'
import { TeacherAssignmentsManagerPage } from '@/components/assignments/teacher-assignments-manager'

export const metadata: Metadata = {
  title: '과제 관리',
  description: '과제를 출제하고 제출 현황과 AI 첨삭 결과를 확인합니다.',
}

export default function Page() {
  return <TeacherAssignmentsManagerPage />
}
