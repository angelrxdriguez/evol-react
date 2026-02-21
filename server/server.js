import dotenv from 'dotenv'
import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://angelrp:abc123.@cluster0.76po7.mongodb.net/?appName=Cluster0'

const mongoClient = new MongoClient(MONGO_URI)
let usuariosCollection
let clasesCollection

const { PORT } = process.env
const SERVER_PORT = Number(PORT) || 3003

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json({ limit: '15mb' }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'src', 'uploads')))

function limpiarNombreArchivo(nombreArchivo) {
  const base = path.basename(String(nombreArchivo || '').trim())
  return base.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
}

function idAString(valor) {
  if (valor == null) return ''
  if (typeof valor === 'string') return valor.trim()
  if (typeof valor.toHexString === 'function') return valor.toHexString()
  return String(valor).trim()
}

async function guardarImagenEnUploads(nombreArchivo, imagenContenidoBase64) {
  const nombreLimpio = limpiarNombreArchivo(nombreArchivo)
  if (!nombreLimpio) {
    throw new Error('Nombre de imagen invalido')
  }

  const contenido = String(imagenContenidoBase64 || '').trim()
  const buffer = Buffer.from(contenido, 'base64')
  if (!buffer.length) {
    throw new Error('Contenido de imagen invalido')
  }

  const uploadsDir = path.join(__dirname, '..', 'src', 'uploads')
  await fs.mkdir(uploadsDir, { recursive: true })

  const partes = path.parse(nombreLimpio)
  let nombreFinal = nombreLimpio
  let intento = 1

  while (true) {
    try {
      await fs.access(path.join(uploadsDir, nombreFinal))
      nombreFinal = `${partes.name}-${intento}${partes.ext}`
      intento += 1
    } catch {
      break
    }
  }

  await fs.writeFile(path.join(uploadsDir, nombreFinal), buffer)
  return nombreFinal
}

async function connectMongo() {
  await mongoClient.connect()
  await mongoClient.db('evol').command({ ping: 1 })
  usuariosCollection = mongoClient.db('evol').collection('usuarios')
  clasesCollection = mongoClient.db('evol').collection('clases')
  await usuariosCollection.createIndex({ nombreUsuario: 1 }, { unique: true })
}

app.post('/registro', async (req, res) => {
  try {
    const { nombreUsuario, nombre, apellidos, contrasena } = req.body || {}
    const nombreUsuarioLimpio = String(nombreUsuario || '').trim()
    const nombreLimpio = String(nombre || '').trim()
    const apellidosLimpio = String(apellidos || '').trim()

    if (!nombreUsuarioLimpio) {
      return res.status(400).json({ ok: false, error: 'El nombreUsuario es obligatorio' })
    }

    if (!contrasena) {
      return res.status(400).json({ ok: false, error: 'La contrasena es obligatoria' })
    }

    if (!usuariosCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const existente = await usuariosCollection.findOne(
      { nombreUsuario: nombreUsuarioLimpio },
      { projection: { _id: 1 } }
    )

    if (existente) {
      return res.status(409).json({ ok: false, error: 'El nombre de usuario ya existe' })
    }

    const result = await usuariosCollection.insertOne({
      nombreUsuario: nombreUsuarioLimpio,
      nombre: nombreLimpio,
      apellidos: apellidosLimpio,
      contrasena,
      es_admin: 0,
      rol: 'user',
      createdAt: new Date(),
    })

    return res.status(201).json({ ok: true, id: String(result.insertedId) })
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ ok: false, error: 'El nombre de usuario ya existe' })
    }

    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.post('/login', async (req, res) => {
  try {
    const { nombreUsuario, contrasena } = req.body || {}

    if (!nombreUsuario || !contrasena) {
      return res.status(400).json({ ok: false, error: 'Faltan credenciales' })
    }

    if (!usuariosCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const user = await usuariosCollection.findOne({ nombreUsuario })

    if (!user || user.contrasena !== contrasena) {
      return res.status(401).json({ ok: false, error: 'Usuario o contrasena incorrectos' })
    }

    const esAdmin = Number(user.es_admin) === 1 ? 1 : 0

    return res.json({
      ok: true,
      user: {
        id: String(user._id),
        nombreUsuario: user.nombreUsuario,
        es_admin: esAdmin,
        rol: user.rol || 'user',
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
      },
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.get('/clases', async (_, res) => {
  try {
    if (!clasesCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const clases = await clasesCollection.find({}).sort({ fechaHora: 1 }).toArray()
    return res.json({ ok: true, clases })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.post('/clases', async (req, res) => {
  try {
    if (!clasesCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const nombre = String(req.body?.nombre || '').trim()
    const descripcion = String(req.body?.descripcion || '').trim()
    const fechaHoraRaw = req.body?.fechaHora
    const fechaHora = new Date(fechaHoraRaw)
    const plazasMaximas = Number(req.body?.plazasMaximas)
    const imagen = String(req.body?.imagen || '').trim()
    const imagenContenido = String(req.body?.imagenContenido || '').trim()

    if (!nombre) {
      return res.status(400).json({ ok: false, error: 'El nombre es obligatorio' })
    }

    if (!descripcion) {
      return res.status(400).json({ ok: false, error: 'La descripcion es obligatoria' })
    }

    if (Number.isNaN(fechaHora.getTime())) {
      return res.status(400).json({ ok: false, error: 'La fechaHora no es valida' })
    }

    if (!Number.isInteger(plazasMaximas) || plazasMaximas <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: 'plazasMaximas debe ser un entero mayor que 0' })
    }

    if (!imagen) {
      return res.status(400).json({ ok: false, error: 'La imagen es obligatoria' })
    }

    if (!imagenContenido) {
      return res.status(400).json({ ok: false, error: 'Contenido de imagen obligatorio' })
    }

    const nombreImagenGuardada = await guardarImagenEnUploads(imagen, imagenContenido)

    const nuevaClase = {
      nombre,
      descripcion,
      fechaHora,
      plazasMaximas,
      imagen: nombreImagenGuardada,
      inscritos: [],
      cancelaciones: [],
    }

    const result = await clasesCollection.insertOne(nuevaClase)
    return res.status(201).json({
      ok: true,
      id: String(result.insertedId),
      clase: { _id: String(result.insertedId), ...nuevaClase },
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.post('/clases/:idClase/inscribirse', async (req, res) => {
  try {
    if (!clasesCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const idClaseRaw = String(req.params?.idClase || '').trim()
    const usuarioIdRaw = String(req.body?.usuarioId || '').trim()

    if (!ObjectId.isValid(idClaseRaw)) {
      return res.status(400).json({ ok: false, error: 'idClase invalido' })
    }

    if (!ObjectId.isValid(usuarioIdRaw)) {
      return res.status(400).json({ ok: false, error: 'usuarioId invalido' })
    }

    const idClase = new ObjectId(idClaseRaw)
    const usuarioId = new ObjectId(usuarioIdRaw)

    const result = await clasesCollection.updateOne(
      { _id: idClase },
      { $addToSet: { inscritos: usuarioId } }
    )

    if (!result.matchedCount) {
      return res.status(404).json({ ok: false, error: 'Clase no encontrada' })
    }

    return res.json({ ok: true, yaInscrito: result.modifiedCount === 0 })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.get('/clases/:idClase/inscritos', async (req, res) => {
  try {
    if (!clasesCollection || !usuariosCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const idClaseRaw = String(req.params?.idClase || '').trim()
    if (!ObjectId.isValid(idClaseRaw)) {
      return res.status(400).json({ ok: false, error: 'idClase invalido' })
    }

    const clase = await clasesCollection.findOne(
      { _id: new ObjectId(idClaseRaw) },
      { projection: { inscritos: 1 } }
    )

    if (!clase) {
      return res.status(404).json({ ok: false, error: 'Clase no encontrada' })
    }

    const idsInscritos = (Array.isArray(clase?.inscritos) ? clase.inscritos : [])
      .map((id) => idAString(id))
      .filter((id) => ObjectId.isValid(id))

    if (!idsInscritos.length) {
      return res.json({ ok: true, usuarios: [] })
    }

    const usuarios = await usuariosCollection
      .find(
        { _id: { $in: idsInscritos.map((id) => new ObjectId(id)) } },
        { projection: { nombreUsuario: 1 } }
      )
      .toArray()

    const mapaUsuarios = new Map(usuarios.map((usuario) => [idAString(usuario._id), usuario]))
    const nombresUsuarios = idsInscritos.map((id) => {
      const usuario = mapaUsuarios.get(id)
      return String(usuario?.nombreUsuario || 'Usuario eliminado')
    })

    return res.json({ ok: true, usuarios: nombresUsuarios })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.get('/clases/usuario/:usuarioId', async (req, res) => {
  try {
    if (!clasesCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const usuarioId = String(req.params?.usuarioId || '').trim()
    if (!ObjectId.isValid(usuarioId)) {
      return res.status(400).json({ ok: false, error: 'usuarioId invalido' })
    }

    const clasesTotales = await clasesCollection.find({}).sort({ fechaHora: 1 }).toArray()
    const clases = clasesTotales.filter((clase) => {
      const inscritos = Array.isArray(clase?.inscritos) ? clase.inscritos : []
      return inscritos.some((id) => idAString(id) === usuarioId)
    })

    return res.json({ ok: true, clases })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.post('/clases/:idClase/cancelar-inscripcion', async (req, res) => {
  try {
    if (!clasesCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const idClaseRaw = String(req.params?.idClase || '').trim()
    const usuarioIdRaw = String(req.body?.usuarioId || '').trim()
    const cancelacionFueraDePlazo = Boolean(req.body?.cancelacionFueraDePlazo)

    if (!ObjectId.isValid(idClaseRaw)) {
      return res.status(400).json({ ok: false, error: 'idClase invalido' })
    }

    if (!ObjectId.isValid(usuarioIdRaw)) {
      return res.status(400).json({ ok: false, error: 'usuarioId invalido' })
    }

    const idClase = new ObjectId(idClaseRaw)
    const usuarioId = new ObjectId(usuarioIdRaw)

    let result

    if (cancelacionFueraDePlazo) {
      result = await clasesCollection.updateOne(
        { _id: idClase },
        { $addToSet: { cancelaciones: usuarioId } }
      )
    } else {
      result = await clasesCollection.updateOne(
        { _id: idClase },
        { $pull: { inscritos: { $in: [usuarioIdRaw, usuarioId] } } }
      )
    }

    if (!result.matchedCount) {
      return res.status(404).json({ ok: false, error: 'Clase no encontrada' })
    }

    if (cancelacionFueraDePlazo) {
      return res.json({ ok: true, cancelada: true, cancelacionFueraDePlazo: true })
    }

    return res.json({ ok: true, cancelada: result.modifiedCount > 0, cancelacionFueraDePlazo: false })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.get('/debug/usuarios', async (_, res) => {
  try {
    if (!usuariosCollection) {
      return res.status(503).json({ ok: false, error: 'Mongo no conectado' })
    }

    const count = await usuariosCollection.countDocuments()
    const docs = await usuariosCollection
      .find({}, { projection: { contrasena: 0 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    return res.json({ ok: true, count, docs })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

app.get('/health', (_, res) => res.send('ok'))

connectMongo().catch(() => {})
app.listen(SERVER_PORT)
