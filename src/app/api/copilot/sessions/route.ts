import { z } from 'zod'

import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds, teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { parseRequestBody } from '@/lib/route-helpers'
import { getPageParams, withAuth } from '@/lib/with-auth'

const copilotStatuses = new Set(['ACTIVE', 'COMPLETED'] as const)

const sessionCreateSchema = z.object({
  lessonId: z.string().cuid(),
  topic: z.string().trim().min(1).max(200).optional().nullable(),
})

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const { searchParams, page, limit, skip } = getPageParams(request)
    const classId = searchParams.get('classId')
    const lessonId = searchParams.get('lessonId')
    const status = searchParams.get('status')

    if (status && !copilotStatuses.has(status as 'ACTIVE' | 'COMPLETED')) {
      return errorResponse('VALIDATION', '코파일럿 상태 필터가 올바르지 않습니다.', 400)
    }

    const teacherClassIds =
      session.user.role === 'TEACHER' ? await getTeacherClassIds(session.user.id) : []

    const where = {
      lesson: {
        class: {
          academyId: session.user.academyId,
          ...(session.user.role === 'TEACHER' ? { id: { in: teacherClassIds } } : {}),
          ...(classId ? { id: classId } : {}),
        },
      },
      ...(lessonId ? { lessonId } : {}),
      ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }),
      ...(status ? { status: status as 'ACTIVE' | 'COMPLETED' } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.copilotSession.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          lesson: {
            select: {
              id: true,
              date: true,
              topic: true,
              status: true,
              class: { select: { id: true, name: true } },
            },
          },
          questions: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
              id: true,
              question: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.copilotSession.count({ where }),
    ])

    return paginatedResponse(items, total, page, limit)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const { data, error: validationError } = await parseRequestBody(request, sessionCreateSchema)
    if (validationError || !data) {
      return validationError
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
      include: {
        class: {
          select: {
            id: true,
            academyId: true,
            name: true,
          },
        },
      },
    })

    if (!lesson || lesson.class.academyId !== session.user.academyId) {
      return errorResponse('NOT_FOUND', '수업을 찾을 수 없습니다.', 404)
    }

    if (
      session.user.role === 'TEACHER' &&
      !(await teacherHasClassAccess(session.user.id, lesson.classId))
    ) {
      return errorResponse('FORBIDDEN', '담당 반 수업에만 코파일럿 세션을 만들 수 있습니다.', 403)
    }

    const existingActive = await prisma.copilotSession.findFirst({
      where: {
        lessonId: data.lessonId,
        teacherId: session.user.id,
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    if (existingActive) {
      return errorResponse('CONFLICT', '이미 진행 중인 코파일럿 세션이 있습니다.', 409)
    }

    const created = await prisma.copilotSession.create({
      data: {
        lessonId: data.lessonId,
        teacherId: session.user.id,
        topic: data.topic?.trim() || lesson.topic || `${lesson.class.name} 수업 코파일럿`,
        status: 'ACTIVE',
      },
      include: {
        lesson: {
          select: {
            id: true,
            date: true,
            topic: true,
            status: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    })

    return successResponse(created, 201)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 생성하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
