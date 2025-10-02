import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import listings from './routes/listings.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (_req, res) => res.json({ ok: true, name: 'market-api' }))
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

app.use('/api/listings', listings)

const PORT = process.env.PORT || 4000
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API http://localhost:${PORT}`)))
  .catch(err => { console.error('Mongo connect failed:', err.message); process.exit(1) })
