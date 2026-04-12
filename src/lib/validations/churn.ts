import { z } from 'zod'

export const churnUpdateSchema = z
  .object({
    level: z.enum(['SAFE', 'WARNING', 'DANGER']).optional(),
    score: z.coerce.number().min(0).max(100).optional(),
    attendanceFactor: z.coerce.number().min(0).max(100).optional(),
    homeworkFactor: z.coerce.number().min(0).max(100).optional(),
    accessFactor: z.coerce.number().min(0).max(100).optional(),
    questionFactor: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '하나 이상의 수정 항목이 필요합니다.',
  })
