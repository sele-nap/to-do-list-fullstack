'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Moon, Sun, ArrowLeft } from 'lucide-react'

interface Stats {
  total:          number
  completed:      number
  pending:        number
  overdue:        number
  completionRate: number
  byPriority:     { high: number; medium: number; low: number }
  archived:       number
}

const API = 'http://localhost:5000/api/todos'

const STAT_CARDS = [
  { key: 'total',     label: 'Total tasks', emoji: '📜', color: 'text-[var(--ink)]'       },
  { key: 'completed', label: 'Completed',   emoji: '✅', color: 'text-[var(--forest)]'    },
  { key: 'pending',   label: 'Pending',     emoji: '🌿', color: 'text-[var(--gold-dark)]' },
  { key: 'overdue',   label: 'Overdue',     emoji: '⚠️', color: 'text-red-400'             },
] as const

const PRIORITY_BARS = [
  { key: 'high',   label: '🔴 High',   color: 'bg-red-400'       },
  { key: 'medium', label: '🟡 Medium', color: 'bg-[var(--gold)]' },
  { key: 'low',    label: '🟢 Low',    color: 'bg-[var(--forest)]' },
] as const

export default function StatsPage() {
  const router = useRouter()
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [isDark,  setIsDark]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    fetch(`${API}/stats`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => { if (data) setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const saved       = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark        = saved ? saved === 'dark' : prefersDark
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:py-16">

      <motion.button
        onClick={toggleDark}
        whileTap={{ scale: 0.85, rotate: 20 }}
        className="fixed top-4 left-4 text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors z-50"
      >
        {isDark ? <Sun size={22} strokeWidth={1.8} /> : <Moon size={22} strokeWidth={1.8} />}
      </motion.button>

      <Link
        href="/"
        className="fixed top-4 right-4 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[var(--ink-light)]/40 text-[var(--ink-light)] font-['Lora'] hover:border-[var(--violet)] hover:text-[var(--violet)] transition-colors z-50"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Back
      </Link>

      <div className="max-w-xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="text-center mb-10"
        >
          <p className="text-4xl mb-3">📊</p>
          <h1
            style={{ fontFamily: "'IM Fell English', serif" }}
            className="text-3xl sm:text-4xl text-[var(--ink)] mb-2"
          >
            Grimoire Stats
          </h1>
          <p className="text-[var(--ink-light)] italic text-sm">
            Your magical productivity at a glance
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="h-24 rounded-xl bg-[var(--parchment-dark)] dark:bg-[var(--parchment)] animate-pulse"
              />
            ))}
          </div>
        ) : !stats ? (
          <p className="text-center text-[var(--ink-light)] italic">Could not load stats.</p>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="flex flex-col gap-4"
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="p-6 rounded-xl border border-[var(--gold)] bg-[var(--parchment-dark)] dark:bg-[var(--parchment)] text-center"
            >
              <p className="text-6xl font-bold text-[var(--forest)] mb-1">
                {stats.completionRate}%
              </p>
              <p className="text-[var(--ink-light)] font-['Lora'] italic text-sm">
                Completion rate
              </p>
              <div className="mt-4 h-2 bg-[var(--parchment-dark)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(to right, var(--forest), var(--violet))' }}
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {STAT_CARDS.map(card => (
                <motion.div
                  key={card.key}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="p-5 rounded-xl border border-[var(--gold)]/40 bg-[var(--parchment-dark)] dark:bg-[var(--parchment)]"
                >
                  <p className="text-3xl mb-1">{card.emoji}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{stats[card.key]}</p>
                  <p className="text-[var(--ink-light)] text-sm font-['Lora'] italic">{card.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="p-5 rounded-xl border border-[var(--gold)]/40 bg-[var(--parchment-dark)] dark:bg-[var(--parchment)]"
            >
              <p className="text-[var(--ink)] font-['Lora'] mb-4 font-semibold">By priority</p>
              <div className="flex flex-col gap-3">
                {PRIORITY_BARS.map(p => {
                  const count = stats.byPriority[p.key]
                  const pct   = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={p.key}>
                      <div className="flex justify-between text-sm font-['Lora'] text-[var(--ink-light)] mb-1">
                        <span>{p.label}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-[var(--parchment-dark)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
                          className={`h-full rounded-full ${p.color}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="p-5 rounded-xl border border-[var(--ink-light)]/20 bg-[var(--parchment-dark)] dark:bg-[var(--parchment)] flex items-center gap-4"
            >
              <span className="text-3xl">📦</span>
              <div>
                <p className="text-2xl font-bold text-[var(--ink-light)]">{stats.archived}</p>
                <p className="text-[var(--ink-light)] text-sm font-['Lora'] italic">Archived tasks</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
