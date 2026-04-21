const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPass() {
  const email = 'admin@cooltrack.com';
  const password = 'admin123';
  
  const userExists = await prisma.usuario.findUnique({ where: { email } });
  
  if (!userExists) {
    console.log("No existe admin@cooltrack.com, creandolo...");
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.usuario.create({
      data: {
        nombres: 'Julio',
        apellidoPaterno: 'Admin',
        apellidoMaterno: 'Track',
        email,
        passwordHash,
        rol: 'ADMIN'
      }
    });
    console.log("Usuario creado.");
  } else {
    console.log("Existe admin@cooltrack.com, restableciendo pass...");
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { email },
      data: { passwordHash }
    });
    console.log("Contraseña actualizada.");
  }
}

resetPass().finally(() => void prisma.$disconnect());
