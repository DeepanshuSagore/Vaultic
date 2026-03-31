import mongoose from 'mongoose'

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI in environment variables')
  }

  const dbName = process.env.MONGODB_DB_NAME || undefined

  await mongoose.connect(mongoUri, { dbName })
}
