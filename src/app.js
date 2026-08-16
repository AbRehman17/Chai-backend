import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
const app = express()
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
)
app.use(express.json({ limit: '16kb' })) // Configure data from forms
app.use(express.urlencoded({ extended: true, limit: '16kb' })) // Configure data coming from urls
app.use(express.static('public')) // Configure data from public folder
app.use(cookieParser()) //User browser cookies access

//routes import
import userRouter from './routes/user.routes.js'

// routes declaration
app.use('/api/v1/users', userRouter) // Good practice ky hum apni apis bna rhy
// localhost:8000/api/v1/user/register{userRouter:Routes}
export { app }
