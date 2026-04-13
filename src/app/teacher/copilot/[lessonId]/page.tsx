import { TeacherCopilotSessionPage } from '@/components/teacher/copilot/teacher-copilot-session-page'

export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = await params

  return <TeacherCopilotSessionPage lessonId={lessonId} />
}
