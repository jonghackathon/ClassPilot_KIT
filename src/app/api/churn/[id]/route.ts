import { prisma } from '@/lib/db'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { errorResponse, successResponse } from '@/lib/api-response'
import { parseRequestBody } from '@/lib/route-helpers'
import { churnUpdateSchema } from '@/lib/validations/churn'
import { withAuth } from '@/lib/with-auth'

type Params = Promise<{ id: string }>

function studentSelect() {
  return {
    id: true,
    name: true,
    email: true,
    studentProfile: {
      select: {
        grade: true,
      },
    },
    enrollments: {
      where: {
        active: true,
      },
      select: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  }
}

async function getScopedWhere(
  id: string,
  sessionUser: { academyId: string; role: string; id: string },
) {
  if (sessionUser.role === 'TEACHER') {
    const teacherStudentIds = await getTeacherStudentIds(sessionUser.id)
    return {
      id,
      student: {
        academyId: sessionUser.academyId,
      },
      studentId: {
        in: teacherStudentIds,
      },
    }
  }

  return {
    id,
    student: {
      academyId: sessionUser.academyId,
    },
  }
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const authResult = await withAuth(['ADMIN', 'TEACHER'])

  if (authResult.error) {
    return authResult.error
  }

  const { session } = authResult

  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', '로그인이 필요합니다.', 401)
  }

  try {
    const { id } = await params
    const where = await getScopedWhere(id, session.user)

    const item = await prisma.churnPrediction.findFirst({
      where,
      include: {
        student: {
          select: studentSelect(),
        },
      },
    })

    if (!item) {
      return errorResponse('NOT_FOUND', '이탈 예측 정보를 찾을 수 없습니다.', 404)
    }

    return successResponse(item)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '이탈 예측 상세를 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const authResult = await withAuth(['ADMIN', 'TEACHER'])

  if (authResult.error) {
    return authResult.error
  }

  const { session } = authResult

  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', '로그인이 필요합니다.', 401)
  }

  try {
    const { id } = await params
    const { data, error: validationError } = await parseRequestBody(request, churnUpdateSchema)

    if (validationError) {
      return validationError
    }

    if (!data) {
      return errorResponse('VALIDATION', '입력값이 올바르지 않습니다.', 400)
    }

    const existing = await prisma.churnPrediction.findFirst({
      where: await getScopedWhere(id, session.user),
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', '이탈 예측 정보를 찾을 수 없습니다.', 404)
    }

    const updated = await prisma.churnPrediction.update({
      where: { id },
      data: {
        ...(data.level ? { level: data.level } : {}),
        ...(typeof data.score === 'number'
          ? { score: Math.max(0, Math.min(100, data.score)) }
          : {}),
        ...(typeof data.attendanceFactor === 'number'
          ? { attendanceFactor: Math.max(0, Math.min(100, data.attendanceFactor)) }
          : {}),
        ...(typeof data.homeworkFactor === 'number'
          ? { homeworkFactor: Math.max(0, Math.min(100, data.homeworkFactor)) }
          : {}),
        ...(typeof data.accessFactor === 'number'
          ? { accessFactor: Math.max(0, Math.min(100, data.accessFactor)) }
          : {}),
        ...(typeof data.questionFactor === 'number'
          ? { questionFactor: Math.max(0, Math.min(100, data.questionFactor)) }
          : {}),
      },
      include: {
        student: {
          select: studentSelect(),
        },
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '이탈 예측 정보를 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const authResult = await withAuth(['ADMIN'])

  if (authResult.error) {
    return authResult.error
  }

  const { session } = authResult

  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', '로그인이 필요합니다.', 401)
  }

  try {
    const { id } = await params

    const existing = await prisma.churnPrediction.findFirst({
      where: await getScopedWhere(id, session.user),
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', '이탈 예측 정보를 찾을 수 없습니다.', 404)
    }

    await prisma.churnPrediction.delete({ where: { id } })

    return successResponse({ id, deleted: true })
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '이탈 예측 정보를 삭제하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
