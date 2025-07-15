import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true
    }
  },
  build: {
    chunkSizeWarningLimit: 10000
  }
})
