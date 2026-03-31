import { clerkMiddleware } from '@clerk/express'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { connectDatabase } from './db/connect.js'
import { errorHandler } from './middleware/error-handler.js'
import categoriesRouter from './routes/categories.routes.js'
import websitesRouter from './routes/websites.routes.js'

dotenv.config({ path: '.env.local' })

const app = express()

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const port = Number(process.env.PORT || 4000)
const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY

const missingEnv = ['CLERK_SECRET_KEY', 'MONGODB_URI'].filter(
  (name) => !process.env[name] || !process.env[name].trim(),
)

if (!clerkPublishableKey) {
  missingEnv.push('CLERK_PUBLISHABLE_KEY (or VITE_CLERK_PUBLISHABLE_KEY)')
}

if (missingEnv.length > 0) {
  console.error(
    `Missing required env variables: ${missingEnv.join(', ')}. Update .env.local and retry.`,
  )
  process.exit(1)
}

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
)

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
  })
})

app.use(
  clerkMiddleware({
    publishableKey: clerkPublishableKey,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
)

app.use('/api/categories', categoriesRouter)
app.use('/api/websites', websitesRouter)

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorHandler)

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Vaultic API running on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to connect database:', error)
    process.exit(1)
  })
