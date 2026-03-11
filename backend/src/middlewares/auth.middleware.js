const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  console.log('Auth header recibido:', authHeader)
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado, token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' })
  }
}

const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' })
    }
    if (!roles.includes(req.user.nombre_rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' })
    }
    next()
  }
}

module.exports = { verifyToken, verifyRole }