import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env variables based on the current mode (e.g., 'development', 'production')
  const env = loadEnv(mode, process.cwd(), '')

  // Access your environment variable
  const debugMode = env.VITE_APP_DEBUG
  
  return {
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.PORT) || 5387,
    strictPort: !!process.env.PORT,
    // Allow ngrok (and similar) tunnels for partner custom-domain testing in dev.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io', '.ngrok.app', '.local'],
    proxy: {
      '/api': {
        target: env.VITE_API_PROXY_TARGET || 'https://localhost:7114',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}})
