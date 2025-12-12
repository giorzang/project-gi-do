import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Bất cứ request nào bắt đầu bằng /api sẽ trỏ về backend 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy cho Auth
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy cho Socket.io
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true, // Quan trọng: Hỗ trợ WebSocket
      }
    }
  }
})
