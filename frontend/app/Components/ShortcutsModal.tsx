'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ShortcutsModalProps {
  open:    boolean
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['n'],      desc: 'Focus new task input' },
  { keys: ['/'],      desc: 'Focus search bar' },
  { keys: ['?'],      desc: 'Open this shortcuts panel' },
  { keys: ['Esc'],    desc: 'Close modal / clear search' },
  { keys: ['d'],      desc: 'Toggle dark mode' },
  { keys: ['e'],      desc: 'Export todos (JSON)' },
  { keys: ['1'],      desc: 'Filter: All' },
  { keys: ['2'],      desc: 'Filter: Active' },
  { keys: ['3'],      desc: 'Filter: Today' },
  { keys: ['4'],      desc: 'Filter: Done' },
]

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-[var(--parchment-dark)] border border-[var(--gold)] rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ink-light)]/15">
                <h2
                  style={{ fontFamily: "'IM Fell English', serif" }}
                  className="text-lg text-[var(--ink)]"
                >
                  ⌨️ Keyboard Shortcuts
                </h2>
                <button
                  onClick={onClose}
                  className="text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors p-1"
                >
                  <X size={18} strokeWidth={1.8} />
                </button>
              </div>

              <ul className="px-5 py-4 flex flex-col gap-2.5">
                {SHORTCUTS.map(s => (
                  <li key={s.keys.join('+')} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-['Lora'] text-[var(--ink-light)]">{s.desc}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      {s.keys.map(k => (
                        <kbd
                          key={k}
                          className="min-w-[1.75rem] text-center px-1.5 py-0.5 rounded-md border border-[var(--ink-light)]/30 bg-[var(--parchment)] text-xs font-mono text-[var(--ink)] shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
