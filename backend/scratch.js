const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  console.log("Usuarios:", await prisma.usuario.count());
  console.log("Clientes:", await prisma.cliente.count());
  console.log("Climas:", await prisma.climaIndustrial.count());
  console.log("Asignaciones:", await prisma.asignacion.count());
}
run().finally(() => window? prisma.$disconnect() : prisma.$disconnect());
