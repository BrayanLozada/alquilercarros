import express from 'express'
import cors from 'cors'
import db from './db.js'
import initDb from './initDb.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API running')
})

// Utilidades async para sqlite3
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve(this)
    })
  })
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

// Ruta de autenticación simple
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({ error: 'credenciales inválidas' })
    }
    const row = await getAsync(
      `SELECT u.id, u.username, u.password, r.nombre as rol
       FROM usuarios u JOIN roles r ON r.id = u.role_id
       WHERE u.username = ? AND u.activo = 1`,
      [username]
    )
    if (!row) return res.status(401).json({ error: 'usuario inválido' })
    const { default: bcrypt } = await import('bcryptjs')
    const ok = bcrypt.compareSync(password, row.password)
    if (!ok) return res.status(401).json({ error: 'contraseña inválida' })
    const { password: _pwd, ...user } = row
    user.rol = user.rol.toLowerCase()
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Rutas: Roles
app.get('/roles', async (_req, res) => {
  try {
    const rows = await allAsync('SELECT id, nombre FROM roles ORDER BY nombre ASC')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/roles', async (req, res) => {
  try {
    const { nombre } = req.body || {}
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
      return res.status(400).json({ error: 'nombre de rol inválido' })
    }
    const exists = await getAsync('SELECT id FROM roles WHERE LOWER(nombre) = LOWER(?)', [nombre.trim()])
    if (exists) return res.status(409).json({ error: 'rol ya existe' })
    const r = await runAsync('INSERT INTO roles (nombre) VALUES (?)', [nombre.trim()])
    const row = await getAsync('SELECT id, nombre FROM roles WHERE id = ?', [r.lastID])
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Rutas: Tramos
app.get('/tramos', async (req, res) => {
  try {
    const rows = await allAsync('SELECT id, minutos, activo FROM tramos ORDER BY minutos ASC')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/tramos', async (req, res) => {
  try {
    const { minutos } = req.body || {}
    if (!Number.isInteger(minutos) || minutos <= 0) return res.status(400).json({ error: 'minutos inválido' })
    const existing = await getAsync('SELECT id, activo FROM tramos WHERE minutos = ?', [minutos])
    if (existing) {
      await runAsync('UPDATE tramos SET activo = 1 WHERE id = ?', [existing.id])
      const row = await getAsync('SELECT id, minutos, activo FROM tramos WHERE id = ?', [existing.id])
      return res.status(200).json(row)
    }
    const r = await runAsync('INSERT INTO tramos (minutos, activo) VALUES (?, 1)', [minutos])
    const row = await getAsync('SELECT id, minutos, activo FROM tramos WHERE id = ?', [r.lastID])
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/tramos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { minutos, activo } = req.body || {}
    const existing = await getAsync('SELECT id FROM tramos WHERE id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'No encontrado' })
    const updates = []
    const params = []
    if (minutos !== undefined) {
      if (!Number.isInteger(minutos) || minutos <= 0) return res.status(400).json({ error: 'minutos inválido' })
      updates.push('minutos = ?'); params.push(minutos)
    }
    if (activo !== undefined) {
      updates.push('activo = ?'); params.push(activo ? 1 : 0)
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' })
    params.push(id)
    await runAsync(`UPDATE tramos SET ${updates.join(', ')} WHERE id = ?`, params)
    const row = await getAsync('SELECT id, minutos, activo FROM tramos WHERE id = ?', [id])
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/tramos/:id/desactivar', async (req, res) => {
  try {
    const { id } = req.params
    await runAsync('UPDATE tramos SET activo = 0 WHERE id = ?', [id])
    const row = await getAsync('SELECT id, minutos, activo FROM tramos WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'No encontrado' })
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/tramos/:id/reactivar', async (req, res) => {
  try {
    const { id } = req.params
    await runAsync('UPDATE tramos SET activo = 1 WHERE id = ?', [id])
    const row = await getAsync('SELECT id, minutos, activo FROM tramos WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'No encontrado' })
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/tramos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const row = await getAsync('SELECT id FROM tramos WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'No encontrado' })
    await runAsync('DELETE FROM tramos WHERE id = ?', [id])
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Rutas: Carros (catálogo)
app.get('/carros', async (_req, res) => {
  try {
    const rows = await allAsync('SELECT id, nombre, color, modelo, estado, motivo_mant FROM carros ORDER BY id ASC')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/carros', async (req, res) => {
  try {
    const { nombre, color = null, modelo = null, estado = 'disponible', motivo_mant = null } = req.body || {}
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' })
    const allowedEstados = ['disponible', 'en_uso', 'mantenimiento']
    if (estado && !allowedEstados.includes(estado)) return res.status(400).json({ error: 'estado inválido' })
    const r = await runAsync('INSERT INTO carros (nombre, color, modelo, estado, motivo_mant) VALUES (?,?,?,?,?)', [nombre, color, modelo, estado, motivo_mant])
    const row = await getAsync('SELECT id, nombre, color, modelo, estado, motivo_mant FROM carros WHERE id = ?', [r.lastID])
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/carros/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, color, modelo, estado, motivo_mant } = req.body || {}
    const existing = await getAsync('SELECT id FROM carros WHERE id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'No encontrado' })
    // Construir SET dinámico
    const updates = []
    const params = []
    if (nombre !== undefined) { updates.push('nombre = ?'); params.push(nombre) }
    if (color !== undefined) { updates.push('color = ?'); params.push(color) }
    if (modelo !== undefined) { updates.push('modelo = ?'); params.push(modelo) }
    if (estado !== undefined) {
      const allowedEstados = ['disponible', 'en_uso', 'mantenimiento']
      if (!allowedEstados.includes(estado)) return res.status(400).json({ error: 'estado inválido' })
      updates.push('estado = ?'); params.push(estado)
      if (estado !== 'mantenimiento') {
        updates.push('motivo_mant = NULL')
      }
    }
    if (motivo_mant !== undefined) { updates.push('motivo_mant = ?'); params.push(motivo_mant) }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' })
    params.push(id)
    await runAsync(`UPDATE carros SET ${updates.join(', ')} WHERE id = ?`, params)
    const row = await getAsync('SELECT id, nombre, color, modelo, estado, motivo_mant FROM carros WHERE id = ?', [id])
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Rutas: Alquileres
app.post('/alquileres', async (req, res) => {
  try {
    const { carro_id, tramo_id, operador_id, inicio: inicioManual } = req.body || {}
    if (!carro_id || !tramo_id || !operador_id) {
      return res.status(400).json({ error: 'datos inválidos' })
    }
    const car = await getAsync('SELECT id, estado FROM carros WHERE id = ?', [carro_id])
    if (!car || car.estado !== 'disponible') {
      return res.status(400).json({ error: 'carro no disponible' })
    }
    const tramo = await getAsync('SELECT id, minutos FROM tramos WHERE id = ? AND activo = 1', [tramo_id])
    if (!tramo) return res.status(400).json({ error: 'tramo inválido' })
    const tarifa = await getAsync('SELECT monto FROM tarifas WHERE activa = 1 ORDER BY date(fecha_desde) DESC LIMIT 1')
    const costo = tarifa?.monto ?? 0
    const inicio = inicioManual ? new Date(inicioManual).toISOString() : new Date().toISOString()
    const r = await runAsync('INSERT INTO alquileres (carro_id, tramo_id, operador_id, inicio, costo, estado) VALUES (?,?,?,?,?,"activo")', [carro_id, tramo_id, operador_id, inicio, costo])
    await runAsync('UPDATE carros SET estado = ? WHERE id = ?', ['en_uso', carro_id])
    const row = await getAsync('SELECT * FROM alquileres WHERE id = ?', [r.lastID])
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/alquileres/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params
    const { metodo_pago = 'efectivo', destino = 'disponible', motivo_mant = null } = req.body || {}
    const alq = await getAsync('SELECT carro_id FROM alquileres WHERE id = ? AND estado = "activo"', [id])
    if (!alq) return res.status(404).json({ error: 'No encontrado' })
    const fin = new Date().toISOString()
    await runAsync('UPDATE alquileres SET fin = ?, metodo_pago = ?, estado = "cerrado" WHERE id = ?', [fin, metodo_pago, id])
    if (destino === 'mantenimiento') {
      await runAsync('UPDATE carros SET estado = ?, motivo_mant = ? WHERE id = ?', ['mantenimiento', motivo_mant, alq.carro_id])
    } else {
      await runAsync('UPDATE carros SET estado = ?, motivo_mant = NULL WHERE id = ?', ['disponible', alq.carro_id])
    }
    const row = await getAsync('SELECT * FROM alquileres WHERE id = ?', [id])
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Rutas: Tarifa global
app.get('/tarifa/activa', async (_req, res) => {
  try {
    const row = await getAsync('SELECT id, monto, fecha_desde, activa FROM tarifas WHERE activa = 1 ORDER BY date(fecha_desde) DESC LIMIT 1')
    res.json(row || null)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/tarifa', async (req, res) => {
  try {
    const { monto, fecha_desde } = req.body || {}
    const m = parseFloat(monto)
    if (!Number.isFinite(m) || m <= 0) return res.status(400).json({ error: 'monto inválido' })
    const f = fecha_desde || new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return res.status(400).json({ error: 'fecha_desde formato YYYY-MM-DD' })
    await runAsync('UPDATE tarifas SET activa = 0 WHERE activa = 1')
    const r = await runAsync('INSERT INTO tarifas (monto, fecha_desde, activa) VALUES (?, ?, 1)', [m, f])
    const row = await getAsync('SELECT id, monto, fecha_desde, activa FROM tarifas WHERE id = ?', [r.lastID])
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Rutas: Usuarios
app.get('/usuarios', async (_req, res) => {
  try {
    const rows = await allAsync(
      `SELECT u.id, u.username, u.activo, u.role_id, r.nombre as role
       FROM usuarios u JOIN roles r ON r.id = u.role_id
       ORDER BY u.id ASC`
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/usuarios', async (req, res) => {
  try {
    const { username, password, role_id, activo = 1 } = req.body || {}
    if (!username || typeof username !== 'string' || username.trim().length < 3) return res.status(400).json({ error: 'username inválido' })
    if (!password || typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'password inválido' })
    const role = await getAsync('SELECT id FROM roles WHERE id = ?', [role_id])
    if (!role) return res.status(400).json({ error: 'role_id inválido' })
    const exists = await getAsync('SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?)', [username.trim()])
    if (exists) return res.status(409).json({ error: 'usuario ya existe' })
    const { default: bcrypt } = await import('bcryptjs')
    const hash = bcrypt.hashSync(password, 10)
    const r = await runAsync('INSERT INTO usuarios (username, password, role_id, activo) VALUES (?, ?, ?, ?)', [username.trim(), hash, role.id, activo ? 1 : 0])
    const row = await getAsync('SELECT id, username, role_id, activo FROM usuarios WHERE id = ?', [r.lastID])
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/usuarios/:id/password', async (req, res) => {
  try {
    const { id } = req.params
    const { oldPassword, newPassword } = req.body || {}
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'password inválido' })
    }
    const user = await getAsync('SELECT password FROM usuarios WHERE id = ? AND activo = 1', [id])
    if (!user) return res.status(404).json({ error: 'No encontrado' })
    const { default: bcrypt } = await import('bcryptjs')
    const ok = bcrypt.compareSync(oldPassword, user.password)
    if (!ok) return res.status(401).json({ error: 'contraseña actual incorrecta' })
    const hash = bcrypt.hashSync(newPassword, 10)
    await runAsync('UPDATE usuarios SET password = ? WHERE id = ?', [hash, id])
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const exists = await getAsync('SELECT id FROM usuarios WHERE id = ?', [id])
    if (!exists) return res.status(404).json({ error: 'No encontrado' })
    await runAsync('DELETE FROM usuarios WHERE id = ?', [id])
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, password, role_id, activo } = req.body || {}
    const exists = await getAsync('SELECT id FROM usuarios WHERE id = ?', [id])
    if (!exists) return res.status(404).json({ error: 'No encontrado' })
    const updates = []
    const params = []
    if (username !== undefined) {
      if (!username || username.trim().length < 3) return res.status(400).json({ error: 'username inválido' })
      updates.push('username = ?'); params.push(username.trim())
    }
    if (password !== undefined) {
      if (!password || password.length < 6) return res.status(400).json({ error: 'password inválido' })
      const { default: bcrypt } = await import('bcryptjs')
      updates.push('password = ?'); params.push(bcrypt.hashSync(password, 10))
    }
    if (role_id !== undefined) {
      const role = await getAsync('SELECT id FROM roles WHERE id = ?', [role_id])
      if (!role) return res.status(400).json({ error: 'role_id inválido' })
      updates.push('role_id = ?'); params.push(role_id)
    }
    if (activo !== undefined) {
      updates.push('activo = ?'); params.push(activo ? 1 : 0)
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' })
    params.push(id)
    await runAsync(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params)
    const row = await getAsync('SELECT id, username, role_id, activo FROM usuarios WHERE id = ?', [id])
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 3000

// Inicializar DB y arrancar servidor
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Error inicializando la base de datos:', err)
    process.exit(1)
  })
