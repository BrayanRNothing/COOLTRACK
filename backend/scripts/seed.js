const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('123456', 10)

  // Clean up in correct order to avoid foreign key violations
  console.log('🧹 Cleaning up old data...')
  await prisma.mantenimiento.deleteMany({})
  await prisma.asignacion.deleteMany({})
  await prisma.climaIndustrial.deleteMany({})
  await prisma.cliente.deleteMany({})
  await prisma.usuario.deleteMany({})

  // Create Admin
  const admin = await prisma.usuario.create({
    data: {
      nombres: 'Administrador',
      apellidoPaterno: 'Cooltrack',
      apellidoMaterno: 'Sistema',
      email: 'admin@cooltrack.com',
      username: 'admin',
      passwordHash: passwordHash,
      rol: 'ADMIN'
    }
  })
  console.log('✅ Admin created:', admin.username)

  // Create Técnico
  const tecnico = await prisma.usuario.create({
    data: {
      nombres: 'Técnico',
      apellidoPaterno: 'Demo',
      apellidoMaterno: 'Cooltrack',
      email: 'tecnico@cooltrack.com',
      username: 'tecnico',
      passwordHash: passwordHash,
      rol: 'TECNICO_CONTRATISTA'
    }
  })
  console.log('✅ Técnico created:', tecnico.username)

  console.log('✨ Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
