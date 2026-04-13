import { z } from 'zod'

export const weekNoteCreateSchema = z.object({
  classId: z.string().cuid(),
  scheduleId: z.string().cuid().optional().nullable(),
  lessonId: z.string().cuid().optional().nullable(),
  date: z.string().datetime(),
  content: z.string().min(1),
  studentReaction: z.string().optional().nullable(),
  curriculumStage: z.string().optional().nullable(),
  curriculumLesson: z.string().optional().nullable(),
  autoAssign: z.boolean().optional(),
})

export const weekNoteUpdateSchema = weekNoteCreateSchema.partial()
