'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { AUTH_URL } from '@/lib/config'

export default function LoginPage() {
  const router = useRouter()
  const [mode,     setMode]    = useState<'login' | 'register'>('login')
  const [email,    setEmail]   = useState('')
  const [password, setPass]    = useState('')
  const [error,    setError]   = useState('')
  const [loading,  setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res  = await fetch(`${AUTH_URL}/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    localStorage.setItem('token', data.token)
    toast.success(mode === 'login' ? 'Welcome back! 🔮' : 'Account created! ✨')
    router.push('/')
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.p
            className="text-5xl mb-3"
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, delay: 0.4, ease: 'easeInOut' }}
          >
            🔮
          </motion.p>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <h1
                style={{ fontFamily: "'IM Fell English', serif" }}
                className="text-3xl text-[var(--ink)] mb-1"
              >
                {mode === 'login' ? 'Welcome back' : 'Join the coven'}
              </h1>
              <p className="text-[var(--ink-light)] italic text-sm">
                {mode === 'login' ? 'Enter your grimoire' : 'Create your account'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-[var(--parchment-dark)] dark:bg-[var(--parchment)] border border-[var(--gold)] rounded-2xl p-6"
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-xl border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] placeholder:text-[var(--ink-light)] outline-none focus:border-[var(--violet)] font-['Lora'] transition-colors"
          />
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPass(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-xl border border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] placeholder:text-[var(--ink-light)] outline-none focus:border-[var(--violet)] font-['Lora'] transition-colors"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm text-center overflow-hidden"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-2 rounded-xl bg-[var(--forest)] text-[var(--parchment)] font-['Lora'] hover:bg-[var(--forest-dark)] transition-colors disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? '✦ Enter' : '✦ Create account'}
          </motion.button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-4">
          <p className="text-[var(--ink-light)] text-sm italic">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <motion.button
            onClick={switchMode}
            whileTap={{ scale: 0.97 }}
            className="w-full py-2 rounded-xl border-2 border-[var(--violet)] text-[var(--violet)] font-['Lora'] hover:bg-[var(--violet)] hover:text-[var(--parchment)] transition-colors"
          >
            {mode === 'login' ? '✦ Create an account' : '← Back to login'}
          </motion.button>
        </div>
      </motion.div>
    </main>
  )
}
