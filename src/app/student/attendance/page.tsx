import type { Metadata } from 'next'
import { StudentAttendanceManager } from './student-attendance-manager'

export const metadata: Metadata = {
  title: '출결 확인',
  description: '본인의 출결 현황, 지각·결석 내역, 출석률을 확인합니다.',
}

export default function Page() {
  return <StudentAttendanceManager />
}
