import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // outDir: 'dist', // Default
    manifest: true,
    rollupOptions: {
      // Ensure we don't hash the entry too weirdly if possible, but manifest handles it.
    }
  },
  base: '/' // Use absolute paths for Vercel deployment
})
