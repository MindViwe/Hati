import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: './app',  // Set root directory to app
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/src')
    }
  },
  build: {
    outDir: './dist',  // Output directory relative to root
    emptyOutDir: true
  }
})
