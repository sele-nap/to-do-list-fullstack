import { Router, Response } from 'express'
import db from '../database/db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

// GET  /api/todos/:todoId/subtasks
router.get('/:todoId/subtasks', (req: AuthRequest, res: Response) => {
  const { todoId } = req.params
  // Vérifie que le todo appartient à l'utilisateur
  const todo = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').get(todoId, req.userId)
  if (!todo) { res.status(404).json({ error: 'Todo not found' }); return }

  const subtasks = db.prepare(
    'SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC, id ASC'
  ).all(todoId)
  res.json(subtasks)
})

// POST /api/todos/:todoId/subtasks
router.post('/:todoId/subtasks', (req: AuthRequest, res: Response) => {
  const { todoId } = req.params
  const todo = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').get(todoId, req.userId)
  if (!todo) { res.status(404).json({ error: 'Todo not found' }); return }

  const { title } = req.body
  if (!title?.trim()) { res.status(400).json({ error: 'Title is required' }); return }

  const maxPos = (db.prepare('SELECT MAX(position) as m FROM subtasks WHERE todo_id = ?').get(todoId) as any)?.m ?? -1
  const result = db.prepare(
    'INSERT INTO subtasks (todo_id, title, position) VALUES (?, ?, ?)'
  ).run(todoId, title.trim(), maxPos + 1)

  res.status(201).json(db.prepare('SELECT * FROM subtasks WHERE id = ?').get(result.lastInsertRowid))
})

// PATCH /api/todos/:todoId/subtasks/:id/toggle
router.patch('/:todoId/subtasks/:id/toggle', (req: AuthRequest, res: Response) => {
  const { todoId, id } = req.params
  const todo = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').get(todoId, req.userId)
  if (!todo) { res.status(404).json({ error: 'Todo not found' }); return }

  const sub = db.prepare('SELECT * FROM subtasks WHERE id = ? AND todo_id = ?').get(id, todoId) as any
  if (!sub) { res.status(404).json({ error: 'Subtask not found' }); return }

  db.prepare('UPDATE subtasks SET completed = ? WHERE id = ?').run(sub.completed ? 0 : 1, id)
  res.json(db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id))
})

// PUT  /api/todos/:todoId/subtasks/:id  — rename
router.put('/:todoId/subtasks/:id', (req: AuthRequest, res: Response) => {
  const { todoId, id } = req.params
  const todo = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').get(todoId, req.userId)
  if (!todo) { res.status(404).json({ error: 'Todo not found' }); return }

  const { title } = req.body
  if (!title?.trim()) { res.status(400).json({ error: 'Title is required' }); return }

  db.prepare('UPDATE subtasks SET title = ? WHERE id = ? AND todo_id = ?').run(title.trim(), id, todoId)
  res.json(db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id))
})

// DELETE /api/todos/:todoId/subtasks/:id
router.delete('/:todoId/subtasks/:id', (req: AuthRequest, res: Response) => {
  const { todoId, id } = req.params
  const todo = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').get(todoId, req.userId)
  if (!todo) { res.status(404).json({ error: 'Todo not found' }); return }

  db.prepare('DELETE FROM subtasks WHERE id = ? AND todo_id = ?').run(id, todoId)
  res.status(204).send()
})

export default router
