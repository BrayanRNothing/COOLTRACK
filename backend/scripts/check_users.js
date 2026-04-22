const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.usuario.findMany()
  console.log('Users in DB:', users.map(u => ({ username: u.username, email: u.email, id: u.id })))
}
main().finally(() => prisma.$disconnect())
