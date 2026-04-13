import type { Metadata } from 'next'
import { CurriculumPage } from '@/components/frontend/curriculum-page'

export const metadata: Metadata = {
  title: '커리큘럼',
  description: '과목별 커리큘럼 구성, 단원 순서, 학습 목표를 편집합니다.',
}

export default function Page() {
  return <CurriculumPage />
}
