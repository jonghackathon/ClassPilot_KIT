import { TeacherRecordingDetailPage } from '@/components/teacher/recording/teacher-recording-detail-page'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <TeacherRecordingDetailPage id={id} />
}
