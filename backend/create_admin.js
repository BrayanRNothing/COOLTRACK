const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.usuario.count({ where: { rol: 'ADMIN' } });
  if (count > 0) {
    const adminUser = await prisma.usuario.findFirst({ where: { rol: 'ADMIN'} });
    console.log(`Un administrador ya existe en tu BD: ${adminUser.email}`);
    // If we want to reset password just in case:
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.usuario.update({
      where: { id: adminUser.id },
      data: { passwordHash }
    });
    console.log(`¡Tu cuenta existente ha sido restablecida! Usuario de prueba: ${adminUser.email} / Contraseña: admin123`);
    return;
  }
  
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.create({
    data: {
      nombres: 'Admin',
      apellidoPaterno: 'Cool',
      apellidoMaterno: 'Track',
      email: 'admin@cooltrack.com',
      passwordHash: passwordHash,
      rol: 'ADMIN',
    }
  });
  console.log(`¡Admin creado exitosamente! Usuario: ${admin.email} / Contraseña: admin123`);
}

main()
  .catch((e) => {
    console.error('Error al crear/restablecer admin:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
