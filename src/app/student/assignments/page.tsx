import type { Metadata } from 'next'
import { StudentAssignmentsPage } from '@/components/student/student-assignments-page'

export const metadata: Metadata = {
  title: '과제',
  description: '제출 기한이 남은 과제와 AI 피드백이 도착한 과제를 확인합니다.',
}

export default function Page() {
  return <StudentAssignmentsPage />
}
