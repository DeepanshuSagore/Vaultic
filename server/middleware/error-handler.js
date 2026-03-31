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

  const status = error && typeof error.status === 'number' ? error.status : 500
  const message =
    status >= 500
      ? 'Internal server error'
      : error && error.message
        ? error.message
        : 'Request failed'

  return res.status(status).json({ message })
}
