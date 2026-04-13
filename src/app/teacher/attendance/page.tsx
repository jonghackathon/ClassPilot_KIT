import type { Metadata } from 'next'
import { TeacherAttendanceManager } from '@/components/attendance/teacher-attendance-manager'

export const metadata: Metadata = {
  title: '출결 관리',
  description: '수업별 학생 출결을 빠르게 기록하고 통계를 확인합니다.',
}

export default function Page() {
  return <TeacherAttendanceManager />
}
