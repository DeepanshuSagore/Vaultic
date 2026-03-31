import { ZodError } from 'zod'

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  if (error && error.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate record already exists',
      details: error.keyValue ?? null,
    })
  }

  if (error && error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier format' })
  }

  const statusCandidates = [
    error && typeof error.status === 'number' ? error.status : undefined,
    error && typeof error.statusCode === 'number' ? error.statusCode : undefined,
    error && typeof error.code === 'number' ? error.code : undefined,
  ]

  const status =
    statusCandidates.find(
      (candidate) => typeof candidate === 'number' && candidate >= 400,
    ) ?? (error && error.clerkError ? 401 : 500)

  const clerkMessage =
    error && error.clerkError && Array.isArray(error.errors) && error.errors[0]
      ? error.errors[0].longMessage || error.errors[0].message
      : undefined

  const message =
    status >= 500
      ? 'Internal server error'
      : clerkMessage
        ? clerkMessage
      : error && error.message
        ? error.message
        : 'Request failed'

  return res.status(status).json({ message })
}
