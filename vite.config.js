import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8080,
    allowedHosts: ['*']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
}) 