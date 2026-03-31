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

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
)

app.use(express.json())
app.use(clerkMiddleware())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
  })
})

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
