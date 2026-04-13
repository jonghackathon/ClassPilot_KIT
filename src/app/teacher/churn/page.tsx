import type { Metadata } from 'next'
import { TeacherChurnManager } from '@/components/teacher/teacher-churn-manager'

export const metadata: Metadata = {
  title: '이탈 현황',
  description: '담당 반 학생의 이탈 위험 지수와 출석·제출 추이를 확인합니다.',
}

export default function Page() {
  return <TeacherChurnManager />
}
