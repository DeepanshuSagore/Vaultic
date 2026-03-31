import express from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'

import { getUserId, requireUser } from '../middleware/auth.js'
import { Category } from '../models/category.model.js'
import { Website } from '../models/website.model.js'
import { normalizeUrl, titleFromUrl } from '../utils/normalize-url.js'

const router = express.Router()

const websiteCreateSchema = z.object({
  categoryId: z.string().trim().min(1),
  url: z.string().trim().min(1).max(2048),
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
})

const websiteUpdateSchema = z
  .object({
    categoryId: z.string().trim().min(1).optional(),
    url: z.string().trim().min(1).max(2048).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().max(2000).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  })

const websiteMoveSchema = z.object({
  categoryId: z.string().trim().min(1),
})

const listQuerySchema = z.object({
  categoryId: z.string().trim().optional(),
  isArchived: z.enum(['true', 'false']).optional(),
  isFavorite: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
})

const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
})

function assertObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label} id`)
    error.status = 400
    throw error
  }
}

function cleanTags(tags) {
  if (!tags) {
    return []
  }

  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
}

async function assertCategoryOwnership(userId, categoryId) {
  assertObjectId(categoryId, 'category')

  const category = await Category.findOne({
    _id: categoryId,
    userId,
  }).select('_id')

  if (!category) {
    const error = new Error('Category not found')
    error.status = 404
    throw error
  }
}

router.use(requireUser)

router.post('/', async (req, res) => {
  const userId = getUserId(req)
  const payload = websiteCreateSchema.parse(req.body)

  await assertCategoryOwnership(userId, payload.categoryId)

  const normalizedUrl = normalizeUrl(payload.url)

  const website = await Website.create({
    userId,
    categoryId: payload.categoryId,
    url: payload.url,
    normalizedUrl,
    title: payload.title || titleFromUrl(payload.url),
    notes: payload.notes || '',
    tags: cleanTags(payload.tags),
    isFavorite: payload.isFavorite ?? false,
    isArchived: payload.isArchived ?? false,
  })

  res.status(201).json(website)
})

router.get('/', async (req, res) => {
  const userId = getUserId(req)
  const query = listQuerySchema.parse(req.query)
  const filter = { userId }

  if (query.categoryId) {
    assertObjectId(query.categoryId, 'category')
    filter.categoryId = query.categoryId
  }

  if (query.isArchived) {
    filter.isArchived = query.isArchived === 'true'
  }

  if (query.isFavorite) {
    filter.isFavorite = query.isFavorite === 'true'
  }

  const websites = await Website.find(filter)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(query.limit)

  res.json(websites)
})

router.get('/search', async (req, res) => {
  const userId = getUserId(req)
  const { q } = searchQuerySchema.parse(req.query)

  if (!q || q.length < 2) {
    return res.json([])
  }

  const websites = await Website.find(
    {
      userId,
      $text: { $search: q },
    },
    {
      score: { $meta: 'textScore' },
    },
  )
    .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
    .limit(100)

  return res.json(websites)
})

router.patch('/:id/move', async (req, res) => {
  const userId = getUserId(req)
  const { id } = req.params
  const { categoryId } = websiteMoveSchema.parse(req.body)

  assertObjectId(id, 'website')
  await assertCategoryOwnership(userId, categoryId)

  const website = await Website.findOneAndUpdate(
    { _id: id, userId },
    { categoryId },
    { new: true, runValidators: true },
  )

  if (!website) {
    const error = new Error('Website not found')
    error.status = 404
    throw error
  }

  res.json(website)
})

router.patch('/:id', async (req, res) => {
  const userId = getUserId(req)
  const { id } = req.params
  const payload = websiteUpdateSchema.parse(req.body)

  assertObjectId(id, 'website')

  if (payload.categoryId) {
    await assertCategoryOwnership(userId, payload.categoryId)
  }

  const update = { ...payload }

  if (payload.tags) {
    update.tags = cleanTags(payload.tags)
  }

  if (payload.url) {
    update.normalizedUrl = normalizeUrl(payload.url)

    if (!payload.title) {
      update.title = titleFromUrl(payload.url)
    }
  }

  const website = await Website.findOneAndUpdate({ _id: id, userId }, update, {
    new: true,
    runValidators: true,
  })

  if (!website) {
    const error = new Error('Website not found')
    error.status = 404
    throw error
  }

  res.json(website)
})

router.delete('/:id', async (req, res) => {
  const userId = getUserId(req)
  const { id } = req.params

  assertObjectId(id, 'website')

  const deleted = await Website.findOneAndDelete({ _id: id, userId })

  if (!deleted) {
    const error = new Error('Website not found')
    error.status = 404
    throw error
  }

  res.status(204).send()
})

export default router
