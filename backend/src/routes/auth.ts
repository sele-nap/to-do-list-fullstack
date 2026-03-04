import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database/db'
import { JWT_SECRET } from '../middleware/auth'

const router = Router()

router.post('/register', (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }

  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash)
  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' })

  res.status(201).json({ token })
})

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: number; email: string; password: string }
    | undefined

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    return
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

export default router
