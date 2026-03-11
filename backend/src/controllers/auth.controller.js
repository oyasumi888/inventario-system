const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Generar access token (corta duración)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, nombre_rol: user.rol.nombre_rol },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
  )
}

// Generar refresh token (larga duración)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id_usuario: user.id_usuario },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d' }
  )
}

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { nombre_completo, email, password, id_rol } = req.body

  try {
    // Verificar si el email ya existe
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) {
      return res.status(409).json({ message: 'El email ya está registrado' })
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 12)

    // Obtener rol (por defecto OPERADOR si no se especifica)
    const rolId = id_rol || (await prisma.rol.findFirst({
      where: { nombre_rol: 'Operador' }
    }))?.id_rol

    if (!rolId) {
      return res.status(400).json({ message: 'Rol no encontrado, ejecuta el seed primero' })
    }

    const usuario = await prisma.usuario.create({
      data: { nombre_completo, email, password_hash, id_rol: rolId },
      include: { rol: true }
    })

    const accessToken = generateAccessToken(usuario)
    const refreshToken = generateRefreshToken(usuario)

    // Guardar refresh token en cookie HttpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    })

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      accessToken,
      user: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol.nombre_rol
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al registrar usuario' })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body

  try {
    // Buscar usuario con su rol
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true }
    })

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    if (usuario.estado !== 'Activo') {
      return res.status(403).json({ message: 'Usuario inactivo, contacta al administrador' })
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash)
    if (!passwordValido) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const accessToken = generateAccessToken(usuario)
    const refreshToken = generateRefreshToken(usuario)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      message: 'Login exitoso',
      accessToken,
      user: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol.nombre_rol
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al iniciar sesión' })
  }
}

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const token = req.cookies.refreshToken

  if (!token) {
    return res.status(401).json({ message: 'Refresh token no encontrado' })
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id_usuario },
      include: { rol: true }
    })

    if (!usuario || usuario.estado !== 'Activo') {
      return res.status(403).json({ message: 'Usuario no válido' })
    }

    const accessToken = generateAccessToken(usuario)

    res.json({ accessToken })
  } catch (error) {
    return res.status(403).json({ message: 'Refresh token inválido o expirado' })
  }
}

// POST /api/auth/logout
const logout = (req, res) => {
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
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: req.user.id_usuario },
      include: { rol: true }
    })

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    res.json({
      id_usuario: usuario.id_usuario,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      rol: usuario.rol.nombre_rol,
      estado: usuario.estado
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario' })
  }
}

module.exports = { register, login, refresh, logout, me }
