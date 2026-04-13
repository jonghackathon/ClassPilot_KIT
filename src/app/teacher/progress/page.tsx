import type { Metadata } from 'next'
import { TeacherProgressManager } from '@/components/teacher/progress/teacher-progress-manager'

export const metadata: Metadata = {
  title: '진도 관리',
  description: '반별 커리큘럼 진도 현황을 확인하고 AI 복습 문제를 생성합니다.',
}

export default function Page() {
  return <TeacherProgressManager />
}
