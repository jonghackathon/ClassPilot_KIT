import { StudentAssignmentDetailPage } from '@/components/student/student-assignment-detail-page'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <StudentAssignmentDetailPage assignmentId={id} />
}
