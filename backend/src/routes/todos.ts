import { Router, Request, Response } from 'express'
import db from '../database/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY position ASC').all()
  res.json(todos)
})

router.post('/', (req: Request, res: Response) => {
  db.prepare('UPDATE todos SET position = position + 1').run()
  const { title, due_date } = req.body
  const result = db.prepare(
    'INSERT INTO todos (title, due_date, position) VALUES (?, ?, 0)'
  ).run(title, due_date ?? null)
  const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(newTodo)
})

router.patch('/reorder', (req: Request, res: Response) => {
  const { ids } = req.body as { ids: number[] }
  const update = db.prepare('UPDATE todos SET position = ? WHERE id = ?')
  const updateAll = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      update.run(index, id)
    })
  })
  updateAll(ids)
  res.status(204).send()
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) {
    res.status(404).json({ error: 'Tâche non trouvée' })
    return
  }

  const { title } = (req.body ?? {}) as { title?: string }

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
