import { z } from 'zod'

export const reportCreateSchema = z.object({
  studentId: z.string().cuid(),
  monthStr: z.string().regex(/^\d{4}-\d{2}$/),
  comment: z.string().optional().nullable(),
  growth: z.string().optional().nullable(),
  attendanceSummary: z.string().optional().nullable(),
  assignmentSummary: z.string().optional().nullable(),
})

export const reportUpdateSchema = reportCreateSchema.partial()
