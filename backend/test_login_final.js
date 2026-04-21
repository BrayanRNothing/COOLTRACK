const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.usuario.findUnique({ where: { email: 'admin@cooltrack.com' } });
  if (user) {
    const valid = await bcrypt.compare('admin123', user.passwordHash);
    console.log('IsValid:', valid);
  } else {
    console.log('User not found.');
  }
}
run().finally(() => prisma.$disconnect());
