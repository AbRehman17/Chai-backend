import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      // By cloudinary
      type: Number,
      required: true,
    },
    videoFile: {
      type: String, // Cloudinary url
      required: true,
    },
    thumbNail: {
      type: String, // Cloudinary url
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
)

videoSchema.plugin([mongooseAggregatePaginate])
export const Video = mongoose.model('Video', videoSchema)
