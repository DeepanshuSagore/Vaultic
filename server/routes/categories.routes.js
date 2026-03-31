import express from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'

import { getUserId, requireUser } from '../middleware/auth.js'
import { Category } from '../models/category.model.js'
import { Website } from '../models/website.model.js'

const router = express.Router()

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().max(32).optional(),
  icon: z.string().trim().max(32).optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
})

const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  })

function assertObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label} id`)
    error.status = 400
    throw error
  }
}

router.use(requireUser)

router.post('/', async (req, res) => {
  const userId = getUserId(req)
  const payload = categoryCreateSchema.parse(req.body)

  const category = await Category.create({
    userId,
    ...payload,
  })

  res.status(201).json(category)
})

router.get('/', async (req, res) => {
  const userId = getUserId(req)

  const categories = await Category.find({ userId }).sort({
    sortOrder: 1,
    createdAt: 1,
  })

  res.json(categories)
})

router.patch('/:id', async (req, res) => {
  const userId = getUserId(req)
  const { id } = req.params
  const payload = categoryUpdateSchema.parse(req.body)

  assertObjectId(id, 'category')

  const category = await Category.findOneAndUpdate(
    { _id: id, userId },
    payload,
    {
      new: true,
      runValidators: true,
    },
  )

  if (!category) {
    const error = new Error('Category not found')
    error.status = 404
    throw error
  }

  res.json(category)
})

router.delete('/:id', async (req, res) => {
  const userId = getUserId(req)
  const { id } = req.params

  assertObjectId(id, 'category')

  const category = await Category.findOneAndDelete({ _id: id, userId })

  if (!category) {
    const error = new Error('Category not found')
    error.status = 404
    throw error
  }

  await Website.deleteMany({ userId, categoryId: category._id })

  res.status(204).send()
})

export default router
