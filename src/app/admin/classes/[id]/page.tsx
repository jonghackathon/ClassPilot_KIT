import { AdminClassDetailManagerPage } from '@/components/admin/admin-classes-manager'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AdminClassDetailManagerPage classId={id} />
}
