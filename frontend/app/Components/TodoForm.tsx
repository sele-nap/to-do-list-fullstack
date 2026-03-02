'use client'

import { useState } from 'react'

interface TodoFormProps {
  onAdd: (title: string, due_date?: string) => void
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [value,   setValue]   = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim(), dueDate || undefined)
    setValue('')
    setDueDate('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Add a new magical task..."
          className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink)] placeholder-[var(--ink-light)] font-['Lora'] focus:outline-none focus:border-[var(--violet)] transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-[var(--forest)] text-[var(--parchment)] font-['Lora'] font-semibold hover:bg-[var(--forest-dark)] transition-colors"
        >
          ✦ Add
        </button>
      </div>
      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        className="px-4 py-2 rounded-xl border-2 border-[var(--gold)] bg-[var(--parchment)] text-[var(--ink-light)] font-['Lora'] text-sm focus:outline-none focus:border-[var(--violet)] transition-colors"
      />
    </form>
  )
}
