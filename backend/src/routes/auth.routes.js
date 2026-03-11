const router = require('express').Router()
const { body } = require('express-validator')
const { register, login, refresh, logout, me } = require('../controllers/auth.controller')
const { verifyToken } = require('../middlewares/auth.middleware')
const rateLimit = require('express-rate-limit')

// Rate limit específico para login (máx 5 intentos cada 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos, espera 15 minutos' }
})

// Validaciones
const registerValidation = [
  body('nombre_completo').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres'),
]

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
]

// Rutas públicas
router.post('/register', registerValidation, register)
router.post('/login', loginLimiter, loginValidation, login)
router.post('/refresh', refresh)
router.post('/logout', logout)

// Rutas protegidas
router.get('/me', verifyToken, me)

module.exports = router