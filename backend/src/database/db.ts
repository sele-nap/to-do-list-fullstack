import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(__dirname, '../../todos.db')
const db = new Database(dbPath)

// ── Tables principales ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    email    TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    completed  INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    user_id    INTEGER REFERENCES users(id)
  )
`)

// ── Migrations idempotentes ───────────────────────────────────────
const alterTodo = (sql: string) => { try { db.exec(sql) } catch {} }
alterTodo(`ALTER TABLE todos ADD COLUMN due_date   TEXT`)
alterTodo(`ALTER TABLE todos ADD COLUMN position   INTEGER DEFAULT 0`)
alterTodo(`ALTER TABLE todos ADD COLUMN priority   TEXT DEFAULT 'none'`)
alterTodo(`ALTER TABLE todos ADD COLUMN notes      TEXT`)
alterTodo(`ALTER TABLE todos ADD COLUMN category   TEXT`)
alterTodo(`ALTER TABLE todos ADD COLUMN recurrence TEXT DEFAULT 'none'`)
alterTodo(`ALTER TABLE todos ADD COLUMN archived   INTEGER DEFAULT 0`)

// ── Sous-tâches ───────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS subtasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id    INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    completed  INTEGER DEFAULT 0,
    position   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

export default db
