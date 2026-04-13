import type { Metadata } from 'next'
import { StudentHomePage } from '@/components/student/student-home-page'

export const metadata: Metadata = {
  title: '학습 홈',
  description: '오늘의 수업, 과제 마감, 복습 일정을 한 곳에서 확인합니다.',
}

export default function Page() {
  return <StudentHomePage />
}
