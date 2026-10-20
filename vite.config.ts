import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: '/apex-alpine/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500, rollupOptions: { output: { manualChunks: { three: ['three', '@react-three/fiber', '@react-three/drei'] } } } },
})
