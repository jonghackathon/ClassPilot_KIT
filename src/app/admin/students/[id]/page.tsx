import { AdminStudentDetailManagerPage } from '@/components/admin/admin-students-manager'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AdminStudentDetailManagerPage studentId={id} />
}
