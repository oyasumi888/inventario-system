const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')

// Rutas
const authRoutes = require('./routes/auth.routes')

const app = express()

// Middlewares de seguridad
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Rate limit global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones, intenta más tarde' }
}))

// Middlewares generales
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

// Rutas
app.use('/api/auth', authRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: `Ruta ${req.method} ${req.url} no encontrada` })
})

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Error interno del servidor' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})