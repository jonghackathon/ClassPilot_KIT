import { successResponse } from '@/lib/api-response'
import { withAuth } from '@/lib/with-auth'

export async function POST() {
  const { error } = await withAuth()

  if (error) {
    return error
  }

  return successResponse({ ok: true, message: '클라이언트에서 signOut을 호출해 주세요.' })
}
