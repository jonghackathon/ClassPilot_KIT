import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)
  const body = (await request.json().catch(() => null)) as
    | { response?: string; aiDraft?: string; status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' }
    | null

  if (!body?.response?.trim()) {
    return errorResponse('VALIDATION', '응답 내용을 입력해 주세요.', 400)
  }

  const found = await prisma.complaint.findFirst({
    where: {
      id,
      student: { academyId: session.user.academyId },
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '민원을 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      response: body.response,
      aiDraft: body.aiDraft ?? undefined,
      status: body.status ?? 'RESOLVED',
    },
  })

  return successResponse(updated)
}
