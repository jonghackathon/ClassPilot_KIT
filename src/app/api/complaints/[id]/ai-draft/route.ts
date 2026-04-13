import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { buildComplaintDraftPrompt } from '@/lib/ai/prompts'
import { getClaudeClient, getClaudeModel } from '@/lib/ai/claude'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { complaintAiDraftSchema } from '@/lib/validations/complaints'
import { withAuth } from '@/lib/with-auth'

function fallbackDraft(input: {
  studentName: string
  complaintContent: string
  toneHint?: string | null
}) {
  const toneSentence = input.toneHint?.trim()
    ? `${input.toneHint.trim()} 톤을 유지하며`
    : '차분하고 공감하는 톤으로'

  return [
    `${input.studentName} 학생 관련 문의 주셔서 감사합니다. 말씀 주신 내용을 확인했고 불편을 드린 점 먼저 죄송합니다.`,
    `${toneSentence} 현재 전달해주신 내용("${input.complaintContent.slice(0, 80)}")을 기준으로 수업 운영 기록과 담당 선생님 의견을 함께 점검하고 있습니다.`,
    '확인 결과와 가능한 조치 방향을 정리해 다시 안내드리겠으며, 추가로 필요한 내용이 있으면 바로 연락드리겠습니다.',
  ].join('\n\n')
}

function extractText(response: Awaited<ReturnType<ReturnType<typeof getClaudeClient>['messages']['create']>>) {
  return response.content
    .filter((block): block is Extract<(typeof response.content)[number], { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, complaintAiDraftSchema)

  if (validationError || !data) {
    return validationError
  }

  const complaint = await prisma.complaint.findFirst({
    where: {
      id,
      student: {
        academyId: session.user.academyId,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!complaint) {
    return errorResponse('NOT_FOUND', '민원을 찾을 수 없습니다.', 404)
  }

  const fallback = fallbackDraft({
    studentName: complaint.student.name,
    complaintContent: complaint.content,
    toneHint: data.toneHint,
  })

  let aiDraft = fallback

  try {
    const client = getClaudeClient()
    const response = await client.messages.create({
      model: getClaudeModel(),
      max_tokens: 600,
      temperature: 0.35,
      system:
        '학원 운영팀의 민원 1차 답변 초안을 한국어로 작성합니다. 공감, 확인 중인 사실, 후속 조치 약속을 포함하고 과장하거나 단정하지 않습니다.',
      messages: [
        {
          role: 'user',
          content: buildComplaintDraftPrompt({
            studentName: complaint.student.name,
            complaintTitle: complaint.content.split('\n')[0] ?? null,
            complaintContent: complaint.content,
            toneHint: data.toneHint ?? null,
          }),
        },
      ],
    })
    aiDraft = extractText(response) || fallback
  } catch {
    // AI 호출 실패 시에도 운영자가 바로 수정 가능한 초안을 반환한다.
  }

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: { aiDraft },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return successResponse(updated, 201)
}
