import { TeacherAssignmentDetailManagerPage } from '@/components/assignments/teacher-assignments-manager'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <TeacherAssignmentDetailManagerPage assignmentId={id} />
}
