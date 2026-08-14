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
