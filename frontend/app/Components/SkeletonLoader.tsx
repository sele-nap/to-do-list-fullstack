'use client'

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--gold)]/30 bg-[var(--parchment-dark)] dark:bg-[var(--parchment)] animate-pulse">
      <div className="w-6 h-6 rounded-full bg-[var(--ink-light)]/20 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 rounded-full bg-[var(--ink-light)]/20 w-3/4" />
        <div className="h-3 rounded-full bg-[var(--ink-light)]/10 w-1/3" />
      </div>
      <div className="w-6 h-6 rounded-lg bg-[var(--ink-light)]/10 flex-shrink-0" />
    </div>
  )
}

export default function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
