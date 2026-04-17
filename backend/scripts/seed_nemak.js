const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cliente = await prisma.cliente.findFirst({
    where: { nombreOEmpresa: { contains: 'Nenak', mode: 'insensitive' } }
  });

  if (!cliente) {
    console.error('No se encontró al cliente Nemak.');
    return;
  }

  console.log(`Cliente encontrado: ${cliente.nombreOEmpresa} (ID: ${cliente.id})`);

  const marcas = ['Carrier', 'York', 'Trane', 'Daikin', 'McQuay'];
  const modelos = ['X-100', 'GTX-500', 'Vortex-9', 'Turbo-X', 'Prime-A'];

  for (let i = 1; i <= 9; i++) {
    const numSerie = `NMK-${Math.floor(Math.random() * 9000) + 1000}-${i}`;
    const marca = marcas[Math.floor(Math.random() * marcas.length)];
    const modelo = modelos[Math.floor(Math.random() * modelos.length)];
    
    await prisma.climaIndustrial.create({
      data: {
        numeroSerie: numSerie,
        marca: marca,
        modelo: modelo,
        fechaAplicacion: new Date(),
        geolocalizacion: `${(Math.random() * 2 + 19).toFixed(5)}, -${(Math.random() * 2 + 99).toFixed(5)}`,
        idCliente: cliente.id
      }
    });
    console.log(`Equipo registrado: ${numSerie}`);
  }

  console.log('¡Se han registrado los 9 equipos con éxito!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
