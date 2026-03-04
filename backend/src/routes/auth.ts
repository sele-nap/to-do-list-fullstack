import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import db from '../database/db'
import { JWT_SECRET } from '../middleware/auth'

const router = Router()

// ── Schémas zod ────────────────────────────────────────────────────
const AuthSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(254, 'Email too long'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
})

// ── Register ───────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const parsed = AuthSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }
  const { email, password } = parsed.data

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'Email already in use' })
    return
  }

  const hash  = await bcrypt.hash(password, 12)
  const row   = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash)
  const token = jwt.sign({ userId: row.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' })

  res.status(201).json({ token })
})

// ── Login ──────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const parsed = AuthSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }
  const { email, password } = parsed.data

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: number; email: string; password: string }
    | undefined

  // Hash factice : empêche le timing attack même si l'email n'existe pas
  const DUMMY_HASH = '$2a$12$invalidhashtopreventtimingattackxxxxxxxxxxx'
  const match = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)

  if (!user || !match) {
    res.status(401).json({ error: 'Incorrect email or password' })
    return
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

export default router
