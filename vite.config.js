import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  // No client-exposed secrets: the browser talks only to our own /api/* routes,
  // which hold the Supabase service key server-side.
  return {
    plugins: [react()],
    server: { port: Number(process.env.PORT) || 5173 },
  }
})
