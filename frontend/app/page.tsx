'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, BarChart3, LogOut } from 'lucide-react'
import confetti from 'canvas-confetti'
import TodoForm from './Components/TodoForm'
import TodoItem, { type Todo, type Priority, type Recurrence } from './Components/TodoItem'
import FilterBar, { type Filter } from './Components/FilterBar'
import ProgressBar from './Components/ProgressBar'
import SearchBar from './Components/SearchBar'
import SkeletonLoader from './Components/SkeletonLoader'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

const API = 'http://localhost:5000/api/todos'

export default function Home() {
  const router = useRouter()

  const [todos,         setTodos]         = useState<Todo[]>([])
  const [filter,        setFilter]        = useState<Filter>('all')
  const [search,        setSearch]        = useState('')
  const [isDark,        setIsDark]        = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [showArchived,  setShowArchived]  = useState(false)
  const [archivedTodos, setArchivedTodos] = useState<Todo[]>([])

  const wasAllDone = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  }), [])

  // ── Chargement initial ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    fetch(API, { headers: authHeaders() })
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) setTodos(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Thème ───────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved ? saved === 'dark' : prefersDark
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  // ── Confettis + notification ────────────────────────────────────
  useEffect(() => {
    const allDone = todos.length > 0 && todos.every(t => t.completed)
    if (allDone && !wasAllDone.current) {
      confetti({
        particleCount: 120, spread: 80, origin: { y: 0.6 },
        colors: ['#c9a84c', '#7c5cbf', '#4a7c59', '#d4cdb8', '#9a7828'],
      })
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('✨ All done!', { body: 'Well done, witch! All tasks complete!' })
      }
    }
    wasAllDone.current = allDone
  }, [todos])

  // ── Notifications navigateur ────────────────────────────────────
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    const timer = setTimeout(() => {
      if (Notification.permission === 'default') Notification.requestPermission()
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    if (sessionStorage.getItem('overdue_notified')) return
    if (loading || todos.length === 0) return
    const overdue = todos.filter(
      t => !t.completed && t.due_date && new Date(t.due_date + 'T23:59:59') < new Date()
    )
    if (overdue.length > 0) {
      sessionStorage.setItem('overdue_notified', 'true')
      new Notification('🔮 Grimoire Alert', {
        body: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}!`,
      })
    }
  }, [todos, loading])

  // ── Archive ─────────────────────────────────────────────────────
  const loadArchived = useCallback(async () => {
    const res  = await fetch(`${API}?archived=true`, { headers: authHeaders() })
    const data = await res.json()
    if (Array.isArray(data)) setArchivedTodos(data)
  }, [authHeaders])

  useEffect(() => {
    if (showArchived) loadArchived()
  }, [showArchived])

  // ── Handlers ────────────────────────────────────────────────────
  const handleAdd = async (
    title: string, due_date?: string, priority?: Priority,
    notes?: string, category?: string, recurrence?: Recurrence,
  ) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, due_date, priority, notes, category, recurrence }),
    })
    const newTodo = await res.json()
    setTodos(prev => [newTodo, ...prev])
  }

  const handleToggle = async (id: number) => {
    const res     = await fetch(`${API}/${id}`, { method: 'PUT', headers: authHeaders() })
    const updated = await res.json() as Todo
    // Tâche récurrente complétée → refetch pour voir la nouvelle occurrence
    if (updated.recurrence && updated.recurrence !== 'none' && updated.completed) {
      const allRes  = await fetch(API, { headers: authHeaders() })
      const allData = await allRes.json()
      if (Array.isArray(allData)) setTodos(allData)
    } else {
      setTodos(prev => prev.map(t => t.id === id ? updated : t))
    }
  }

  // Suppression optimiste : AnimatePresence joue l'exit animation
  const handleDelete = async (id: number) => {
    setTodos(prev        => prev.filter(t => t.id !== id))
    setArchivedTodos(prev => prev.filter(t => t.id !== id))
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() })
  }

  const handleEdit = async (id: number, title: string) => {
    const res     = await fetch(`${API}/${id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ title }),
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  const handleNotes = async (id: number, notes: string) => {
    const res     = await fetch(`${API}/${id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ notes }),
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  const handleArchive = async (id: number) => {
    await fetch(`${API}/${id}/archive`, { method: 'PATCH', headers: authHeaders() })
    setTodos(prev => prev.filter(t => t.id !== id))
    if (showArchived) loadArchived()
  }

  const handleUnarchive = async (id: number) => {
    await fetch(`${API}/${id}/archive`, { method: 'PATCH', headers: authHeaders() })
    setArchivedTodos(prev => prev.filter(t => t.id !== id))
    const res  = await fetch(API, { headers: authHeaders() })
    const data = await res.json()
    if (Array.isArray(data)) setTodos(data)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = todos.findIndex(t => t.id === active.id)
    const newIndex  = todos.findIndex(t => t.id === over.id)
    const newOrder  = arrayMove(todos, oldIndex, newIndex)
    setTodos(newOrder)
    await fetch(`${API}/reorder`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ ids: newOrder.map(t => t.id) }),
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // ── Calculs ─────────────────────────────────────────────────────
  const remaining = todos.filter(t => !t.completed).length
  const counts    = {
    all:    todos.length,
    active: todos.filter(t => !t.completed).length,
    done:   todos.filter(t => t.completed).length,
  }
  const filteredTodos = todos.filter(t => {
    if (filter === 'active' && t.completed)  return false
    if (filter === 'done'   && !t.completed) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return (
        t.title.toLowerCase().includes(q)          ||
        (t.notes    ?? '').toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  // ── Rendu ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen py-12 px-4 sm:py-16">

      {/* ── Boutons fixes ── */}
      <motion.button
        onClick={toggleDark}
        whileTap={{ scale: 0.85, rotate: 20 }}
        className="fixed top-4 left-4 text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors z-50"
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark
          ? <Sun  size={22} strokeWidth={1.8} />
          : <Moon size={22} strokeWidth={1.8} />
        }
      </motion.button>

      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <Link
          href="/stats"
          className="p-2 rounded-lg border border-[var(--ink-light)]/40 text-[var(--ink-light)] hover:border-[var(--violet)] hover:text-[var(--violet)] transition-colors"
          title="Statistics"
        >
          <BarChart3 size={16} strokeWidth={1.8} />
        </Link>
        <motion.button
          onClick={handleLogout}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[var(--ink-light)]/40 text-[var(--ink-light)] font-['Lora'] hover:border-[var(--violet)] hover:text-[var(--violet)] transition-colors"
        >
          <LogOut size={13} strokeWidth={2} />
          logout
        </motion.button>
      </div>

      <div className="max-w-xl mx-auto">

        {/* ── En-tête animé ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.05 }}
          className="text-center mb-8 sm:mb-10"
        >
          <motion.p
            className="text-4xl mb-3"
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
          >
            🔮
          </motion.p>
          <h1
            style={{ fontFamily: "'IM Fell English', serif" }}
            className="text-3xl sm:text-4xl text-[var(--ink)] mb-2"
          >
            To-Do List
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={remaining === 0 && todos.length > 0 ? 'done' : 'remaining'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[var(--ink-light)] italic text-sm sm:text-base"
            >
              {remaining === 0 && todos.length > 0
                ? '✨ All tasks complete — well done, witch!'
                : `🌿 ${remaining} task${remaining !== 1 ? 's' : ''} remaining`}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <TodoForm onAdd={handleAdd} />

        <ProgressBar total={todos.length} done={counts.done} />

        <FilterBar current={filter} onChange={setFilter} counts={counts} />

        <SearchBar value={search} onChange={setSearch} />

        {/* ── Liste principale ── */}
        {loading ? (
          <SkeletonLoader />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTodos.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {filteredTodos.length === 0 ? (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-[var(--ink-light)] italic py-8"
                    >
                      {search.trim()       ? `No tasks match "${search}" 🔍`  :
                       filter === 'done'   ? 'No completed tasks yet... ✨' :
                       filter === 'active' ? 'All tasks are done! 🌿'      :
                       'Your grimoire is empty... add a task! 🍄'}
                    </motion.p>
                  ) : (
                    filteredTodos.map(todo => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onNotes={handleNotes}
                        onArchive={handleArchive}
                        isDraggable={filter === 'all' && !search.trim()}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* ── Section archive ── */}
        <div className="mt-8">
          <motion.button
            onClick={() => setShowArchived(v => !v)}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 text-sm font-['Lora'] italic text-[var(--ink-light)] border border-[var(--ink-light)]/20 rounded-xl hover:border-[var(--gold)] hover:text-[var(--ink)] transition-colors"
          >
            {showArchived
              ? '▲ Hide archived'
              : `📦 Show archived${archivedTodos.length > 0 ? ` (${archivedTodos.length})` : ''}`
            }
          </motion.button>

          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-4">
                  {archivedTodos.length === 0 ? (
                    <p className="text-center text-[var(--ink-light)] italic py-6">
                      No archived tasks yet 📦
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {archivedTodos.map(todo => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            onToggle={() => {}}
                            onDelete={handleDelete}
                            onEdit={() => {}}
                            onNotes={() => {}}
                            onArchive={handleUnarchive}
                            isDraggable={false}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </main>
  )
}
