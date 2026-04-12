import { StudentReviewDetailPage } from '@/components/student/student-review-detail-page'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <StudentReviewDetailPage reviewId={id} />
}
