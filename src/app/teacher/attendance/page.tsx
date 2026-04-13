import type { Metadata } from 'next'
import { TeacherAttendancePage } from '@/components/frontend/teacher-pages'

export const metadata: Metadata = {
  title: '출결 관리',
  description: '수업별 학생 출결을 빠르게 기록하고 통계를 확인합니다.',
}

export default function Page() {
  return <TeacherAttendancePage />
}
