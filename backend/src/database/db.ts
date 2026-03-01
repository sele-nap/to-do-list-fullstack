import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(__dirname, '../../todos.db')

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

export default db
