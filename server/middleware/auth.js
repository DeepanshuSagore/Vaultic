import { getAuth, requireAuth } from '@clerk/express'

export const requireUser = requireAuth()

export function getUserId(req) {
  const { userId } = getAuth(req)

  if (!userId) {
    const error = new Error('Unauthorized')
    error.status = 401
    throw error
  }

  return userId
}
