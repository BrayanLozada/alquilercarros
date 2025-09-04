import initDb from '../src/initDb.js'
import db from '../src/db.js'

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (e, r) => e ? reject(e) : resolve(r)))
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (e, r) => e ? reject(e) : resolve(r)))
}

async function main() {
  try {
    await initDb()

    // Roles
    const roles = await allAsync('SELECT nombre FROM roles ORDER BY nombre')
    const roleNames = roles.map(r => r.nombre)
    if (!['Admin','Operador','Supervisor'].every(n => roleNames.includes(n))) {
      throw new Error('Roles faltantes')
    }

    // Usuarios
    const admin = await getAsync("SELECT u.id FROM usuarios u JOIN roles r ON r.id=u.role_id WHERE u.username='admin' AND r.nombre='Admin'")
    if (!admin) throw new Error('Usuario admin faltante')
    const operador = await getAsync("SELECT u.id FROM usuarios u JOIN roles r ON r.id=u.role_id WHERE u.username='operador' AND r.nombre='Operador'")
    if (!operador) throw new Error('Usuario operador faltante')
    const supervisor = await getAsync("SELECT u.id FROM usuarios u JOIN roles r ON r.id=u.role_id WHERE u.username='supervisor' AND r.nombre='Supervisor'")
    if (!supervisor) throw new Error('Usuario supervisor faltante')

    // Tramos
    const t15 = await getAsync('SELECT id FROM tramos WHERE minutos = 15')
    const t30 = await getAsync('SELECT id FROM tramos WHERE minutos = 30')
    if (!t15 || !t30) throw new Error('Tramos 15/30 faltantes')

    // Tarifa activa
    const tarifa = await getAsync('SELECT id FROM tarifas WHERE activa = 1')
    if (!tarifa) throw new Error('Tarifa activa faltante')

    // Carros
    const carCount = await getAsync('SELECT COUNT(*) as c FROM carros')
    if (!carCount || carCount.c <= 0) throw new Error('Carros seed faltantes')

    console.log('OK: Seeds verificados')
    process.exit(0)
  } catch (err) {
    console.error('FALLO:', err.message)
    process.exit(1)
  }
}

main()

