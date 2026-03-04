import express from 'express'
import cors from 'cors'
import todosRouter from './routes/todos'
import authRouter from './routes/auth'

const app = express()
const PORT = 5000

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/todos', todosRouter)

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})
