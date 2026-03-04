'use client'

import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'

export type SortKey = 'position' | 'priority' | 'due_date' | 'title' | 'created_at'
export type SortDir = 'asc' | 'desc'

export interface SortConfig {
  key: SortKey
  dir: SortDir
}

interface SortBarProps {
  sort:     SortConfig
  onChange: (s: SortConfig) => void
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'position',   label: 'Manual' },
  { value: 'due_date',   label: 'Due date' },
  { value: 'priority',   label: 'Priority' },
  { value: 'title',      label: 'Name' },
  { value: 'created_at', label: 'Created' },
]

export default function SortBar({ sort, onChange }: SortBarProps) {
  const handleKey = (key: SortKey) => {
    if (sort.key === key) {
      onChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      onChange({ key, dir: key === 'priority' ? 'desc' : 'asc' })
    }
  }

  return (
    <div role="group" aria-label="Sort tasks" className="flex items-center gap-2 mb-4 flex-wrap">
      <span className="text-xs text-[var(--ink-light)] font-['Lora'] flex items-center gap-1 flex-shrink-0" aria-hidden="true">
        <ArrowUpDown size={11} strokeWidth={2} aria-hidden="true" />
        Sort:
      </span>
      {SORT_OPTIONS.map(o => {
        const isActive = sort.key === o.value
        const dir      = isActive ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
        return (
          <motion.button
            key={o.value}
            onClick={() => handleKey(o.value)}
            whileTap={{ scale: 0.95 }}
            aria-pressed={isActive}
            aria-label={`Sort by ${o.label}${isActive ? `, currently ${dir}` : ''}`}
            className={`text-xs px-2.5 py-1 rounded-lg font-['Lora'] border transition-all ${
              isActive
                ? 'bg-[var(--violet)]/15 border-[var(--violet)] text-[var(--violet)]'
                : 'border-[var(--ink-light)]/25 text-[var(--ink-light)] hover:border-[var(--gold)]'
            }`}
          >
            {o.label}
            {isActive && (
              <span className="ml-1 opacity-70" aria-hidden="true">
                {sort.dir === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
