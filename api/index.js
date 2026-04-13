import { connectDatabase } from '../server/db/connect.js'
import app from '../server/index.js'

// Ensure the database connection is established before handling the request
export default async function handler(req, res) {
  await connectDatabase()
  return app(req, res)
}
