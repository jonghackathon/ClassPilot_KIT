import { z } from 'zod'

export const memoCreateSchema = z.object({
  teacherId: z.string().cuid(),
  classId: z.string().cuid().optional().nullable(),
  title: z.string().optional().nullable(),
  content: z.string().min(1),
  category: z.enum(['NOTICE', 'NOTABLE', 'STUDENT_NOTE', 'OTHER']),
  targetName: z.string().optional().nullable(),
  archived: z.boolean().optional(),
})

export const memoUpdateSchema = memoCreateSchema.partial()
