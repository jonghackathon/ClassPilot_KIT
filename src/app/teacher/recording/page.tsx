import type { Metadata } from 'next'
import { TeacherRecordingPage } from '@/components/teacher/recording/teacher-recording-page'

export const metadata: Metadata = {
  title: '녹음 정리',
  description: '수업 녹음을 업로드하면 AI가 자동으로 전사하고 핵심 내용을 요약합니다.',
}

export default function Page() {
  return <TeacherRecordingPage />
}
