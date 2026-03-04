'use client'

import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  GripVertical, Check, Trash2, Archive, ArchiveRestore,
  NotepadText, Calendar, RefreshCw, ChevronDown, Plus,
  Eye, EyeOff, CheckSquare, Pencil, X,
} from 'lucide-react'
import { SUBTASKS_URL, TODOS_URL } from '@/lib/config'
import { authHeaders } from '@/lib/api'

export type Priority   = 'none' | 'low' | 'medium' | 'high'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Subtask {
  id:        number
  todo_id:   number
  title:     string
  completed: number
  position:  number
}

export interface Todo {
  id:         number
  title:      string
  completed:  number
  created_at: string
  due_date:   string | null
  priority:   Priority
  notes:      string | null
  category:   string | null
  recurrence: Recurrence
  archived:   number
}

interface TodoItemProps {
  todo:             Todo
  onToggle:         (id: number) => void
  onDelete:         (id: number) => void
  onEdit:           (id: number, newTitle: string) => void
  onNotes:          (id: number, notes: string) => void
  onArchive:        (id: number) => void
  onUpdate?:        (id: number, fields: Partial<Pick<Todo, 'priority' | 'due_date' | 'category'>>) => void
  onCategoryClick?: (category: string) => void
  isDraggable:      boolean
  isSelected?:      boolean
  onSelect?:        (id: number) => void
  showCheckbox?:    boolean
}

// ── Couleurs catégorie ──────────────────────────────────────────
const CATEGORY_COLORS = [
  'bg-violet-400/20 text-violet-600 dark:text-violet-400',
  'bg-blue-400/20 text-blue-600 dark:text-blue-400',
  'bg-emerald-400/20 text-emerald-700 dark:text-emerald-400',
  'bg-orange-400/20 text-orange-600 dark:text-orange-400',
  'bg-pink-400/20 text-pink-600 dark:text-pink-400',
  'bg-cyan-400/20 text-cyan-700 dark:text-cyan-400',
  'bg-amber-400/20 text-amber-700 dark:text-amber-400',
]
function categoryColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length]
}

const PRIORITY_STYLES: Record<string, string> = {
  high:   'bg-red-400/15 text-red-500 dark:text-red-400 border border-red-400/30',
  medium: 'bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/30',
  low:    'bg-emerald-400/15 text-emerald-700 dark:text-emerald-400 border border-emerald-400/30',
}
const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-emerald-400',
}
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 }
export { PRIORITY_ORDER }

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high']
const PRIORITY_LABELS: Record<Priority, string> = { none: '—', low: 'Low', medium: 'Med', high: 'High' }

// ── Sous-tâche individuelle ─────────────────────────────────────
function SubtaskRow({
  sub, todoId, onToggle, onDelete,
}: { sub: Subtask; todoId: number; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(sub.title)
  const inputRef              = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = async () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== sub.title) {
      await fetch(`${SUBTASKS_URL(todoId)}/${sub.id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ title: trimmed }),
      })
    } else setValue(sub.title)
    setEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 py-1"
    >
      <button
        onClick={() => onToggle(sub.id)}
        role="checkbox"
        aria-checked={!!sub.completed}
        aria-label={`Mark subtask "${sub.title}" as ${sub.completed ? 'incomplete' : 'complete'}`}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
          sub.completed ? 'bg-[var(--forest)] border-[var(--forest)]' : 'border-[var(--gold-dark)] hover:border-[var(--forest)]'
        }`}
      >
        {sub.completed ? <Check size={9} strokeWidth={3} className="text-white" aria-hidden="true" /> : null}
      </button>
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setValue(sub.title); setEditing(false) } }}
          aria-label="Edit subtask"
          className="flex-1 min-w-0 bg-transparent border-b border-[var(--violet)] outline-none text-xs font-['Lora'] text-[var(--ink)]"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          title="Double-click to edit"
          className={`flex-1 text-xs font-['Lora'] cursor-default ${sub.completed ? 'line-through text-[var(--ink-light)]' : 'text-[var(--ink)]'}`}
        >
          {sub.title}
        </span>
      )}
      <button
        onClick={() => onDelete(sub.id)}
        aria-label={`Delete subtask "${sub.title}"`}
        className="text-[var(--ink-light)] hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Trash2 size={11} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </motion.div>
  )
}

// ── Panneau d'édition inline des détails ────────────────────────
function DetailEditPanel({
  todo, onClose, onUpdate,
}: {
  todo:     Todo
  onClose:  () => void
  onUpdate: (fields: Partial<Pick<Todo, 'priority' | 'due_date' | 'category'>>) => void
}) {
  const [priority, setPriority] = useState<Priority>(todo.priority)
  const [dueDate,  setDueDate]  = useState(todo.due_date ?? '')
  const [category, setCategory] = useState(todo.category ?? '')

  const save = () => {
    const updates: Partial<Pick<Todo, 'priority' | 'due_date' | 'category'>> = {}
    if (priority !== todo.priority)          updates.priority = priority
    if ((dueDate || null) !== todo.due_date) updates.due_date = dueDate || null
    if ((category.trim() || null) !== todo.category) updates.category = category.trim() || null
    if (Object.keys(updates).length > 0) onUpdate(updates)
    onClose()
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div className="px-4 pb-3 pt-2 border-t border-[var(--ink-light)]/10 flex flex-col gap-2.5">
        {/* Priorité */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Priority">
          <span className="text-xs text-[var(--ink-light)] font-['Lora'] w-14 flex-shrink-0">Priority</span>
          <div className="flex gap-1">
            {PRIORITIES.map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                aria-pressed={priority === p}
                aria-label={`Set priority to ${PRIORITY_LABELS[p]}`}
                className={`text-xs px-2 py-0.5 rounded-md font-['Lora'] border transition-colors ${
                  priority === p
                    ? p === 'none'
                      ? 'bg-[var(--parchment-dark)] border-[var(--gold)] text-[var(--ink)]'
                      : PRIORITY_STYLES[p]
                    : 'border-[var(--ink-light)]/20 text-[var(--ink-light)] hover:border-[var(--gold)]'
                }`}
              >
                {p !== 'none' && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT[p]}`} aria-hidden="true" />}
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <label htmlFor={`due-${todo.id}`} className="text-xs text-[var(--ink-light)] font-['Lora'] w-14 flex-shrink-0">
            Due date
          </label>
          <div className="flex items-center gap-1">
            <input
              id={`due-${todo.id}`}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] font-['Lora'] text-xs focus:outline-none focus:border-[var(--violet)] transition-colors"
            />
            {dueDate && (
              <button onClick={() => setDueDate('')} aria-label="Clear due date" className="text-[var(--ink-light)] hover:text-red-400 transition-colors">
                <X size={12} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Catégorie */}
        <div className="flex items-center gap-2">
          <label htmlFor={`cat-${todo.id}`} className="text-xs text-[var(--ink-light)] font-['Lora'] w-14 flex-shrink-0">
            Category
          </label>
          <input
            id={`cat-${todo.id}`}
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose() }}
            placeholder="Work, Personal…"
            maxLength={100}
            className="flex-1 px-2 py-1 rounded-lg border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] font-['Lora'] text-xs focus:outline-none focus:border-[var(--violet)] transition-colors placeholder-[var(--ink-light)]"
          />
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-2 mt-0.5">
          <button
            onClick={onClose}
            className="text-xs font-['Lora'] text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors px-2 py-1"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="text-xs font-['Lora'] px-3 py-1 rounded-lg bg-[var(--forest)] text-[var(--parchment)] hover:bg-[var(--forest-dark)] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Composant principal ─────────────────────────────────────────
export default function TodoItem({
  todo, onToggle, onDelete, onEdit, onNotes, onArchive, onUpdate,
  onCategoryClick, isDraggable, isSelected = false, onSelect, showCheckbox = false,
}: TodoItemProps) {
  const [isEditing,    setIsEditing]    = useState(false)
  const [editValue,    setEditValue]    = useState(todo.title)
  const [showNotes,    setShowNotes]    = useState(false)
  const [notesValue,   setNotesValue]   = useState(todo.notes ?? '')
  const [markdownMode, setMarkdownMode] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [showDetails,  setShowDetails]  = useState(false)
  const [subtasks,     setSubtasks]     = useState<Subtask[]>([])
  const [loadingSubs,  setLoadingSubs]  = useState(false)
  const [subInput,     setSubInput]     = useState('')
  const subInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setNotesValue(todo.notes ?? '') }, [todo.notes])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id })
  const dndStyle = { transform: CSS.Transform.toString(transform), transition }

  // ── Subtasks ──────────────────────────────────────────────────
  const loadSubtasks = async () => {
    setLoadingSubs(true)
    try {
      const res  = await fetch(SUBTASKS_URL(todo.id), { headers: authHeaders() })
      const data = await res.json()
      if (Array.isArray(data)) setSubtasks(data)
    } finally { setLoadingSubs(false) }
  }

  useEffect(() => { if (showSubtasks) loadSubtasks() }, [showSubtasks])

  const handleAddSubtask = async () => {
    const title = subInput.trim()
    if (!title) return
    const res = await fetch(SUBTASKS_URL(todo.id), {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ title }),
    })
    const sub = await res.json()
    setSubtasks(prev => [...prev, sub])
    setSubInput('')
    subInputRef.current?.focus()
  }

  const handleToggleSub = async (subId: number) => {
    const res     = await fetch(`${SUBTASKS_URL(todo.id)}/${subId}/toggle`, { method: 'PATCH', headers: authHeaders() })
    const updated = await res.json()
    setSubtasks(prev => prev.map(s => s.id === subId ? updated : s))
  }

  const handleDeleteSub = async (subId: number) => {
    await fetch(`${SUBTASKS_URL(todo.id)}/${subId}`, { method: 'DELETE', headers: authHeaders() })
    setSubtasks(prev => prev.filter(s => s.id !== subId))
  }

  // ── Édition inline détails ────────────────────────────────────
  const handleUpdate = async (fields: Partial<Pick<Todo, 'priority' | 'due_date' | 'category'>>) => {
    if (!onUpdate) return
    // On envoie chaque champ modifié individuellement au backend
    for (const [key, value] of Object.entries(fields)) {
      await fetch(`${TODOS_URL}/${todo.id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ [key]: value }),
      })
    }
    onUpdate(todo.id, fields)
  }

  // ── Titre ──────────────────────────────────────────────────────
  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== todo.title) onEdit(todo.id, trimmed)
    else setEditValue(todo.title)
    setIsEditing(false)
  }

  const handleNotesSave = () => {
    const trimmed = notesValue.trim()
    if (trimmed !== (todo.notes ?? '').trim()) onNotes(todo.id, trimmed)
  }

  const isOverdue  = Boolean(!todo.completed && todo.due_date && new Date(todo.due_date + 'T23:59:59') < new Date())
  const isArchived = todo.archived === 1
  const subDone    = subtasks.filter(s => s.completed).length
  const subTotal   = subtasks.length

  return (
    <div ref={setNodeRef} style={dndStyle} className={isDragging ? 'z-10 relative' : ''}>
      <motion.article
        aria-label={todo.title}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 1.03 : 1 }}
        exit={{ opacity: 0, x: -24, scale: 0.97, transition: { duration: 0.18, ease: 'easeIn' } }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        whileHover={!isDragging ? { boxShadow: '0 4px 24px rgba(0,0,0,0.08)' } : undefined}
        className={`flex flex-col rounded-xl border transition-colors duration-200 ${
          isSelected
            ? 'border-[var(--violet)] bg-[var(--parchment-dark)] dark:bg-[var(--parchment)]'
            : todo.completed
              ? 'opacity-60 border-[var(--ink-light)]/25 bg-[var(--parchment-dark)] dark:bg-[var(--parchment)]'
              : 'border-[var(--gold)] bg-[var(--parchment-dark)] dark:bg-[var(--parchment)]'
        }`}
      >
        {/* ── Ligne principale ── */}
        <div className="flex items-center gap-3 px-4 py-3.5">

          {showCheckbox && onSelect && (
            <button
              onClick={() => onSelect(todo.id)}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} "${todo.title}"`}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? 'bg-[var(--violet)] border-[var(--violet)]' : 'border-[var(--ink-light)]/40 hover:border-[var(--violet)]'
              }`}
            >
              {isSelected && <Check size={9} strokeWidth={3} className="text-white" aria-hidden="true" />}
            </button>
          )}

          {isDraggable && (
            <button
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
              className="text-[var(--ink-light)] cursor-grab active:cursor-grabbing touch-none flex-shrink-0 hover:text-[var(--gold)] transition-colors"
            >
              <GripVertical size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}

          {/* Toggle complété */}
          <button
            data-testid="toggle"
            onClick={() => onToggle(todo.id)}
            role="checkbox"
            aria-checked={!!todo.completed}
            aria-label={`${todo.completed ? 'Mark as incomplete' : 'Mark as complete'}: ${todo.title}`}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              todo.completed
                ? 'bg-[var(--forest)] border-[var(--forest)] text-white'
                : 'border-[var(--gold-dark)] hover:border-[var(--forest)]'
            }`}
          >
            <AnimatePresence>
              {todo.completed && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Titre + badges */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  handleSave()
                    if (e.key === 'Escape') { setEditValue(todo.title); setIsEditing(false) }
                  }}
                  aria-label="Edit task title"
                  className="flex-1 min-w-0 bg-transparent border-b-2 border-[var(--violet)] outline-none font-['Lora'] text-[var(--ink)] py-0.5"
                />
              ) : (
                <span
                  onDoubleClick={() => !todo.completed && !isArchived && setIsEditing(true)}
                  title={todo.completed || isArchived ? undefined : 'Double-click to edit'}
                  className={`font-['Lora'] text-[var(--ink)] cursor-default break-words transition-colors ${
                    todo.completed ? 'line-through text-[var(--ink-light)]' : 'hover:text-[var(--violet)]'
                  }`}
                >
                  {todo.title}
                </span>
              )}

              {todo.priority && todo.priority !== 'none' && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 flex items-center gap-1 font-['Lora'] ${PRIORITY_STYLES[todo.priority]}`}
                  aria-label={`Priority: ${todo.priority}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[todo.priority]}`} aria-hidden="true" />
                  {todo.priority}
                </span>
              )}

              {todo.category && (
                <button
                  onClick={() => onCategoryClick?.(todo.category!)}
                  title={`Filter by "${todo.category}"`}
                  aria-label={`Filter by category: ${todo.category}`}
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-['Lora'] transition-opacity hover:opacity-80 ${categoryColor(todo.category)}`}
                >
                  {todo.category}
                </button>
              )}

              {todo.recurrence && todo.recurrence !== 'none' && (
                <span aria-label={`Repeats ${todo.recurrence}`} className="text-[var(--ink-light)] flex-shrink-0">
                  <RefreshCw size={11} strokeWidth={2} aria-hidden="true" />
                  <span className="sr-only">{todo.recurrence}</span>
                </span>
              )}
            </div>

            {todo.due_date && (
              <span
                className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-[var(--ink-light)]'}`}
                aria-label={`Due ${new Date(todo.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${isOverdue ? ' — overdue' : ''}`}
              >
                <Calendar size={11} strokeWidth={2} aria-hidden="true" />
                {new Date(todo.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {isOverdue && <span className="font-semibold"> · overdue</span>}
              </span>
            )}

            {subTotal > 0 && (
              <button
                onClick={() => setShowSubtasks(v => !v)}
                aria-expanded={showSubtasks}
                aria-label={`Subtasks: ${subDone} of ${subTotal} complete`}
                className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors w-fit"
              >
                <CheckSquare size={11} strokeWidth={2} aria-hidden="true" />
                <span className="font-['Lora']">{subDone}/{subTotal}</span>
                <div className="w-[60px] h-1 bg-[var(--ink-light)]/15 rounded-full overflow-hidden" role="progressbar" aria-valuenow={subDone} aria-valuemin={0} aria-valuemax={subTotal}>
                  <div
                    className="h-full bg-[var(--forest)] rounded-full transition-all duration-300"
                    style={{ width: `${(subDone / subTotal) * 100}%` }}
                  />
                </div>
              </button>
            )}

            <AnimatePresence>
              {todo.notes && !showNotes && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-[var(--ink-light)] mt-1 italic truncate overflow-hidden"
                  aria-label={`Note: ${todo.notes}`}
                >
                  {todo.notes}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0" role="group" aria-label={`Actions for "${todo.title}"`}>
            {!isArchived && onUpdate && (
              <button
                onClick={() => setShowDetails(v => !v)}
                aria-expanded={showDetails}
                aria-label="Edit task details (priority, date, category)"
                className={`p-2 rounded-lg transition-colors ${showDetails ? 'text-[var(--gold)]' : 'text-[var(--ink-light)] hover:text-[var(--gold)]'}`}
              >
                <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}

            <button
              onClick={() => { setShowSubtasks(v => !v) }}
              aria-expanded={showSubtasks}
              aria-label={`${showSubtasks ? 'Hide' : 'Show'} subtasks`}
              className={`p-2 rounded-lg transition-colors ${showSubtasks ? 'text-[var(--gold)]' : 'text-[var(--ink-light)] hover:text-[var(--gold)]'}`}
            >
              <ChevronDown
                size={14} strokeWidth={1.8} aria-hidden="true"
                className={`transition-transform duration-200 ${showSubtasks ? 'rotate-180' : ''}`}
              />
            </button>

            <button
              onClick={() => setShowNotes(v => !v)}
              aria-expanded={showNotes}
              aria-label={`${showNotes ? 'Hide' : 'Show'} notes`}
              className={`p-2 rounded-lg transition-colors ${showNotes || todo.notes ? 'text-[var(--violet)]' : 'text-[var(--ink-light)] hover:text-[var(--violet)]'}`}
            >
              <NotepadText size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>

            <button
              onClick={() => onArchive(todo.id)}
              aria-label={isArchived ? `Restore "${todo.title}" from archive` : `Archive "${todo.title}"`}
              className="p-2 rounded-lg text-[var(--ink-light)] hover:text-[var(--gold)] transition-colors"
            >
              {isArchived
                ? <ArchiveRestore size={15} strokeWidth={1.8} aria-hidden="true" />
                : <Archive size={15} strokeWidth={1.8} aria-hidden="true" />
              }
            </button>

            <button
              data-testid="delete"
              onClick={() => onDelete(todo.id)}
              aria-label={`Delete "${todo.title}"`}
              className="p-2 rounded-lg text-[var(--ink-light)] hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Édition inline détails ── */}
        <AnimatePresence>
          {showDetails && !isArchived && onUpdate && (
            <DetailEditPanel
              todo={todo}
              onClose={() => setShowDetails(false)}
              onUpdate={handleUpdate}
            />
          )}
        </AnimatePresence>

        {/* ── Sous-tâches ── */}
        <AnimatePresence>
          {showSubtasks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pb-3 border-t border-[var(--ink-light)]/10 pt-2">
                <p className="sr-only">Subtasks for {todo.title}</p>
                {loadingSubs ? (
                  <p className="text-xs text-[var(--ink-light)] italic py-1" role="status">Loading…</p>
                ) : (
                  <AnimatePresence initial={false}>
                    {subtasks.map(sub => (
                      <SubtaskRow key={sub.id} sub={sub} todoId={todo.id} onToggle={handleToggleSub} onDelete={handleDeleteSub} />
                    ))}
                  </AnimatePresence>
                )}
                {!isArchived && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Plus size={12} strokeWidth={2} className="text-[var(--ink-light)] flex-shrink-0" aria-hidden="true" />
                    <input
                      ref={subInputRef}
                      value={subInput}
                      onChange={e => setSubInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask() }}
                      placeholder="Add subtask…"
                      aria-label="New subtask title"
                      className="flex-1 bg-transparent outline-none text-xs font-['Lora'] text-[var(--ink)] placeholder-[var(--ink-light)]/50"
                    />
                    {subInput.trim() && (
                      <button onClick={handleAddSubtask} aria-label="Add subtask" className="text-xs text-[var(--violet)] hover:text-[var(--ink)] transition-colors font-['Lora']">
                        Add
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Notes + markdown ── */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pb-4 border-t border-[var(--ink-light)]/10">
                <div className="flex items-center justify-end gap-2 mt-3 mb-1.5">
                  <button
                    onClick={() => setMarkdownMode(v => !v)}
                    aria-pressed={markdownMode}
                    aria-label={markdownMode ? 'Switch to edit mode' : 'Switch to markdown preview'}
                    className={`flex items-center gap-1 text-xs font-['Lora'] transition-colors ${markdownMode ? 'text-[var(--violet)]' : 'text-[var(--ink-light)] hover:text-[var(--violet)]'}`}
                  >
                    {markdownMode ? <EyeOff size={11} strokeWidth={2} aria-hidden="true" /> : <Eye size={11} strokeWidth={2} aria-hidden="true" />}
                    {markdownMode ? 'Edit' : 'Preview'}
                  </button>
                </div>
                {markdownMode ? (
                  <div
                    className="prose prose-sm max-w-none text-[var(--ink)] font-['Lora'] text-sm [&_*]:font-['Lora'] [&_a]:text-[var(--violet)] [&_strong]:text-[var(--ink)] [&_code]:bg-[var(--ink-light)]/10 [&_code]:px-1 [&_code]:rounded [&_hr]:border-[var(--ink-light)]/20"
                    aria-label="Note preview"
                  >
                    <ReactMarkdown>{notesValue || '*No notes yet…*'}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    onBlur={handleNotesSave}
                    placeholder="Add a note… (markdown supported, saved on blur)"
                    rows={3}
                    aria-label={`Notes for "${todo.title}"`}
                    className="w-full bg-transparent border border-[var(--ink-light)]/20 rounded-lg p-2.5 text-sm font-['Lora'] text-[var(--ink)] placeholder-[var(--ink-light)] outline-none focus:border-[var(--violet)] transition-colors resize-none"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    </div>
  )
}
