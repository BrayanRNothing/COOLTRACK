const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { PrismaClient, RolUsuario, EstadoAsignacion } = require('@prisma/client')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'cooltrack_dev_secret'
const prisma = new PrismaClient()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

app.use(cors())
app.use(express.json())

// ─── Helpers ─────────────────────────────────────────────────────────────────

const usuarioSafeSelect = {
  id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true,
  email: true, username: true, telefono: true, rol: true, createdAt: true, updatedAt: true,
}

const isValidRole = (rol) => Object.values(RolUsuario).includes(rol)
const isValidEstado = (e) => Object.values(EstadoAsignacion).includes(e)

const handlePrismaError = (error, res, fallbackMessage) => {
  if (error?.code === 'P2002') return res.status(409).json({ message: 'Conflicto: valor único duplicado.' })
  if (error?.code === 'P2003') return res.status(400).json({ message: 'Relación inválida: revisa los IDs.' })
  if (error?.code === 'P2025') return res.status(404).json({ message: 'Registro no encontrado.' })
  console.error(error)
  return res.status(500).json({ message: fallbackMessage })
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado.' })
  }
  try {
    const token = auth.split(' ')[1]
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado.' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: 'Solo administradores.' })
  next()
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  return res.json({
    service: 'COOLTRACK API',
    ok: true,
    health: '/api/health',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))

// Bootstrap: create first admin if none exists (public, one-time use)
app.post('/api/auth/bootstrap', async (req, res) => {
  try {
    const count = await prisma.usuario.count({ where: { rol: 'ADMIN' } })
    if (count > 0) return res.status(409).json({ message: 'Ya existe un administrador. Usa el login normal.' })
    const { nombres, apellidoPaterno, apellidoMaterno, email, username, password } = req.body
    if (!nombres || !apellidoPaterno || !apellidoMaterno || !email || !username || !password)
      return res.status(400).json({ message: 'Faltan campos.' })
    const passwordHash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: { nombres, apellidoPaterno, apellidoMaterno, email, username, passwordHash, rol: 'ADMIN' },
      select: usuarioSafeSelect,
    })
    return res.status(201).json(usuario)
  } catch (error) { return handlePrismaError(error, res, 'Error al crear primer admin.') }
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' })

  try {
    const usuario = await prisma.usuario.findUnique({ where: { username } })
    if (!usuario) return res.status(401).json({ message: 'Credenciales incorrectas.' })

    const valid = await bcrypt.compare(password, usuario.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas.' })

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, email: usuario.email, rol: usuario.rol, nombres: usuario.nombres, apellidoPaterno: usuario.apellidoPaterno },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    const { passwordHash, ...safeUser } = usuario
    return res.json({ token, user: safeUser })
  } catch (error) {
    return handlePrismaError(error, res, 'Error al iniciar sesión.')
  }
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: usuarioSafeSelect,
    })
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' })
    return res.json(usuario)
  } catch (error) {
    return handlePrismaError(error, res, 'Error al obtener usuario.')
  }
})

// ─── Upload Cloudinary ────────────────────────────────────────────────────────

app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo.' })
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ message: 'Solo se permiten imágenes.' })
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      message: 'Faltan variables de entorno de Cloudinary. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.',
    })
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cooltrack/mantenimientos', resource_type: 'image' },
        (error, uploaded) => { if (error) reject(error); else resolve(uploaded) }
      )
      stream.end(req.file.buffer)
    })
    return res.json({ url: result.secure_url, publicId: result.public_id })
  } catch (error) {
    console.error('Cloudinary error:', error)
    return res.status(500).json({ message: 'Error al subir imagen.' })
  }
})

// ─── Usuarios ─────────────────────────────────────────────────────────────────

app.get('/api/usuarios', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({ select: usuarioSafeSelect, orderBy: { createdAt: 'desc' } })
    return res.json(usuarios)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar usuarios.') }
})

app.get('/api/usuarios/tecnicos', requireAuth, async (_req, res) => {
  try {
    const tecnicos = await prisma.usuario.findMany({
      where: { rol: 'TECNICO_CONTRATISTA' },
      select: usuarioSafeSelect,
      orderBy: { nombres: 'asc' },
    })
    return res.json(tecnicos)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar técnicos.') }
})

app.get('/api/usuarios/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id }, select: usuarioSafeSelect })
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' })
    return res.json(usuario)
  } catch (error) { return handlePrismaError(error, res, 'Error al consultar usuario.') }
})

app.post('/api/usuarios', requireAuth, requireAdmin, async (req, res) => {
  const { nombres, apellidoPaterno, apellidoMaterno, email, username, telefono, password, rol } = req.body
  if (!nombres || !apellidoPaterno || !apellidoMaterno || !email || !username || !password || !rol)
    return res.status(400).json({ message: 'Faltan campos obligatorios.' })
  if (!isValidRole(rol)) return res.status(400).json({ message: 'Rol inválido.' })
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: { nombres, apellidoPaterno, apellidoMaterno, email, username, telefono, passwordHash, rol },
      select: usuarioSafeSelect,
    })
    return res.status(201).json(usuario)
  } catch (error) { return handlePrismaError(error, res, 'Error al crear usuario.') }
})

app.put('/api/usuarios/:id', requireAuth, requireAdmin, async (req, res) => {
  const { nombres, apellidoPaterno, apellidoMaterno, email, username, telefono, password, rol } = req.body
  if (rol && !isValidRole(rol)) return res.status(400).json({ message: 'Rol inválido.' })
  try {
    const data = { nombres, apellidoPaterno, apellidoMaterno, email, username, telefono, rol }
    if (password) data.passwordHash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.update({ where: { id: req.params.id }, data, select: usuarioSafeSelect })
    return res.json(usuario)
  } catch (error) { return handlePrismaError(error, res, 'Error al actualizar usuario.') }
})

app.delete('/api/usuarios/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) { return handlePrismaError(error, res, 'Error al eliminar usuario.') }
})

// ─── Clientes ─────────────────────────────────────────────────────────────────

app.get('/api/clientes', requireAuth, async (_req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { climas: true } } },
    })
    return res.json(clientes)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar clientes.') }
})

app.get('/api/clientes/:id', requireAuth, async (req, res) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: { climas: true, _count: { select: { climas: true } } },
    })
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado.' })
    return res.json(cliente)
  } catch (error) { return handlePrismaError(error, res, 'Error al consultar cliente.') }
})

app.post('/api/clientes', requireAuth, requireAdmin, async (req, res) => {
  const { numeroCliente, nombreOEmpresa, ciudad, telefono, email } = req.body
  if (!numeroCliente || !nombreOEmpresa) return res.status(400).json({ message: 'numeroCliente y nombreOEmpresa son obligatorios.' })
  try {
    const cliente = await prisma.cliente.create({
      data: { numeroCliente, nombreOEmpresa, ciudad, telefono, email },
      include: { _count: { select: { climas: true } } },
    })
    return res.status(201).json(cliente)
  } catch (error) { return handlePrismaError(error, res, 'Error al crear cliente.') }
})

app.put('/api/clientes/:id', requireAuth, requireAdmin, async (req, res) => {
  const { numeroCliente, nombreOEmpresa, ciudad, telefono, email } = req.body
  try {
    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: { numeroCliente, nombreOEmpresa, ciudad, telefono, email },
      include: { _count: { select: { climas: true } } },
    })
    return res.json(cliente)
  } catch (error) { return handlePrismaError(error, res, 'Error al actualizar cliente.') }
})

app.delete('/api/clientes/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) { return handlePrismaError(error, res, 'Error al eliminar cliente.') }
})

// ─── Climas (Condensadores) ───────────────────────────────────────────────────

app.get('/api/clientes/:clienteId/climas', requireAuth, async (req, res) => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  try {
    const climas = await prisma.climaIndustrial.findMany({
      where: { idCliente: req.params.clienteId },
      include: {
        _count: {
          select: {
            mantenimientos: {
              where: {
                fechaMantenimiento: {
                  gte: startOfYear,
                  lte: endOfYear
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(climas)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar climas.') }
})

app.get('/api/climas', requireAuth, async (_req, res) => {
  try {
    const climas = await prisma.climaIndustrial.findMany({
      include: { cliente: { select: { id: true, numeroCliente: true, nombreOEmpresa: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(climas)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar climas.') }
})

app.get('/api/climas/:id', requireAuth, async (req, res) => {
  try {
    const clima = await prisma.climaIndustrial.findUnique({
      where: { id: req.params.id },
      include: { cliente: { select: { id: true, numeroCliente: true, nombreOEmpresa: true } } },
    })
    if (!clima) return res.status(404).json({ message: 'Clima no encontrado.' })
    return res.json(clima)
  } catch (error) { return handlePrismaError(error, res, 'Error al consultar clima.') }
})

app.get('/api/climas/:id/mantenimientos', requireAuth, async (req, res) => {
  try {
    const mantenimientos = await prisma.mantenimiento.findMany({
      where: { idClima: req.params.id },
      include: {
        tecnico: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        }
      },
      orderBy: { fechaMantenimiento: 'desc' }
    })
    return res.json(mantenimientos)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar mantenimientos del clima.') }
})

app.post('/api/climas', requireAuth, requireAdmin, async (req, res) => {
  const { numeroSerie, marca, modelo, fechaAplicacion, geolocalizacion, idCliente } = req.body
  if (!numeroSerie || !marca || !modelo || !fechaAplicacion || !idCliente)
    return res.status(400).json({ message: 'Faltan campos obligatorios del clima.' })
  try {
    const clima = await prisma.climaIndustrial.create({
      data: { numeroSerie, marca, modelo, fechaAplicacion: new Date(fechaAplicacion), geolocalizacion, idCliente },
      include: { cliente: { select: { id: true, numeroCliente: true, nombreOEmpresa: true } } },
    })
    return res.status(201).json(clima)
  } catch (error) { return handlePrismaError(error, res, 'Error al crear clima.') }
})

app.put('/api/climas/:id', requireAuth, requireAdmin, async (req, res) => {
  const { numeroSerie, marca, modelo, fechaAplicacion, geolocalizacion, idCliente } = req.body
  try {
    const data = { numeroSerie, marca, modelo, geolocalizacion, idCliente }
    if (fechaAplicacion) data.fechaAplicacion = new Date(fechaAplicacion)
    const clima = await prisma.climaIndustrial.update({
      where: { id: req.params.id }, data,
      include: { cliente: { select: { id: true, numeroCliente: true, nombreOEmpresa: true } } },
    })
    return res.json(clima)
  } catch (error) { return handlePrismaError(error, res, 'Error al actualizar clima.') }
})

app.delete('/api/climas/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.climaIndustrial.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) { return handlePrismaError(error, res, 'Error al eliminar clima.') }
})

// ─── Asignaciones ─────────────────────────────────────────────────────────────

app.get('/api/asignaciones', requireAuth, async (req, res) => {
  try {
    const where = req.user.rol === 'TECNICO_CONTRATISTA' ? { idTecnico: req.user.id } : {}
    const asignaciones = await prisma.asignacion.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombreOEmpresa: true, ciudad: true, numeroCliente: true } },
        tecnico: { select: { id: true, nombres: true, apellidoPaterno: true, email: true } },
        _count: { select: { mantenimientos: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(asignaciones)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar asignaciones.') }
})

app.get('/api/asignaciones/:id', requireAuth, async (req, res) => {
  try {
    const asignacion = await prisma.asignacion.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: { include: { climas: true } },
        tecnico: { select: usuarioSafeSelect },
        mantenimientos: {
          include: { clima: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada.' })
    // Check access: technician can only see their own
    if (req.user.rol === 'TECNICO_CONTRATISTA' && asignacion.idTecnico !== req.user.id)
      return res.status(403).json({ message: 'Sin acceso.' })
    return res.json(asignacion)
  } catch (error) { return handlePrismaError(error, res, 'Error al consultar asignación.') }
})

app.post('/api/asignaciones', requireAuth, requireAdmin, async (req, res) => {
  const { idCliente, idTecnico, notas, fechaProgramada } = req.body
  if (!idCliente || !idTecnico || !fechaProgramada)
    return res.status(400).json({ message: 'idCliente, idTecnico y fechaProgramada son requeridos.' })
  try {
    const asignacion = await prisma.asignacion.create({
      data: { idCliente, idTecnico, notas, fechaProgramada: new Date(fechaProgramada), estado: 'PENDIENTE' },
      include: {
        cliente: { select: { id: true, nombreOEmpresa: true, ciudad: true } },
        tecnico: { select: { id: true, nombres: true, apellidoPaterno: true } },
      },
    })
    return res.status(201).json(asignacion)
  } catch (error) { return handlePrismaError(error, res, 'Error al crear asignación.') }
})

app.put('/api/asignaciones/:id', requireAuth, async (req, res) => {
  const { estado, notas, fechaProgramada } = req.body
  if (estado && !isValidEstado(estado)) return res.status(400).json({ message: 'Estado inválido.' })
  try {
    // Technician can only update estado; admin can update all
    const data = req.user.rol === 'TECNICO_CONTRATISTA'
      ? { estado }
      : { estado, notas, ...(fechaProgramada ? { fechaProgramada: new Date(fechaProgramada) } : {}) }

    const asignacion = await prisma.asignacion.update({
      where: { id: req.params.id }, data,
      include: {
        cliente: { select: { id: true, nombreOEmpresa: true, ciudad: true } },
        tecnico: { select: { id: true, nombres: true, apellidoPaterno: true } },
      },
    })
    return res.json(asignacion)
  } catch (error) { return handlePrismaError(error, res, 'Error al actualizar asignación.') }
})

app.delete('/api/asignaciones/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.asignacion.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) { return handlePrismaError(error, res, 'Error al eliminar asignación.') }
})

// ─── Mantenimientos ───────────────────────────────────────────────────────────

app.get('/api/mantenimientos', requireAuth, async (req, res) => {
  try {
    const where = req.user.rol === 'TECNICO_CONTRATISTA' ? { idTecnico: req.user.id } : {}
    const mantenimientos = await prisma.mantenimiento.findMany({
      where,
      include: {
        clima: { include: { cliente: { select: { id: true, nombreOEmpresa: true } } } },
        tecnico: { select: { id: true, nombres: true, apellidoPaterno: true } },
        asignacion: { select: { id: true, estado: true } },
      },
      orderBy: { fechaMantenimiento: 'desc' },
    })
    return res.json(mantenimientos)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar mantenimientos.') }
})

app.get('/api/asignaciones/:id/mantenimientos', requireAuth, async (req, res) => {
  try {
    const mantenimientos = await prisma.mantenimiento.findMany({
      where: { idAsignacion: req.params.id },
      include: { clima: true, tecnico: { select: usuarioSafeSelect } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(mantenimientos)
  } catch (error) { return handlePrismaError(error, res, 'Error al listar mantenimientos de asignación.') }
})

app.get('/api/mantenimientos/:id', requireAuth, async (req, res) => {
  try {
    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id: req.params.id },
      include: {
        clima: { include: { cliente: true } },
        tecnico: { select: usuarioSafeSelect },
        asignacion: true,
      },
    })
    if (!mantenimiento) return res.status(404).json({ message: 'Mantenimiento no encontrado.' })
    return res.json(mantenimiento)
  } catch (error) { return handlePrismaError(error, res, 'Error al consultar mantenimiento.') }
})

app.post('/api/mantenimientos', requireAuth, async (req, res) => {
  const { idClima, idTecnico, idAsignacion, fechaMantenimiento, foto1Url, foto2Url, foto3Url, foto1Geo, foto2Geo, foto3Geo, geolocalizacion, observaciones } = req.body
  if (!idClima || !fechaMantenimiento)
    return res.status(400).json({ message: 'idClima y fechaMantenimiento son obligatorios.' })
  if (!foto1Url || !foto2Url || !foto3Url)
    return res.status(400).json({ message: 'Las 3 fotos de mantenimiento son obligatorias.' })

  const tecnicoId = req.user.rol === 'TECNICO_CONTRATISTA' ? req.user.id : idTecnico
  if (!tecnicoId) return res.status(400).json({ message: 'idTecnico es requerido.' })

  try {
    const geoCapturada = geolocalizacion || foto1Geo || foto2Geo || foto3Geo || null

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        idClima, idTecnico: tecnicoId, idAsignacion: idAsignacion || null,
        fechaMantenimiento: new Date(fechaMantenimiento),
        foto1Url, foto2Url, foto3Url,
        foto1Geo: foto1Geo || null, foto2Geo: foto2Geo || null, foto3Geo: foto3Geo || null,
        observaciones,
      },
      include: {
        clima: { include: { cliente: { select: { id: true, nombreOEmpresa: true } } } },
        tecnico: { select: usuarioSafeSelect },
      },
    })

    if (geoCapturada) {
      await prisma.climaIndustrial.update({
        where: { id: idClima },
        data: { geolocalizacion: geoCapturada },
      })
    }

    // Auto-update asignacion to EN_PROGRESO if it was PENDIENTE
    if (idAsignacion) {
      await prisma.asignacion.updateMany({
        where: { id: idAsignacion, estado: 'PENDIENTE' },
        data: { estado: 'EN_PROGRESO' },
      })
    }

    return res.status(201).json(mantenimiento)
  } catch (error) { return handlePrismaError(error, res, 'Error al crear mantenimiento.') }
})

app.delete('/api/mantenimientos/:id', requireAuth, async (req, res) => {
  try {
    await prisma.mantenimiento.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (error) { return handlePrismaError(error, res, 'Error al eliminar mantenimiento.') }
})

// ─── Process Handlers ─────────────────────────────────────────────────────────

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0) })
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0) })

app.listen(PORT, () => console.log(`🚀 COOLTRACK API running on port ${PORT}`))
