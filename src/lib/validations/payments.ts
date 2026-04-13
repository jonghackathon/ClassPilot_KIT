import { z } from 'zod'

export const paymentCreateSchema = z.object({
  studentId: z.string().cuid(),
  classId: z.string().cuid(),
  amount: z.number().int().min(0),
  status: z.enum(['PAID', 'UNPAID', 'PARTIAL']),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  paidAt: z.string().datetime().optional().nullable(),
  note: z.string().optional().nullable(),
})

export const paymentUpdateSchema = paymentCreateSchema.partial()
