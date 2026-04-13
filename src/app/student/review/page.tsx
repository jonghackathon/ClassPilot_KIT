import type { Metadata } from 'next'
import { StudentReviewPage } from '@/components/student/student-review-page'

export const metadata: Metadata = {
  title: '복습',
  description: 'AI가 생성한 복습 문제로 지난 수업 내용을 빠르게 되짚습니다.',
}

export default function Page() {
  return <StudentReviewPage />
}
