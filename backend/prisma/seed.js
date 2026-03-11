const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  // Crear roles
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { id_rol: 1 },
      update: {},
      create: { id_rol: 1, nombre_rol: 'Administrador', descripcion: 'Acceso total al sistema' }
    }),
    prisma.rol.upsert({
      where: { id_rol: 2 },
      update: {},
      create: { id_rol: 2, nombre_rol: 'Manager', descripcion: 'Gestión de inventario y reportes' }
    }),
    prisma.rol.upsert({
      where: { id_rol: 3 },
      update: {},
      create: { id_rol: 3, nombre_rol: 'Operador', descripcion: 'Registro de movimientos' }
    }),
    prisma.rol.upsert({
      where: { id_rol: 4 },
      update: {},
      create: { id_rol: 4, nombre_rol: 'Viewer', descripcion: 'Solo lectura' }
    }),
  ])

  console.log('✔ Roles creados:', roles.map(r => r.nombre_rol).join(', '))

  // Crear usuario administrador por defecto
  const adminPassword = await bcrypt.hash('Admin123!', 12)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@inventario.com' },
    update: {},
    create: {
      nombre_completo: 'Administrador',
      email: 'admin@inventario.com',
      password_hash: adminPassword,
      id_rol: 1,
      estado: 'Activo'
    }
  })

  console.log('✔ Usuario admin creado:', admin.email)
  console.log('  Contraseña: Admin123!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())