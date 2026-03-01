'use client'

import { useState } from 'react'

interface TodoFormProps {
  onAdd: (title: string) => void
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a new magical task..."
        className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--gold)] bg-white/70 text-[var(--ink)] placeholder-[var(--ink-light)] font-['Lora'] focus:outline-none focus:border-[var(--violet)] transition-colors"
      />
      <button
        type="submit"
        className="px-6 py-3 rounded-xl bg-[var(--forest)] text-[var(--parchment)] font-['Lora'] font-semibold hover:bg-[var(--forest-dark)] transition-colors"
      >
        ✦ Add
      </button>
    </form>
  )
}
