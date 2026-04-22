const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.usuario.findUnique({ where: { username: 'admin' } })
  if (!user) {
    console.log('User not found')
    return
  }
  console.log('User found:', user.username)
  const valid = await bcrypt.compare('123456', user.passwordHash)
  console.log('Password valid (123456):', valid)
}

main().catch(console.error).finally(() => prisma.$disconnect())
