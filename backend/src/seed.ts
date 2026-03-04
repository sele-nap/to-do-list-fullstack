import bcrypt from 'bcryptjs'
import db from './database/db'

const email    = 'witch@grimoire.com'
const password = 'potion123'

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
if (existing) {
  console.log(`User already exists: ${email}`)
  process.exit(0)
}

const hash   = bcrypt.hashSync(password, 10)
const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash)
const userId = result.lastInsertRowid

const todos = [
  'Brew a moonlight potion',
  'Gather herbs from the forest',
  'Study the ancient grimoire',
  'Polish the crystal ball',
]

todos.forEach((title, i) => {
  db.prepare(
    'INSERT INTO todos (title, position, user_id) VALUES (?, ?, ?)'
  ).run(title, i, userId)
})

console.log('✦ Seed complete!')
console.log(`  email:    ${email}`)
console.log(`  password: ${password}`)
