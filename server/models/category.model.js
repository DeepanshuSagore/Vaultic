import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    color: {
      type: String,
      trim: true,
      maxlength: 32,
      default: '',
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 32,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

categorySchema.index({ userId: 1, name: 1 }, { unique: true })

export const Category = mongoose.model('Category', categorySchema)
