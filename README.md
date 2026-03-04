# Grimoire — To-Do List

Full-stack task manager with a cozy aesthetic. Next.js frontend, Express + SQLite backend.

## Stack

| | |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **Backend** | Express 5, TypeScript, better-sqlite3 |
| **Auth** | JWT, bcryptjs |
| **Security** | helmet, zod, express-rate-limit |

## Features

- Tasks with priority, due date, category, recurrence, subtasks, and Markdown notes
- Drag-and-drop reordering (mouse & touch), sort, filter, full-text search
- Bulk actions, undo delete, JSON export, keyboard shortcuts
- Dark / light mode, confetti on completion, PWA manifest
- WCAG AA accessibility (ARIA, focus-visible, prefers-reduced-motion)

## Getting Started

```bash
# Backend (port 5000)
cd backend && npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm run dev
```

## Environment Variables

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` |
| `CORS_ORIGIN` | `http://localhost:3000` |
| `PORT` | `5000` |

## Keyboard Shortcuts

`n` new task · `/` search · `?` shortcuts · `d` dark mode · `e` export · `1–4` filters
