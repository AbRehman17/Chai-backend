import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    console.log('URI:', process.env.MONGO_DB_URI)
    const connectionInstance = await mongoose.connect(process.env.MONGO_DB_URI)
    console.log(
      `MongoDB connected to host: ${connectionInstance.connection.host}`,
    )
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    throw error
  }
}

export default connectDB
