import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    force: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('sweetalert2')) {
              return 'vendor-swal';
            }
            if (id.includes('socket.io-client')) {
              return 'vendor-socket';
            }
            return 'vendor'; // Split other node_modules into a general vendor chunk
          }
        }
      }
    },
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: true
  }
})
