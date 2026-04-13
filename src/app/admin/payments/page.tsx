import type { Metadata } from 'next'
import { AdminPaymentsManagerPage } from '@/components/admin/admin-payments-manager'

export const metadata: Metadata = {
  title: '수강료 관리',
  description: '수강료 납부 현황, 미납 내역, 정산 이력을 확인하고 처리합니다.',
}

export default function Page() {
  return <AdminPaymentsManagerPage />
}
