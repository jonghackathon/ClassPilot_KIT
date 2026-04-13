import type { Metadata } from 'next'
import { TeacherBotManager } from '@/components/teacher/bot/teacher-bot-manager'

export const metadata: Metadata = {
  title: '질문봇 관리',
  description: '학생 질문봇의 응답 이력을 확인하고 학습 데이터를 보완합니다.',
}

export default function Page() {
  return <TeacherBotManager />
}
