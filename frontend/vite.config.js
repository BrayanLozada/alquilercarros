import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Nota: ajusta `base` a tu URL de GitHub Pages.
// Para repositorio de proyecto: https://usuario.github.io/alquilercarros -> base: '/alquilercarros/'
// Para página de usuario:     https://usuario.github.io             -> base: '/'
export default defineConfig({
  plugins: [react()],
  base: '/alquilercarros/',
})
