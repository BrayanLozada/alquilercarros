import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

sqlite3.verbose()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

export default db
