const jwt = require('jsonwebtoken')

// Verifica que el request tenga un JWT válido
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

// Verifica que el usuario tenga el rol requerido
const verifyRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' })
    }

    next()
  }
}

module.exports = { verifyToken, verifyRole }