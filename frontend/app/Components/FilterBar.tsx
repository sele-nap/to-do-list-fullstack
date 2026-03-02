'use client'

export type Filter = 'all' | 'active' | 'done'

interface FilterBarProps {
  current: Filter
  onChange: (filter: Filter) => void
  counts: { all: number; active: number; done: number }
}

export default function FilterBar({ current, onChange, counts }: FilterBarProps) {
  const filters: { value: Filter; label: string; emoji: string }[] = [
    { value: 'all',    label: 'All',    emoji: '📜' },
    { value: 'active', label: 'Active', emoji: '🌿' },
    { value: 'done',   label: 'Done',   emoji: '✨' },
  ]

  return (
    <div className="flex gap-2 mb-6">
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-['Lora'] transition-all duration-200 border ${
            current === f.value
              ? 'bg-[var(--forest)] text-[var(--parchment)] border-[var(--forest)]'
              : 'bg-[var(--parchment)] text-[var(--ink-light)] border-[var(--gold)] hover:border-[var(--forest)]'
          }`}
        >
          {f.emoji} {f.label}
          <span className={`ml-1 text-xs ${current === f.value ? 'opacity-80' : 'opacity-50'}`}>
            ({counts[f.value]})
          </span>
        </button>
      ))}
    </div>
  )
}
