import type { Metadata } from 'next'
import { TeacherDashboardManager } from '@/components/teacher/teacher-dashboard-manager'

export const metadata: Metadata = {
  title: '강사 홈',
  description: '오늘의 수업 일정, 출결 현황, 피드백 대기 항목을 한 곳에서 확인합니다.',
}

export default function Page() {
  return <TeacherDashboardManager />
}
