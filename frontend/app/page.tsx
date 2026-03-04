'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Moon, Sun, BarChart3, LogOut, Download, Keyboard, Trash2, CheckCheck } from 'lucide-react'
import confetti from 'canvas-confetti'
import TodoForm from './Components/TodoForm'
import TodoItem, { type Todo, type Priority, type Recurrence, PRIORITY_ORDER } from './Components/TodoItem'
import FilterBar, { type Filter } from './Components/FilterBar'
import SortBar, { type SortConfig } from './Components/SortBar'
import ShortcutsModal from './Components/ShortcutsModal'
import ProgressBar from './Components/ProgressBar'
import SearchBar from './Components/SearchBar'
import SkeletonLoader from './Components/SkeletonLoader'
import { TODOS_URL } from '@/lib/config'
import { authHeaders } from '@/lib/api'

import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'

// ── Helpers ────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0]

export default function Home() {
  const router = useRouter()

  const [todos,          setTodos]         = useState<Todo[]>([])
  const [filter,         setFilter]        = useState<Filter>('all')
  const [search,         setSearch]        = useState('')
  const [isDark,         setIsDark]        = useState(false)
  const [loading,        setLoading]       = useState(true)
  const [showArchived,   setShowArchived]  = useState(false)
  const [archivedTodos,  setArchivedTodos] = useState<Todo[]>([])
  const [sort,           setSort]          = useState<SortConfig>({ key: 'position', dir: 'asc' })
  const [selectedIds,    setSelectedIds]   = useState<Set<number>>(new Set())
  const [bulkMode,       setBulkMode]      = useState(false)
  const [showShortcuts,  setShowShortcuts] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [liveMsg,        setLiveMsg]       = useState('')

  const wasAllDone   = useRef(false)
  const formInputRef = useRef<HTMLInputElement | null>(null)
  const searchRef    = useRef<HTMLInputElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  // ── Chargement initial ────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    fetch(TODOS_URL, { headers: authHeaders() })
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

  // ── Thème ─────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved ? saved === 'dark' : prefersDark
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  // ── Confettis ─────────────────────────────────────────────────
  useEffect(() => {
    const allDone = todos.length > 0 && todos.every(t => t.completed)
    if (allDone && !wasAllDone.current) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
        colors: ['#c9a84c', '#7c5cbf', '#4a7c59', '#d4cdb8', '#9a7828'] })
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
        new Notification('✨ All done!', { body: 'Well done, witch! All tasks complete!' })
    }
    wasAllDone.current = allDone
  }, [todos])

  // ── Notifications navigateur ──────────────────────────────────
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
    const overdue = todos.filter(t =>
      !t.completed && t.due_date && new Date(t.due_date + 'T23:59:59') < new Date()
    )
    if (overdue.length > 0) {
      sessionStorage.setItem('overdue_notified', 'true')
      new Notification('🔮 Grimoire Alert', {
        body: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}!`,
      })
    }
  }, [todos, loading])

  // ── Archive ──────────────────────────────────────────────────
  const loadArchived = useCallback(async () => {
    const res  = await fetch(`${TODOS_URL}?archived=true`, { headers: authHeaders() })
    const data = await res.json()
    if (Array.isArray(data)) setArchivedTodos(data)
  }, [])

  useEffect(() => {
    if (showArchived) loadArchived()
  }, [showArchived])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const inInput = ['INPUT', 'TEXTAREA'].includes(tag)

      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return }
        if (search) { setSearch(''); return }
        if (bulkMode) { setBulkMode(false); setSelectedIds(new Set()); return }
      }

      if (inInput) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        formInputRef.current?.focus()
      }
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === '?' || e.key === 'h') {
        setShowShortcuts(v => !v)
      }
      if (e.key === 'd') toggleDark()
      if (e.key === 'e') handleExport()
      if (e.key === '1') setFilter('all')
      if (e.key === '2') setFilter('active')
      if (e.key === '3') setFilter('today')
      if (e.key === '4') setFilter('done')
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [search, bulkMode, showShortcuts])

  // ── Announce to screen readers ───────────────────────────────
  const announce = (msg: string) => {
    setLiveMsg('')
    requestAnimationFrame(() => setLiveMsg(msg))
  }

  // ── Category filter ───────────────────────────────────────────
  const handleCategoryClick = (category: string) => {
    setCategoryFilter(prev => prev === category ? null : category)
    setFilter('all')
    announce(`Filtered by category: ${category}`)
  }

  // ── Handlers ─────────────────────────────────────────────────
  const handleAdd = async (
    title: string, due_date?: string, priority?: Priority,
    notes?: string, category?: string, recurrence?: Recurrence,
  ) => {
    const res = await fetch(TODOS_URL, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ title, due_date, priority, notes, category, recurrence }),
    })
    const newTodo = await res.json()
    setTodos(prev => [newTodo, ...prev])
    toast.success('Task added ✨')
    announce(`Task added: ${title}`)
  }

  const handleUpdate = (id: number, fields: Partial<Pick<Todo, 'priority' | 'due_date' | 'category'>>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
    toast.success('Task updated ✏️')
  }

  const handleToggle = async (id: number) => {
    const res     = await fetch(`${TODOS_URL}/${id}`, { method: 'PUT', headers: authHeaders() })
    const updated = await res.json() as Todo
    if (updated.recurrence && updated.recurrence !== 'none' && updated.completed) {
      const allRes  = await fetch(TODOS_URL, { headers: authHeaders() })
      const allData = await allRes.json()
      if (Array.isArray(allData)) setTodos(allData)
      toast.success('Task done — next occurrence created 🔄')
    } else {
      setTodos(prev => prev.map(t => t.id === id ? updated : t))
      if (updated.completed) toast.success('Task completed 🌿')
    }
  }

  // Undo delete : garde la tâche supprimée 5s avec toast d'annulation
  const handleDelete = async (id: number) => {
    const deleted = todos.find(t => t.id === id)
    setTodos(prev => prev.filter(t => t.id !== id))
    setArchivedTodos(prev => prev.filter(t => t.id !== id))

    let undone = false
    const toastId = toast('Task deleted', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true
          setTodos(prev => {
            if (!deleted) return prev
            const updated = [deleted, ...prev]
            return updated
          })
          toast.success('Deletion undone ↩️')
        },
      },
    })

    await new Promise(r => setTimeout(r, 5100))
    if (!undone) {
      await fetch(`${TODOS_URL}/${id}`, { method: 'DELETE', headers: authHeaders() })
    }
  }

  const handleEdit = async (id: number, title: string) => {
    const res     = await fetch(`${TODOS_URL}/${id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ title }),
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
    toast.success('Task renamed ✏️')
  }

  const handleNotes = async (id: number, notes: string) => {
    const res     = await fetch(`${TODOS_URL}/${id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ notes }),
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  const handleArchive = async (id: number) => {
    await fetch(`${TODOS_URL}/${id}/archive`, { method: 'PATCH', headers: authHeaders() })
    setTodos(prev => prev.filter(t => t.id !== id))
    if (showArchived) loadArchived()
    toast('Task archived 📦', { duration: 2500 })
  }

  const handleUnarchive = async (id: number) => {
    await fetch(`${TODOS_URL}/${id}/archive`, { method: 'PATCH', headers: authHeaders() })
    setArchivedTodos(prev => prev.filter(t => t.id !== id))
    const res  = await fetch(TODOS_URL, { headers: authHeaders() })
    const data = await res.json()
    if (Array.isArray(data)) setTodos(data)
    toast.success('Task restored 🌿')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = todos.findIndex(t => t.id === active.id)
    const newIndex  = todos.findIndex(t => t.id === over.id)
    const newOrder  = arrayMove(todos, oldIndex, newIndex)
    setTodos(newOrder)
    await fetch(`${TODOS_URL}/reorder`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ ids: newOrder.map(t => t.id) }),
    })
  }

  // ── Bulk operations ──────────────────────────────────────────
  const handleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkComplete = async () => {
    const ids = Array.from(selectedIds)
    await Promise.all(ids.map(id =>
      fetch(`${TODOS_URL}/${id}`, { method: 'PUT', headers: authHeaders() })
    ))
    const res  = await fetch(TODOS_URL, { headers: authHeaders() })
    const data = await res.json()
    if (Array.isArray(data)) setTodos(data)
    toast.success(`${ids.length} task${ids.length > 1 ? 's' : ''} completed ✨`)
    setSelectedIds(new Set())
    setBulkMode(false)
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    setTodos(prev => prev.filter(t => !ids.includes(t.id)))
    await Promise.all(ids.map(id =>
      fetch(`${TODOS_URL}/${id}`, { method: 'DELETE', headers: authHeaders() })
    ))
    toast(`${ids.length} task${ids.length > 1 ? 's' : ''} deleted`, { duration: 2500 })
    setSelectedIds(new Set())
    setBulkMode(false)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTodos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTodos.map(t => t.id)))
    }
  }

  // ── Export ───────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const data = JSON.stringify(todos, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `todos-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported! 📥')
  }, [todos])

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

  // ── Calculs ──────────────────────────────────────────────────
  const todayStr  = today()
  const remaining = todos.filter(t => !t.completed).length
  const counts    = {
    all:    todos.length,
    active: todos.filter(t => !t.completed).length,
    done:   todos.filter(t => t.completed).length,
    today:  todos.filter(t => !t.completed && t.due_date === todayStr).length,
  }

  const filteredTodos = useMemo(() => {
    let list = todos.filter(t => {
      if (filter === 'active' && t.completed)  return false
      if (filter === 'done'   && !t.completed) return false
      if (filter === 'today'  && (t.completed || t.due_date !== todayStr)) return false
      if (categoryFilter && t.category !== categoryFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return (
          t.title.toLowerCase().includes(q)            ||
          (t.notes    ?? '').toLowerCase().includes(q) ||
          (t.category ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })

    if (sort.key !== 'position') {
      const dir = sort.dir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        switch (sort.key) {
          case 'priority':
            return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
          case 'due_date': {
            const da = a.due_date ?? '9999-12-31'
            const db_ = b.due_date ?? '9999-12-31'
            return dir * da.localeCompare(db_)
          }
          case 'title':
            return dir * a.title.localeCompare(b.title)
          case 'created_at':
            return dir * a.created_at.localeCompare(b.created_at)
          default:
            return 0
        }
      })
    }

    return list
  }, [todos, filter, search, sort, todayStr, categoryFilter])

  const isDraggingEnabled = filter === 'all' && !search.trim() && sort.key === 'position' && !categoryFilter

  // ── Rendu ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen py-12 px-4 sm:py-16">

      {/* ── Région live pour screen readers ── */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMsg}</div>

      {/* ── Boutons fixes ── */}
      <motion.button
        onClick={toggleDark}
        whileTap={{ scale: 0.85, rotate: 20 }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed top-4 left-4 text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors z-50"
        title={isDark ? 'Light mode (d)' : 'Dark mode (d)'}
      >
        {isDark ? <Sun size={22} strokeWidth={1.8} aria-hidden="true" /> : <Moon size={22} strokeWidth={1.8} aria-hidden="true" />}
      </motion.button>

      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <motion.button
          onClick={handleExport}
          whileTap={{ scale: 0.9 }}
          aria-label="Export todos as JSON (e)"
          className="p-2 rounded-lg border border-[var(--ink-light)]/40 text-[var(--ink-light)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
          title="Export todos (e)"
        >
          <Download size={15} strokeWidth={1.8} aria-hidden="true" />
        </motion.button>
        <motion.button
          onClick={() => setShowShortcuts(v => !v)}
          whileTap={{ scale: 0.9 }}
          aria-label="Keyboard shortcuts (?)"
          aria-expanded={showShortcuts}
          className="p-2 rounded-lg border border-[var(--ink-light)]/40 text-[var(--ink-light)] hover:border-[var(--violet)] hover:text-[var(--violet)] transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={15} strokeWidth={1.8} aria-hidden="true" />
        </motion.button>
        <Link
          href="/stats"
          aria-label="View statistics"
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

      {/* ── Shortcuts modal ── */}
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <div className="max-w-xl mx-auto">

        {/* ── En-tête ── */}
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

        <TodoForm onAdd={handleAdd} inputRef={formInputRef} />

        <ProgressBar total={todos.length} done={counts.done} />

        <FilterBar current={filter} onChange={setFilter} counts={counts} />

        <SortBar sort={sort} onChange={setSort} />

        <SearchBar value={search} onChange={setSearch} inputRef={searchRef} />

        {/* ── Badge filtre catégorie actif ── */}
        <AnimatePresence>
          {categoryFilter && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 mb-3"
            >
              <span className="text-xs text-[var(--ink-light)] font-['Lora']">Category:</span>
              <button
                onClick={() => setCategoryFilter(null)}
                aria-label={`Remove category filter: ${categoryFilter}`}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-[var(--violet)]/40 bg-[var(--violet)]/10 text-[var(--violet)] font-['Lora'] hover:bg-[var(--violet)]/20 transition-colors"
              >
                {categoryFilter}
                <span aria-hidden="true" className="ml-0.5 opacity-70">×</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Barre bulk ── */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            onClick={() => {
              setBulkMode(v => {
                if (v) setSelectedIds(new Set())
                return !v
              })
            }}
            whileTap={{ scale: 0.95 }}
            className={`text-xs font-['Lora'] px-3 py-1.5 rounded-lg border transition-all ${
              bulkMode
                ? 'border-[var(--violet)] text-[var(--violet)] bg-[var(--violet)]/10'
                : 'border-[var(--ink-light)]/25 text-[var(--ink-light)] hover:border-[var(--gold)]'
            }`}
          >
            {bulkMode ? `✓ ${selectedIds.size} selected` : '☐ Select'}
          </motion.button>

          <AnimatePresence>
            {bulkMode && selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-['Lora'] text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors"
                >
                  {selectedIds.size === filteredTodos.length ? 'Deselect all' : 'Select all'}
                </button>
                <button
                  onClick={handleBulkComplete}
                  className="flex items-center gap-1 text-xs font-['Lora'] px-2.5 py-1 rounded-lg border border-[var(--forest)] text-[var(--forest)] hover:bg-[var(--forest)]/10 transition-colors"
                >
                  <CheckCheck size={12} strokeWidth={2} /> Complete
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 text-xs font-['Lora'] px-2.5 py-1 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={12} strokeWidth={2} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
              <ul role="list" aria-label="Tasks" className="flex flex-col gap-3">
                <AnimatePresence>
                  {filteredTodos.length === 0 ? (
                    <motion.li
                      key="empty"
                      role="status"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-[var(--ink-light)] italic py-8"
                    >
                      {categoryFilter              ? `No tasks in "${categoryFilter}" 🏷️`  :
                       search.trim()               ? `No tasks match "${search}" 🔍`        :
                       filter === 'done'           ? 'No completed tasks yet... ✨'          :
                       filter === 'active'         ? 'All tasks are done! 🌿'                :
                       filter === 'today'          ? 'Nothing due today 🌙'                  :
                                                     'Your grimoire is empty... add a task! 🍄'}
                    </motion.li>
                  ) : (
                    filteredTodos.map(todo => (
                      <li key={todo.id} role="listitem">
                        <TodoItem
                          todo={todo}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onNotes={handleNotes}
                          onArchive={handleArchive}
                          onUpdate={handleUpdate}
                          onCategoryClick={handleCategoryClick}
                          isDraggable={isDraggingEnabled}
                          isSelected={selectedIds.has(todo.id)}
                          onSelect={handleSelect}
                          showCheckbox={bulkMode}
                        />
                      </li>
                    ))
                  )}
                </AnimatePresence>
              </ul>
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
              : `📦 Show archived${archivedTodos.length > 0 ? ` (${archivedTodos.length})` : ''}`}
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
