import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import todosRouter from './routes/todos'
import authRouter from './routes/auth'
import subtasksRouter from './routes/subtasks'

const app  = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000

// ── Sécurité ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// ── Rate limiting ──────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      20,
  message:  { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max:      200,
  message:  { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }))
app.use(express.json({ limit: '10kb' }))

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',  authLimiter, authRouter)
app.use('/api/todos', apiLimiter,  todosRouter)
app.use('/api/todos', apiLimiter,  subtasksRouter)

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
