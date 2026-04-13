import type { Metadata } from 'next'
import { TeacherMemoManager } from '@/components/teacher/memo/teacher-memo-manager'

export const metadata: Metadata = {
  title: '메모',
  description: '수업 중 메모, 학생 관찰 기록, 수업 준비 노트를 관리합니다.',
}

export default function Page() {
  return <TeacherMemoManager />
}
