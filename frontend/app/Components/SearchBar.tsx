'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value:      string
  onChange:   (value: string) => void
  inputRef?:  React.RefObject<HTMLInputElement | null>
}

export default function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
  return (
    <div className="relative mb-4">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-light)] pointer-events-none">
        <Search size={15} strokeWidth={2} />
      </span>
      <label htmlFor="search-tasks" className="sr-only">Search tasks</label>
      <input
        id="search-tasks"
        ref={inputRef}
        type="search"
        role="searchbox"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search tasks, notes, categories... (/)"
        aria-label="Search tasks"
        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] placeholder-[var(--ink-light)] font-['Lora'] text-sm focus:outline-none focus:border-[var(--violet)] transition-colors"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            onClick={() => onChange('')}
            whileTap={{ scale: 0.85 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-light)] hover:text-red-400 transition-colors"
            title="Clear search"
          >
            <X size={14} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
