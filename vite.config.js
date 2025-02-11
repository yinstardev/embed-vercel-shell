import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8080,
    allowedHosts: ['.trycloudflare.com']
  },
  build: {
    rollupOptions: {
      input: 'src/script.ts'
    },
    outDir: 'dist',
    sourcemap: true
  }
}) 