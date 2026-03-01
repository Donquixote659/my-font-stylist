import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // 브라우저에서 process.env 에러가 나는 것을 방지하는 설정입니다.
  define: {
    'process.env': {},
  },
  build: {
    outDir: 'dist',
  }
})