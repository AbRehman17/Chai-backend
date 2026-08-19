import mongoose from 'mongoose'
const subscriptionSchema = mongoose.Schema(
  {
    subscriber: {
      // one who is subscribing
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    channel: {
      // one to whom subscriber subscribes
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
)
export const Subscription = mongoose.model('Subscription', subscriptionSchema)
