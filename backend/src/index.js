import express from 'express'
import db from './db.js'

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API running')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
