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
  define: {
    global: 'globalThis',
    process: `({ env: { NODE_ENV: ${JSON.stringify(mode)} }, browser: true, version: 'v18.0.0', nextTick: (cb) => queueMicrotask(cb) })`,
  },
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
      // mdb-reader's exports map prefers "node"; Rolldown would pull Node crypto/zlib.
      'mdb-reader': path.resolve(__dirname, 'node_modules/mdb-reader/lib/browser/index.js'),
      'create-hash': path.resolve(__dirname, 'node_modules/create-hash/browser.js'),
    },
  },
}})
