import type { Metadata } from 'next'
import { StudentQnaPage } from '@/components/student/student-qna-page'

export const metadata: Metadata = {
  title: '질문하기',
  description: '수업 내용이 궁금하면 AI 질문봇에게 바로 물어보세요.',
}

export default function Page() {
  return <StudentQnaPage />
}
