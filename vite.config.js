import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose server on all network interfaces
    port: 5173,
    strictPort: false, // Try next available port if 5173 is taken
    open: true // Automatically open browser when server starts
  }
})
