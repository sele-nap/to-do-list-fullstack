'use client'

interface Todo {
  id: number
  title: string
  completed: number
  created_at: string
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
      todo.completed
        ? 'opacity-60 border-[var(--parchment-dark)] bg-[var(--parchment-dark)]'
        : 'border-[var(--gold)] bg-white/60'
    }`}>

      <button
        onClick={() => onToggle(todo.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          todo.completed
            ? 'bg-[var(--forest)] border-[var(--forest)] text-white'
            : 'border-[var(--gold-dark)] hover:border-[var(--forest)]'
        }`}
      >
        {todo.completed ? '✓' : ''}
      </button>

      <span className={`flex-1 font-['Lora'] text-[var(--ink)] ${
        todo.completed ? 'line-through text-[var(--ink-light)]' : ''
      }`}>
        {todo.title}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="text-[var(--ink-light)] hover:text-red-400 transition-colors text-lg"
      >
        🗑
      </button>
    </div>
  )
}
