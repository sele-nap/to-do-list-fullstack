'use client'

import { useState, useEffect } from 'react'
import TodoForm from './Components/TodoForm'
import TodoItem from './Components/TodoItem'
import FilterBar, { type Filter } from './Components/FilterBar'

interface Todo {
  id: number
  title: string
  completed: number
  created_at: string
  due_date: string | null
}

const API = 'http://localhost:5000/api/todos'

export default function Home() {
  const [todos, setTodos]   = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    fetch(API)
      .then(res => res.json())
      .then(data => setTodos(data))
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved ? saved === 'dark' : prefersDark
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const handleAdd = async (title: string, due_date?: string) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, due_date })
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

  const handleEdit = async (id: number, title: string) => {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const remaining = todos.filter(t => !t.completed).length

  const counts = {
    all:    todos.length,
    active: todos.filter(t => !t.completed).length,
    done:   todos.filter(t => t.completed).length,
  }

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'done')   return t.completed
    return true
  })

  return (
    <main className="min-h-screen py-12 px-4">

      <button
        onClick={toggleDark}
        className="fixed top-4 right-4 text-2xl hover:scale-110 transition-transform z-50"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

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

        <FilterBar current={filter} onChange={setFilter} counts={counts} />

        <div className="flex flex-col gap-3">
          {filteredTodos.length === 0 ? (
            <p className="text-center text-[var(--ink-light)] italic py-8">
              {filter === 'done'   ? 'No completed tasks yet... ✨' :
               filter === 'active' ? 'All tasks are done! 🌿'      :
               'Your grimoire is empty... add a task! 🍄'}
            </p>
          ) : (
            filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>

      </div>
    </main>
  )
}
