import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { withAuth } from '@/lib/with-auth'

export async function GET() {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session?.user) {
    return error
  }

  try {
    const items = await prisma.appSetting.findMany({
      where: {
        academyId: session.user.academyId,
      },
      orderBy: { key: 'asc' },
    })

    return successResponse(items)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '설정 정보를 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function PATCH(request: Request) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session?.user) {
    return error
  }

  try {
    const body = (await request.json()) as {
      items?: Array<{ key: string; value: unknown }>
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse('VALIDATION', '수정할 설정 항목이 필요합니다.', 400)
    }

    const updates = await Promise.all(
      body.items.map((item) =>
        prisma.appSetting.upsert({
          where: {
            academyId_key: {
              academyId: session.user.academyId,
              key: item.key,
            },
          },
          update: {
            value: item.value,
          },
          create: {
            academyId: session.user.academyId,
            key: item.key,
            value: item.value,
          },
        }),
      ),
    )

    return successResponse(updates)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '설정을 저장하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
