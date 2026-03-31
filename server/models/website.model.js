import mongoose from 'mongoose'

const websiteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    normalizedUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

websiteSchema.index({ userId: 1, normalizedUrl: 1 }, { unique: true })
websiteSchema.index({ userId: 1, categoryId: 1, updatedAt: -1 })
websiteSchema.index({ userId: 1, isArchived: 1, isFavorite: 1 })
websiteSchema.index({ userId: 1, title: 'text', notes: 'text', tags: 'text' })

export const Website = mongoose.model('Website', websiteSchema)
