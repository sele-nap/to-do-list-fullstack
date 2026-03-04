'use client'

interface ProgressBarProps {
  total: number
  done:  number
}

export default function ProgressBar({ total, done }: ProgressBarProps) {
  if (total === 0) return null

  const pct = Math.round((done / total) * 100)

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-[var(--ink-light)] mb-1.5 font-['Lora'] italic">
        <span>{done} of {total} complete</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[var(--parchment-dark)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, var(--forest), var(--violet))`,
          }}
        />
      </div>
    </div>
  )
}
