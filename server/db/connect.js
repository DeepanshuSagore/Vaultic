import mongoose from 'mongoose'

let cachedConnection = null

export async function connectDatabase() {
  // If we already have an active connection, reuse it (important for serverless)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection
  }

  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI in environment variables')
  }

  console.log(
    'Connecting to MongoDB:',
    mongoUri.replace(/\/\/.*@/, '//***:***@'),
  )

  const dbName = process.env.MONGODB_DB_NAME || undefined

  cachedConnection = await mongoose.connect(mongoUri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  })
  console.log('MongoDB connected successfully')

  return cachedConnection
}
