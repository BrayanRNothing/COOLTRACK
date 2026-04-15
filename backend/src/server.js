const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const { PrismaClient, RolUsuario } = require('@prisma/client')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

const usuarioSafeSelect = {
  id: true,
  nombres: true,
  apellidoPaterno: true,
  apellidoMaterno: true,
  email: true,
  telefono: true,
  rol: true,
  createdAt: true,
  updatedAt: true,
}

const isValidRole = (rol) => Object.values(RolUsuario).includes(rol)

const handlePrismaError = (error, res, fallbackMessage) => {
  if (error?.code === 'P2002') {
    return res.status(409).json({ message: 'Conflicto: valor unico duplicado.' })
  }

  if (error?.code === 'P2003') {
    return res.status(400).json({ message: 'Relacion invalida: revisa los IDs relacionados.' })
  }

  if (error?.code === 'P2025') {
    return res.status(404).json({ message: 'Registro no encontrado.' })
  }

  console.error(error)
  return res.status(500).json({ message: fallbackMessage })
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'API operativa',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api', (_req, res) => {
  res.json({
    service: 'COOLTRACK API',
    version: '1.0.0',
  })
})

app.get('/api/usuarios', async (_req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: usuarioSafeSelect,
      orderBy: { createdAt: 'desc' },
    })
    return res.json(usuarios)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al listar usuarios.')
  }
})

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.id },
      select: usuarioSafeSelect,
    })

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    return res.json(usuario)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al consultar usuario.')
  }
})

app.post('/api/usuarios', async (req, res) => {
  const {
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    email,
    telefono,
    password,
    rol,
  } = req.body

  if (!nombres || !apellidoPaterno || !apellidoMaterno || !email || !password || !rol) {
    return res.status(400).json({ message: 'Faltan campos obligatorios de usuario.' })
  }

  if (!isValidRole(rol)) {
    return res.status(400).json({ message: 'Rol invalido.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: {
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        email,
        telefono,
        passwordHash,
        rol,
      },
      select: usuarioSafeSelect,
    })

    return res.status(201).json(usuario)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al crear usuario.')
  }
})

app.put('/api/usuarios/:id', async (req, res) => {
  const { nombres, apellidoPaterno, apellidoMaterno, email, telefono, password, rol } = req.body

  if (rol && !isValidRole(rol)) {
    return res.status(400).json({ message: 'Rol invalido.' })
  }

  try {
    const data = {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      email,
      telefono,
      rol,
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data,
      select: usuarioSafeSelect,
    })

    return res.json(usuario)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al actualizar usuario.')
  }
})

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al eliminar usuario.')
  }
})

app.get('/api/clientes', async (_req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return res.json(clientes)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al listar clientes.')
  }
})

app.get('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        climas: {
          select: {
            id: true,
            numeroSerie: true,
            marca: true,
            modelo: true,
          },
        },
      },
    })

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado.' })
    }

    return res.json(cliente)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al consultar cliente.')
  }
})

app.post('/api/clientes', async (req, res) => {
  const { numeroCliente, nombreOEmpresa, telefono, email } = req.body

  if (!numeroCliente || !nombreOEmpresa) {
    return res.status(400).json({ message: 'numeroCliente y nombreOEmpresa son obligatorios.' })
  }

  try {
    const cliente = await prisma.cliente.create({
      data: { numeroCliente, nombreOEmpresa, telefono, email },
    })

    return res.status(201).json(cliente)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al crear cliente.')
  }
})

app.put('/api/clientes/:id', async (req, res) => {
  const { numeroCliente, nombreOEmpresa, telefono, email } = req.body

  try {
    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: { numeroCliente, nombreOEmpresa, telefono, email },
    })

    return res.json(cliente)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al actualizar cliente.')
  }
})

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al eliminar cliente.')
  }
})

app.get('/api/climas', async (_req, res) => {
  try {
    const climas = await prisma.climaIndustrial.findMany({
      include: {
        cliente: {
          select: { id: true, numeroCliente: true, nombreOEmpresa: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(climas)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al listar climas.')
  }
})

app.get('/api/climas/:id', async (req, res) => {
  try {
    const clima = await prisma.climaIndustrial.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: {
          select: { id: true, numeroCliente: true, nombreOEmpresa: true },
        },
      },
    })

    if (!clima) {
      return res.status(404).json({ message: 'Clima no encontrado.' })
    }

    return res.json(clima)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al consultar clima.')
  }
})

app.post('/api/climas', async (req, res) => {
  const { numeroSerie, marca, modelo, fechaAplicacion, geolocalizacion, idCliente } = req.body

  if (!numeroSerie || !marca || !modelo || !fechaAplicacion || !geolocalizacion || !idCliente) {
    return res.status(400).json({ message: 'Faltan campos obligatorios del clima.' })
  }

  try {
    const clima = await prisma.climaIndustrial.create({
      data: {
        numeroSerie,
        marca,
        modelo,
        fechaAplicacion: new Date(fechaAplicacion),
        geolocalizacion,
        idCliente,
      },
      include: {
        cliente: {
          select: { id: true, numeroCliente: true, nombreOEmpresa: true },
        },
      },
    })

    return res.status(201).json(clima)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al crear clima.')
  }
})

app.put('/api/climas/:id', async (req, res) => {
  const { numeroSerie, marca, modelo, fechaAplicacion, geolocalizacion, idCliente } = req.body

  try {
    const data = {
      numeroSerie,
      marca,
      modelo,
      geolocalizacion,
      idCliente,
    }

    if (fechaAplicacion) {
      data.fechaAplicacion = new Date(fechaAplicacion)
    }

    const clima = await prisma.climaIndustrial.update({
      where: { id: req.params.id },
      data,
      include: {
        cliente: {
          select: { id: true, numeroCliente: true, nombreOEmpresa: true },
        },
      },
    })

    return res.json(clima)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al actualizar clima.')
  }
})

app.delete('/api/climas/:id', async (req, res) => {
  try {
    await prisma.climaIndustrial.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al eliminar clima.')
  }
})

app.get('/api/mantenimientos', async (req, res) => {
  const parsedYear = req.query.year ? Number(req.query.year) : null

  if (req.query.year && (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000)) {
    return res.status(400).json({ message: 'El anio del filtro es invalido.' })
  }

  try {
    const where = {}

    if (parsedYear) {
      where.fechaMantenimiento = {
        gte: new Date(Date.UTC(parsedYear, 0, 1, 0, 0, 0, 0)),
        lt: new Date(Date.UTC(parsedYear + 1, 0, 1, 0, 0, 0, 0)),
      }
    }

    const mantenimientos = await prisma.mantenimiento.findMany({
      where,
      include: {
        clima: {
          select: { id: true, numeroSerie: true, marca: true, modelo: true },
        },
        tecnico: {
          select: { id: true, nombres: true, apellidoPaterno: true, rol: true },
        },
      },
      orderBy: { fechaMantenimiento: 'desc' },
    })

    return res.json(mantenimientos)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al listar mantenimientos.')
  }
})

app.get('/api/mantenimientos/:id', async (req, res) => {
  try {
    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id: req.params.id },
      include: {
        clima: {
          select: { id: true, numeroSerie: true, marca: true, modelo: true },
        },
        tecnico: {
          select: { id: true, nombres: true, apellidoPaterno: true, rol: true },
        },
      },
    })

    if (!mantenimiento) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado.' })
    }

    return res.json(mantenimiento)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al consultar mantenimiento.')
  }
})

app.get('/api/climas/:id/mantenimientos/anual/:year', async (req, res) => {
  const { id, year } = req.params
  const parsedYear = Number(year)

  if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000) {
    return res.status(400).json({ message: 'El anio debe ser valido.' })
  }

  const start = new Date(Date.UTC(parsedYear, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(parsedYear + 1, 0, 1, 0, 0, 0, 0))

  try {
    const clima = await prisma.climaIndustrial.findUnique({
      where: { id },
      select: { id: true, numeroSerie: true, modelo: true, marca: true },
    })

    if (!clima) {
      return res.status(404).json({ message: 'Clima no encontrado.' })
    }

    const totalMantenimientos = await prisma.mantenimiento.count({
      where: {
        idClima: id,
        fechaMantenimiento: {
          gte: start,
          lt: end,
        },
      },
    })

    return res.json({
      clima,
      year: parsedYear,
      totalMantenimientos,
      cumpleReglaTresAnuales: totalMantenimientos >= 3,
      faltantesParaCumplir: Math.max(3 - totalMantenimientos, 0),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno al validar mantenimientos.' })
  }
})

app.get('/api/mantenimientos/cumplimiento/anual/:year', async (req, res) => {
  const parsedYear = Number(req.params.year)

  if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000) {
    return res.status(400).json({ message: 'El anio debe ser valido.' })
  }

  const start = new Date(Date.UTC(parsedYear, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(parsedYear + 1, 0, 1, 0, 0, 0, 0))

  try {
    const climas = await prisma.climaIndustrial.findMany({
      select: {
        id: true,
        numeroSerie: true,
        marca: true,
        modelo: true,
      },
      orderBy: { numeroSerie: 'asc' },
    })

    const cumplimiento = await Promise.all(
      climas.map(async (clima) => {
        const totalMantenimientos = await prisma.mantenimiento.count({
          where: {
            idClima: clima.id,
            fechaMantenimiento: {
              gte: start,
              lt: end,
            },
          },
        })

        return {
          ...clima,
          year: parsedYear,
          totalMantenimientos,
          cumpleReglaTresAnuales: totalMantenimientos >= 3,
          faltantesParaCumplir: Math.max(3 - totalMantenimientos, 0),
        }
      }),
    )

    return res.json(cumplimiento)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno al consultar cumplimiento anual.' })
  }
})

app.post('/api/mantenimientos', async (req, res) => {
  const {
    idClima,
    idTecnico,
    fechaMantenimiento,
    foto1Url,
    foto2Url,
    foto3Url,
    observaciones,
  } = req.body

  if (!idClima || !idTecnico || !fechaMantenimiento) {
    return res.status(400).json({
      message: 'idClima, idTecnico y fechaMantenimiento son obligatorios.',
    })
  }

  try {
    const tecnico = await prisma.usuario.findUnique({
      where: { id: idTecnico },
      select: { id: true, rol: true },
    })

    if (!tecnico) {
      return res.status(404).json({ message: 'Tecnico no encontrado.' })
    }

    if (tecnico.rol !== RolUsuario.TECNICO_CONTRATISTA) {
      return res.status(400).json({
        message: 'Solo un usuario con rol TECNICO_CONTRATISTA puede registrar mantenimientos.',
      })
    }

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        idClima,
        idTecnico,
        fechaMantenimiento: new Date(fechaMantenimiento),
        foto1Url,
        foto2Url,
        foto3Url,
        observaciones,
      },
    })

    return res.status(201).json(mantenimiento)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al crear mantenimiento.')
  }
})

app.put('/api/mantenimientos/:id', async (req, res) => {
  const {
    idClima,
    idTecnico,
    fechaMantenimiento,
    foto1Url,
    foto2Url,
    foto3Url,
    observaciones,
  } = req.body

  try {
    if (idTecnico) {
      const tecnico = await prisma.usuario.findUnique({
        where: { id: idTecnico },
        select: { id: true, rol: true },
      })

      if (!tecnico) {
        return res.status(404).json({ message: 'Tecnico no encontrado.' })
      }

      if (tecnico.rol !== RolUsuario.TECNICO_CONTRATISTA) {
        return res.status(400).json({
          message: 'Solo un usuario con rol TECNICO_CONTRATISTA puede registrar mantenimientos.',
        })
      }
    }

    const data = {
      idClima,
      idTecnico,
      foto1Url,
      foto2Url,
      foto3Url,
      observaciones,
    }

    if (fechaMantenimiento) {
      data.fechaMantenimiento = new Date(fechaMantenimiento)
    }

    const mantenimiento = await prisma.mantenimiento.update({
      where: { id: req.params.id },
      data,
    })

    return res.json(mantenimiento)
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al actualizar mantenimiento.')
  }
})

app.delete('/api/mantenimientos/:id', async (req, res) => {
  try {
    await prisma.mantenimiento.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) {
    return handlePrismaError(error, res, 'Error interno al eliminar mantenimiento.')
  }
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`)
})
