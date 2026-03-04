export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

export const TODOS_URL    = `${API_BASE}/todos`
export const AUTH_URL     = `${API_BASE}/auth`
export const SUBTASKS_URL = (todoId: number) => `${API_BASE}/todos/${todoId}/subtasks`
