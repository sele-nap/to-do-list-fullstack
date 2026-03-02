import { Router, Request, Response } from 'express'
import db from '../database/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all()
  res.json(todos)
})

router.post('/', (req: Request, res: Response) => {
  const { title, due_date } = req.body
  const result = db.prepare(
    'INSERT INTO todos (title, due_date) VALUES (?, ?)'
  ).run(title, due_date ?? null)
  const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(newTodo)
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) {
    res.status(404).json({ error: 'Tâche non trouvée' })
    return
  }

  const { title } = req.body

  if (title !== undefined) {
    db.prepare('UPDATE todos SET title = ? WHERE id = ?').run(title, id)
  } else {
    const current = todo as { completed: number }
    const newCompleted = current.completed === 0 ? 1 : 0
    db.prepare('UPDATE todos SET completed = ? WHERE id = ?').run(newCompleted, id)
  }

  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  res.json(updated)
})

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  res.status(204).send()
})

export default router
