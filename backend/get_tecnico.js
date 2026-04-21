const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  let tecnico = await prisma.usuario.findFirst({ where: { rol: 'TECNICO_CONTRATISTA' } });
  
  if (tecnico) {
    const passwordHash = await bcrypt.hash('tecnico123', 10);
    await prisma.usuario.update({
      where: { id: tecnico.id },
      data: { passwordHash }
    });
    console.log(`TECNICO_EXISTING: ${tecnico.email}`);
  } else {
    const passwordHash = await bcrypt.hash('tecnico123', 10);
    tecnico = await prisma.usuario.create({
      data: {
        nombres: 'Técnico',
        apellidoPaterno: 'Cool',
        apellidoMaterno: 'Track',
        email: 'tecnico@cooltrack.com',
        passwordHash,
        rol: 'TECNICO_CONTRATISTA'
      }
    });
    console.log(`TECNICO_CREATED: ${tecnico.email}`);
  }
}
run().catch(console.error).finally(() => void prisma.$disconnect());
