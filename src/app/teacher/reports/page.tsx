import type { Metadata } from 'next'
import { TeacherReportsPage } from '@/components/teacher/reports/teacher-reports-page'

export const metadata: Metadata = {
  title: '보고서',
  description: '반별·학생별 학습 성과 보고서를 생성하고 공유합니다.',
}

export default function Page() {
  return <TeacherReportsPage />
}
