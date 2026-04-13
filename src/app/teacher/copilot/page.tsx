import type { Metadata } from 'next'
import { TeacherCopilotLandingPage } from '@/components/teacher/copilot/teacher-copilot-landing-page'

export const metadata: Metadata = {
  title: 'AI 코파일럿',
  description: 'AI가 수업 흐름, 질문 응답, 학습 전략을 실시간으로 보조합니다.',
}

export default function Page() {
  return <TeacherCopilotLandingPage />
}
