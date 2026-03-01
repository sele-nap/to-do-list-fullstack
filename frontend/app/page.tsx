'use client'

import { useState, useEffect } from 'react'
import TodoForm from './Components/TodoForm'
import TodoItem from './Components/TodoItem'

interface Todo {
  id: number
  title: string
  completed: number
  created_at: string
}

const API = 'http://localhost:5000/api/todos'

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    fetch(API)
      .then(res => res.json())
      .then(data => setTodos(data))
  }, [])

  const handleAdd = async (title: string) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    const newTodo = await res.json()
    setTodos(prev => [newTodo, ...prev])
  }

  const handleToggle = async (id: number) => {
    const res = await fetch(`${API}/${id}`, { method: 'PUT' })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  const handleDelete = async (id: number) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const remaining = todos.filter(t => !t.completed).length

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">

        <div className="text-center mb-10">
          <p className="text-4xl mb-3">🔮</p>
          <h1 style={{ fontFamily: "'IM Fell English', serif" }}
              className="text-4xl text-[var(--ink)] mb-2">
            To-Do List
          </h1>
          <p className="text-[var(--ink-light)] italic">
            {remaining === 0
              ? '✨ All tasks complete — well done, witch!'
              : `🌿 ${remaining} task${remaining > 1 ? 's' : ''} remaining`}
          </p>
        </div>

        <TodoForm onAdd={handleAdd} />

        <div className="flex flex-col gap-3">
          {todos.length === 0 ? (
            <p className="text-center text-[var(--ink-light)] italic py-8">
              Your grimoire is empty... add a task! 🍄
            </p>
          ) : (
            todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

      </div>
    </main>
  )
}
