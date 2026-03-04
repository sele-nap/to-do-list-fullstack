'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, X, ChevronDown, ChevronUp, FolderOpen, RefreshCw, StickyNote } from 'lucide-react'
import type { Priority, Recurrence } from './TodoItem'

interface TodoFormProps {
  onAdd: (title: string, due_date?: string, priority?: Priority, notes?: string, category?: string, recurrence?: Recurrence) => void
}

const PRIORITY_OPTIONS: { value: Priority; label: string; active: string }[] = [
  { value: 'none',   label: '—',      active: 'bg-[var(--parchment-dark)] border-[var(--gold)] text-[var(--ink-light)]' },
  { value: 'low',    label: 'Low',    active: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' },
  { value: 'medium', label: 'Medium', active: 'bg-amber-500/20  border-amber-500/40  text-amber-600  dark:text-amber-400' },
  { value: 'high',   label: 'High',   active: 'bg-red-500/20    border-red-500/40    text-red-500' },
]

const PRIORITY_DOT: Record<Priority, string> = {
  none: '', low: 'bg-emerald-400', medium: 'bg-amber-400', high: 'bg-red-400',
}

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none',    label: 'Once'    },
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
]

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [value,      setValue]      = useState('')
  const [dueDate,    setDueDate]    = useState('')
  const [priority,   setPriority]   = useState<Priority>('none')
  const [notes,      setNotes]      = useState('')
  const [category,   setCategory]   = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [showMore,   setShowMore]   = useState(false)

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(
      value.trim(),
      dueDate         || undefined,
      priority,
      notes.trim()    || undefined,
      category.trim() || undefined,
      recurrence,
    )
    setValue('')
    setDueDate('')
    setPriority('none')
    setNotes('')
    setCategory('')
    setRecurrence('none')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">

      {/* ── Ligne principale ── */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Add a new magical task..."
          className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] placeholder-[var(--ink-light)] font-['Lora'] focus:outline-none focus:border-[var(--violet)] transition-colors"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          className="px-5 py-3 rounded-xl bg-[var(--forest)] text-[var(--parchment)] font-['Lora'] font-semibold hover:bg-[var(--forest-dark)] transition-colors whitespace-nowrap"
        >
          ✦ Add
        </motion.button>
      </div>

      {/* ── Ligne 2 : date + priorité ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <CalendarDays size={14} className="text-[var(--ink-light)]" strokeWidth={1.8} />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink-light)] font-['Lora'] text-sm focus:outline-none focus:border-[var(--violet)] transition-colors"
          />
          <AnimatePresence>
            {dueDate && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
                onClick={() => setDueDate('')}
                whileTap={{ scale: 0.85 }}
                className="text-[var(--ink-light)] hover:text-red-400 transition-colors"
                title="Clear date"
              >
                <X size={13} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Priorité */}
        <div className="flex items-center gap-1">
          {PRIORITY_OPTIONS.map(p => (
            <motion.button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              whileTap={{ scale: 0.9 }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-['Lora'] border transition-colors ${
                priority === p.value
                  ? p.active
                  : 'bg-transparent border-[var(--parchment-dark)] text-[var(--ink-light)] hover:border-[var(--gold)]'
              }`}
            >
              {p.value !== 'none' && (
                <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[p.value]}`} />
              )}
              {p.label}
            </motion.button>
          ))}
        </div>

        {/* Toggle more options */}
        <motion.button
          type="button"
          onClick={() => setShowMore(v => !v)}
          whileTap={{ scale: 0.9 }}
          className="ml-auto flex items-center gap-1 text-xs text-[var(--ink-light)] font-['Lora'] italic hover:text-[var(--violet)] transition-colors"
        >
          {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showMore ? 'Less' : 'More'}
        </motion.button>
      </div>

      {/* ── Options avancées (accordéon) ── */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-3 pt-3 border-t border-[var(--ink-light)]/10">

              {/* Catégorie */}
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-[var(--ink-light)] flex-shrink-0" strokeWidth={1.8} />
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Category (e.g. Work, Personal...)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] placeholder-[var(--ink-light)] font-['Lora'] text-sm focus:outline-none focus:border-[var(--violet)] transition-colors"
                />
              </div>

              {/* Récurrence */}
              <div className="flex items-center gap-2 flex-wrap">
                <RefreshCw size={14} className="text-[var(--ink-light)] flex-shrink-0" strokeWidth={1.8} />
                <div className="flex gap-1 flex-wrap">
                  {RECURRENCE_OPTIONS.map(r => (
                    <motion.button
                      key={r.value}
                      type="button"
                      onClick={() => setRecurrence(r.value)}
                      whileTap={{ scale: 0.9 }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-['Lora'] border transition-colors ${
                        recurrence === r.value
                          ? 'bg-[var(--violet)]/20 border-[var(--violet)]/50 text-[var(--violet)]'
                          : 'bg-transparent border-[var(--parchment-dark)] text-[var(--ink-light)] hover:border-[var(--violet)]'
                      }`}
                    >
                      {r.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex items-start gap-2">
                <StickyNote size={14} className="text-[var(--ink-light)] flex-shrink-0 mt-2" strokeWidth={1.8} />
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] placeholder-[var(--ink-light)] font-['Lora'] text-sm focus:outline-none focus:border-[var(--violet)] transition-colors resize-none"
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
