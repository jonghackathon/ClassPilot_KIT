import type { Metadata } from 'next'
import { AdminChurnManagerPage } from '@/components/admin/admin-churn-manager'

export const metadata: Metadata = {
  title: '이탈 예측',
  description: 'AI가 분석한 학생 이탈 위험 신호를 확인하고 선제적으로 대응합니다.',
}

export default function Page() {
  return <AdminChurnManagerPage />
}
