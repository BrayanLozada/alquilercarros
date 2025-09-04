import db from './db.js'
import bcrypt from 'bcryptjs'

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
    db.get(sql, params, function (err, row) {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

async function createTables() {
  await runAsync('PRAGMA foreign_keys = ON;')

  await runAsync(`CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );`)

  await runAsync(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );`)

  await runAsync(`CREATE TABLE IF NOT EXISTS carros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    color TEXT,
    modelo TEXT,
    estado TEXT NOT NULL DEFAULT 'activo'
  );`)

  await runAsync(`CREATE TABLE IF NOT EXISTS tramos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    minutos INTEGER NOT NULL UNIQUE,
    activo INTEGER NOT NULL DEFAULT 1
  );`)

  await runAsync(`CREATE TABLE IF NOT EXISTS tarifas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monto REAL NOT NULL,
    fecha_desde TEXT NOT NULL,
    activa INTEGER NOT NULL DEFAULT 1
  );`)
}

async function seedData() {
  // Roles
  const roleCount = await getAsync('SELECT COUNT(*) as c FROM roles')
  if ((roleCount?.c ?? 0) === 0) {
    await runAsync('INSERT INTO roles (nombre) VALUES (?), (?), (?)', [
      'Operador',
      'Supervisor',
      'Admin',
    ])
  }

  // Admin user
  const admin = await getAsync("SELECT u.id FROM usuarios u JOIN roles r ON r.id = u.role_id WHERE u.username = 'admin'")
  if (!admin) {
    const adminPwd = process.env.ADMIN_PASSWORD || 'admin123'
    const hash = bcrypt.hashSync(adminPwd, 10)
    const role = await getAsync("SELECT id FROM roles WHERE nombre = 'Admin'")
    await runAsync('INSERT INTO usuarios (username, password, role_id, activo) VALUES (?, ?, ?, 1)', [
      'admin',
      hash,
      role.id,
    ])
  }

  // Operador y Supervisor por defecto si no existen
  const operadorUser = await getAsync("SELECT u.id FROM usuarios u WHERE u.username = 'operador'")
  if (!operadorUser) {
    const opPwd = process.env.OPERADOR_PASSWORD || 'operador123'
    const hash = bcrypt.hashSync(opPwd, 10)
    const role = await getAsync("SELECT id FROM roles WHERE nombre = 'Operador'")
    await runAsync('INSERT INTO usuarios (username, password, role_id, activo) VALUES (?, ?, ?, 1)', [
      'operador', hash, role.id,
    ])
  }
  const supervisorUser = await getAsync("SELECT u.id FROM usuarios u WHERE u.username = 'supervisor'")
  if (!supervisorUser) {
    const supPwd = process.env.SUPERVISOR_PASSWORD || 'supervisor123'
    const hash = bcrypt.hashSync(supPwd, 10)
    const role = await getAsync("SELECT id FROM roles WHERE nombre = 'Supervisor'")
    await runAsync('INSERT INTO usuarios (username, password, role_id, activo) VALUES (?, ?, ?, 1)', [
      'supervisor', hash, role.id,
    ])
  }

  // Tramos 15 y 30
  const t15 = await getAsync('SELECT id FROM tramos WHERE minutos = 15')
  if (!t15) await runAsync('INSERT INTO tramos (minutos, activo) VALUES (15, 1)')
  const t30 = await getAsync('SELECT id FROM tramos WHERE minutos = 30')
  if (!t30) await runAsync('INSERT INTO tramos (minutos, activo) VALUES (30, 1)')

  // Tarifa global activa
  const activeTarifa = await getAsync('SELECT id FROM tarifas WHERE activa = 1 LIMIT 1')
  if (!activeTarifa) {
    const monto = parseFloat(process.env.GLOBAL_RATE || '100')
    const today = new Date().toISOString().slice(0, 10)
    await runAsync('INSERT INTO tarifas (monto, fecha_desde, activa) VALUES (?, ?, 1)', [monto, today])
  }

  // Carros de ejemplo si vacío
  const carCount = await getAsync('SELECT COUNT(*) as c FROM carros')
  if ((carCount?.c ?? 0) === 0) {
    await runAsync('INSERT INTO carros (nombre, color, modelo, estado) VALUES (?,?,?,?), (?,?,?,?), (?,?,?,?)', [
      'RC-Alpha', 'Rojo', 'X1', 'activo',
      'RC-Bravo', 'Azul', 'X2', 'activo',
      'RC-Charlie', 'Verde', 'X3', 'activo',
    ])
  }
}

export default async function initDb() {
  await new Promise((resolve) => db.serialize(resolve))
  await createTables()
  await seedData()
}
