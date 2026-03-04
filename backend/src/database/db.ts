import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(__dirname, '../../todos.db')

const db = new Database(dbPath)

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

try { db.exec(`ALTER TABLE todos ADD COLUMN due_date TEXT`) }              catch {}
try { db.exec(`ALTER TABLE todos ADD COLUMN position INTEGER DEFAULT 0`) }   catch {}
try { db.exec(`ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users(id)`) } catch {}
try { db.exec(`ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'none'`) } catch {}
try { db.exec(`ALTER TABLE todos ADD COLUMN notes TEXT`) }                   catch {}
try { db.exec(`ALTER TABLE todos ADD COLUMN category TEXT`) }                catch {}
try { db.exec(`ALTER TABLE todos ADD COLUMN recurrence TEXT DEFAULT 'none'`) } catch {}
try { db.exec(`ALTER TABLE todos ADD COLUMN archived INTEGER DEFAULT 0`) }   catch {}

export default db
