'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Todo {
  id: number
  title: string
  completed: number
  created_at: string
  due_date: string | null
}

interface TodoItemProps {
  todo: Todo
  onToggle:    (id: number) => void
  onDelete:    (id: number) => void
  onEdit:      (id: number, newTitle: string) => void
  isDraggable: boolean
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit, isDraggable }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.title)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity:   isDragging ? 0.4 : 1,
    zIndex:    isDragging ? 10 : undefined,
  }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== todo.title) {
      onEdit(todo.id, trimmed)
    } else {
      setEditValue(todo.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  handleSave()
    if (e.key === 'Escape') { setEditValue(todo.title); setIsEditing(false) }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors duration-200 ${
        todo.completed
          ? 'opacity-60 border-[var(--parchment-dark)] bg-[var(--parchment-dark)]'
          : 'border-[var(--gold)] bg-[var(--parchment-dark)]'
      }`}
    >

      {isDraggable && (
        <button
          {...attributes}
          {...listeners}
          className="text-[var(--ink-light)] hover:text-[var(--gold)] cursor-grab active:cursor-grabbing touch-none flex-shrink-0 text-lg leading-none"
          title="Drag to reorder"
        >
          ⠿
        </button>
      )}

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

      <div className="flex-1 flex flex-col">
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-b-2 border-[var(--violet)] outline-none font-['Lora'] text-[var(--ink)] py-0.5"
          />
        ) : (
          <span
            onDoubleClick={() => !todo.completed && setIsEditing(true)}
            title={todo.completed ? '' : 'Double-click to edit'}
            className={`font-['Lora'] text-[var(--ink)] cursor-default ${
              todo.completed ? 'line-through text-[var(--ink-light)]' : 'hover:text-[var(--violet)]'
            }`}
          >
            {todo.title}
          </span>
        )}
        {todo.due_date && (
          <span className={`text-xs mt-0.5 ${
            !todo.completed && new Date(todo.due_date) < new Date()
              ? 'text-red-400'
              : 'text-[var(--ink-light)]'
          }`}>
            📅 {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {!todo.completed && new Date(todo.due_date) < new Date() && ' · overdue'}
          </span>
        )}
      </div>

      <button
        onClick={() => onDelete(todo.id)}
        className="text-[var(--ink-light)] hover:text-red-400 transition-colors text-lg"
      >
        🗑
      </button>
    </div>
  )
}
