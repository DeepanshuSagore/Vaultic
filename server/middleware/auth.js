import { getAuth } from '@clerk/express'

export function requireUser(req, res, next) {
  const { userId } = getAuth(req)

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  return next()
}

export function getUserId(req) {
  const { userId } = getAuth(req)

  if (!userId) {
    const error = new Error('Unauthorized')
    error.status = 401
    throw error
  }

  return userId
}
