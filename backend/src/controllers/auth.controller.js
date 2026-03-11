const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')

// Generar tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id_usuario, email: user.email, rol: user.rol.nombre_rol },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
  )
}

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id_usuario },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d' }
  )
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nombre_completo, email, password, id_rol } = req.body

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' })
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 12)

    // Crear usuario
    const user = await prisma.usuario.create({
      data: {
        nombre_completo,
        email,
        password_hash: passwordHash,
        id_rol: id_rol || 3, // Por defecto OPERADOR
      },
      include: { rol: true }
    })

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol: user.rol.nombre_rol
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Buscar usuario con su rol
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true }
    })

    // Verificar usuario y contraseña
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    // Verificar que esté activo
    if (user.estado !== 'Activo') {
      return res.status(403).json({ message: 'Usuario inactivo, contacta al administrador' })
    }

    // Generar tokens
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Guardar refresh token en cookie HttpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días en ms
    })

    res.json({
      accessToken,
      user: {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol: user.rol.nombre_rol
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken

    if (!token) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id },
      include: { rol: true }
    })

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    const accessToken = generateAccessToken(user)

    res.json({ accessToken })
  } catch (error) {
    res.status(401).json({ message: 'Refresh token inválido o expirado' })
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  res.json({ message: 'Sesión cerrada exitosamente' })
}

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: req.user.id },
      include: { rol: true }
    })

    res.json({
      id_usuario: user.id_usuario,
      nombre_completo: user.nombre_completo,
      email: user.email,
      rol: user.rol.nombre_rol,
      estado: user.estado
    })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { register, login, refresh, logout, me }