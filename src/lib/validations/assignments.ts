import { z } from 'zod'

export const assignmentCreateSchema = z.object({
  classId: z.string().cuid(),
  teacherId: z.string().cuid(),
  title: z.string().min(1),
  content: z.string().optional().nullable(),
  type: z.enum(['CODING', 'ESSAY', 'IMAGE']),
  dueDate: z.string().datetime().optional().nullable(),
  teacherNote: z.string().optional().nullable(),
  imageUrls: z.array(z.string().url()).optional(),
})

export const assignmentUpdateSchema = assignmentCreateSchema.partial()

export const submissionSchema = z.object({
  content: z.string().optional().nullable(),
  attachments: z.array(z.string().url()).optional(),
  aiUsed: z.boolean().optional(),
  aiUsageDetail: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
})

export const feedbackSchema = z.object({
  teacherFeedback: z.string().min(1),
  feedback: z.string().optional().nullable(),
})
