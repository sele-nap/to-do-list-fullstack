'use client'

import { motion } from 'framer-motion'

export type Filter = 'all' | 'active' | 'done' | 'today'

interface FilterBarProps {
  current:  Filter
  onChange: (filter: Filter) => void
  counts:   { all: number; active: number; done: number; today: number }
}

const FILTERS: { value: Filter; label: string; emoji: string }[] = [
  { value: 'all',    label: 'All',    emoji: '📜' },
  { value: 'active', label: 'Active', emoji: '🌿' },
  { value: 'today',  label: 'Today',  emoji: '🌙' },
  { value: 'done',   label: 'Done',   emoji: '✨' },
]

export default function FilterBar({ current, onChange, counts }: FilterBarProps) {
  return (
    <nav aria-label="Filter tasks" className="mb-6">
      <div role="group" aria-label="Filter options" className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <motion.button
            key={f.value}
            onClick={() => onChange(f.value)}
            whileTap={{ scale: 0.96 }}
            aria-pressed={current === f.value}
            aria-label={`${f.label} tasks: ${counts[f.value]}`}
            className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-sm font-['Lora'] transition-all duration-200 border ${
              current === f.value
                ? 'bg-[var(--forest)] text-[var(--parchment)] border-[var(--forest)]'
                : 'bg-[var(--parchment)] text-[var(--ink-light)] border-[var(--gold)] hover:border-[var(--forest)]'
            }`}
          >
            <span aria-hidden="true">{f.emoji}</span>{' '}{f.label}
            <span className={`ml-1 text-xs ${current === f.value ? 'opacity-80' : 'opacity-50'}`} aria-hidden="true">
              ({counts[f.value]})
            </span>
          </motion.button>
        ))}
      </div>
    </nav>
  )
}
