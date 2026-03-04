import { Router, Response } from 'express'
import db from '../database/db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

// Calcule la prochaine date pour une tâche récurrente
function getNextDate(dueDate: string | null, recurrence: string): string {
  const base = dueDate ? new Date(dueDate + 'T12:00:00') : new Date()
  switch (recurrence) {
    case 'daily':   base.setDate(base.getDate() + 1);    break
    case 'weekly':  base.setDate(base.getDate() + 7);    break
    case 'monthly': base.setMonth(base.getMonth() + 1);  break
  }
  return base.toISOString().split('T')[0]
}

// GET /stats — doit être avant /:id pour ne pas être intercepté
router.get('/stats', (req: AuthRequest, res: Response) => {
  const todos = db.prepare(
    'SELECT * FROM todos WHERE user_id = ? AND archived = 0'
  ).all(req.userId) as any[]

  const total     = todos.length
  const completed = todos.filter(t => t.completed).length
  const overdue   = todos.filter(
    t => !t.completed && t.due_date && new Date(t.due_date + 'T23:59:59') < new Date()
  ).length

  const byPriority = {
    high:   todos.filter(t => t.priority === 'high').length,
    medium: todos.filter(t => t.priority === 'medium').length,
    low:    todos.filter(t => t.priority === 'low').length,
  }

  const archivedCount = (
    db.prepare('SELECT COUNT(*) as c FROM todos WHERE user_id = ? AND archived = 1')
      .get(req.userId) as any
  ).c

  res.json({
    total,
    completed,
    pending:        total - completed,
    overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byPriority,
    archived: archivedCount,
  })
})

router.get('/', (req: AuthRequest, res: Response) => {
  const showArchived = req.query.archived === 'true'
  const todos = db.prepare(
    'SELECT * FROM todos WHERE user_id = ? AND archived = ? ORDER BY position ASC'
  ).all(req.userId, showArchived ? 1 : 0)
  res.json(todos)
})

router.post('/', (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE todos SET position = position + 1 WHERE user_id = ?').run(req.userId)
  const { title, due_date, priority, notes, category, recurrence } = req.body
  const result = db.prepare(`
    INSERT INTO todos (title, due_date, priority, notes, category, recurrence, position, user_id)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    title,
    due_date     ?? null,
    priority     ?? 'none',
    notes        ?? null,
    category     ?? null,
    recurrence   ?? 'none',
    req.userId,
  )
  const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(newTodo)
})

router.patch('/reorder', (req: AuthRequest, res: Response) => {
  const { ids } = req.body as { ids: number[] }
  const update   = db.prepare('UPDATE todos SET position = ? WHERE id = ? AND user_id = ?')
  const updateAll = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => update.run(index, id, req.userId))
  })
  updateAll(ids)
  res.status(204).send()
})

// PATCH /:id/archive — toggle archivage
router.patch('/:id/archive', (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, req.userId) as any
  if (!todo) { res.status(404).json({ error: 'Tâche non trouvée' }); return }
  db.prepare('UPDATE todos SET archived = ? WHERE id = ?').run(todo.archived === 0 ? 1 : 0, id)
  res.json(db.prepare('SELECT * FROM todos WHERE id = ?').get(id))
})

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, req.userId) as any
  if (!todo) { res.status(404).json({ error: 'Tâche non trouvée' }); return }

  const { title, priority, notes, category } = (req.body ?? {}) as {
    title?: string; priority?: string; notes?: string; category?: string
  }

  if (title !== undefined) {
    db.prepare('UPDATE todos SET title = ? WHERE id = ?').run(title, id)
  } else if (priority !== undefined) {
    db.prepare('UPDATE todos SET priority = ? WHERE id = ?').run(priority, id)
  } else if (notes !== undefined) {
    db.prepare('UPDATE todos SET notes = ? WHERE id = ?').run(notes || null, id)
  } else if (category !== undefined) {
    db.prepare('UPDATE todos SET category = ? WHERE id = ?').run(category || null, id)
  } else {
    // Toggle completed
    const newCompleted = todo.completed === 0 ? 1 : 0
    db.prepare('UPDATE todos SET completed = ? WHERE id = ?').run(newCompleted, id)

    // Tâche récurrente : créer la prochaine occurrence à la complétion
    if (newCompleted === 1 && todo.recurrence && todo.recurrence !== 'none') {
      const nextDate = getNextDate(todo.due_date, todo.recurrence)
      db.prepare('UPDATE todos SET position = position + 1 WHERE user_id = ?').run(req.userId)
      db.prepare(`
        INSERT INTO todos (title, due_date, priority, notes, category, recurrence, position, user_id)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `).run(todo.title, nextDate, todo.priority, todo.notes, todo.category, todo.recurrence, req.userId)
    }
  }

  res.json(db.prepare('SELECT * FROM todos WHERE id = ?').get(id))
})

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params
  db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, req.userId)
  res.status(204).send()
})

export default router
