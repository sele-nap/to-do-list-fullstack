'use client'

import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Check, Trash2, Archive, ArchiveRestore, NotepadText, Calendar, RefreshCw } from 'lucide-react'

export type Priority   = 'none' | 'low' | 'medium' | 'high'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

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
  todo:        Todo
  onToggle:    (id: number) => void
  onDelete:    (id: number) => void
  onEdit:      (id: number, newTitle: string) => void
  onNotes:     (id: number, notes: string) => void
  onArchive:   (id: number) => void
  isDraggable: boolean
}

const CATEGORY_COLORS = [
  'bg-violet-400/20 text-violet-500 dark:text-violet-400',
  'bg-blue-400/20 text-blue-500 dark:text-blue-400',
  'bg-emerald-400/20 text-emerald-600 dark:text-emerald-400',
  'bg-orange-400/20 text-orange-500 dark:text-orange-400',
  'bg-pink-400/20 text-pink-500 dark:text-pink-400',
  'bg-cyan-400/20 text-cyan-600 dark:text-cyan-400',
  'bg-amber-400/20 text-amber-600 dark:text-amber-400',
]

function categoryColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length]
}

const PRIORITY_STYLES: Record<string, string> = {
  high:   'bg-red-400/15 text-red-400 border border-red-400/30',
  medium: 'bg-amber-400/15 text-amber-500 dark:text-amber-400 border border-amber-400/30',
  low:    'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-emerald-400',
}

export default function TodoItem({
  todo, onToggle, onDelete, onEdit, onNotes, onArchive, isDraggable,
}: TodoItemProps) {
  const [isEditing,  setIsEditing]  = useState(false)
  const [editValue,  setEditValue]  = useState(todo.title)
  const [showNotes,  setShowNotes]  = useState(false)
  const [notesValue, setNotesValue] = useState(todo.notes ?? '')

  useEffect(() => { setNotesValue(todo.notes ?? '') }, [todo.notes])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id })

  const dndStyle = { transform: CSS.Transform.toString(transform), transition }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== todo.title) onEdit(todo.id, trimmed)
    else setEditValue(todo.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  handleSave()
    if (e.key === 'Escape') { setEditValue(todo.title); setIsEditing(false) }
  }

  const handleNotesSave = () => {
    const trimmed = notesValue.trim()
    if (trimmed !== (todo.notes ?? '').trim()) onNotes(todo.id, trimmed)
  }

  const isOverdue  = Boolean(!todo.completed && todo.due_date && new Date(todo.due_date + 'T23:59:59') < new Date())
  const isArchived = todo.archived === 1

  return (
    <div ref={setNodeRef} style={dndStyle} className={isDragging ? 'z-10 relative' : ''}>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 1.03 : 1 }}
        exit={{ opacity: 0, x: -24, scale: 0.97, transition: { duration: 0.18, ease: 'easeIn' } }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        whileHover={!isDragging ? { boxShadow: '0 4px 24px rgba(0,0,0,0.08)' } : undefined}
        className={`flex flex-col rounded-xl border transition-colors duration-200 ${
          todo.completed
            ? 'opacity-60 border-[var(--ink-light)]/25 bg-[var(--parchment-dark)] dark:bg-[var(--parchment)]'
            : 'border-[var(--gold)] bg-[var(--parchment-dark)] dark:bg-[var(--parchment)]'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">

          {isDraggable && (
            <motion.button
              {...attributes}
              {...listeners}
              whileHover={{ color: 'var(--gold)' }}
              className="text-[var(--ink-light)] cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
              title="Drag to reorder"
            >
              <GripVertical size={18} strokeWidth={1.8} />
            </motion.button>
          )}

          <motion.button
            data-testid="toggle"
            onClick={() => onToggle(todo.id)}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
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
                  <Check size={12} strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-w-0 bg-transparent border-b-2 border-[var(--violet)] outline-none font-['Lora'] text-[var(--ink)] py-0.5"
                />
              ) : (
                <span
                  onDoubleClick={() => !todo.completed && !isArchived && setIsEditing(true)}
                  title={todo.completed || isArchived ? '' : 'Double-click to edit'}
                  className={`font-['Lora'] text-[var(--ink)] cursor-default break-words transition-colors ${
                    todo.completed ? 'line-through text-[var(--ink-light)]' : 'hover:text-[var(--violet)]'
                  }`}
                >
                  {todo.title}
                </span>
              )}

              {todo.priority && todo.priority !== 'none' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 flex items-center gap-1 font-['Lora'] ${PRIORITY_STYLES[todo.priority]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[todo.priority]}`} />
                  {todo.priority}
                </span>
              )}

              {todo.category && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-['Lora'] ${categoryColor(todo.category)}`}>
                  {todo.category}
                </span>
              )}

              {todo.recurrence && todo.recurrence !== 'none' && (
                <span className="text-[var(--ink-light)] flex-shrink-0" title={`Repeats ${todo.recurrence}`}>
                  <RefreshCw size={11} strokeWidth={2} />
                </span>
              )}
            </div>

            {todo.due_date && (
              <span className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-[var(--ink-light)]'}`}>
                <Calendar size={11} strokeWidth={2} />
                {new Date(todo.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {isOverdue && ' · overdue'}
              </span>
            )}

            <AnimatePresence>
              {todo.notes && !showNotes && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-[var(--ink-light)] mt-1 italic truncate overflow-hidden"
                >
                  {todo.notes}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <motion.button
              onClick={() => setShowNotes(v => !v)}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-colors ${
                showNotes || todo.notes ? 'text-[var(--violet)]' : 'text-[var(--ink-light)] hover:text-[var(--violet)]'
              }`}
              title="Notes"
            >
              <NotepadText size={15} strokeWidth={1.8} />
            </motion.button>

            <motion.button
              onClick={() => onArchive(todo.id)}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg text-[var(--ink-light)] hover:text-[var(--gold)] transition-colors"
              title={isArchived ? 'Unarchive' : 'Archive'}
            >
              {isArchived
                ? <ArchiveRestore size={15} strokeWidth={1.8} />
                : <Archive size={15} strokeWidth={1.8} />
              }
            </motion.button>

            <motion.button
              data-testid="delete"
              onClick={() => onDelete(todo.id)}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg text-[var(--ink-light)] hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} strokeWidth={1.8} />
            </motion.button>
          </div>
        </div>

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
                <textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  onBlur={handleNotesSave}
                  placeholder="Add a note... (saved on blur)"
                  rows={2}
                  className="w-full mt-3 bg-transparent border border-[var(--ink-light)]/20 rounded-lg p-2.5 text-sm font-['Lora'] text-[var(--ink)] placeholder-[var(--ink-light)] outline-none focus:border-[var(--violet)] transition-colors resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
