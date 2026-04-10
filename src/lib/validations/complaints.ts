import { z } from 'zod'

export const complaintCreateSchema = z.object({
  studentId: z.string().cuid(),
  content: z.string().min(1),
  response: z.string().optional().nullable(),
  aiDraft: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']).optional(),
})

export const complaintUpdateSchema = complaintCreateSchema.partial()
