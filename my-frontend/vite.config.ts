import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  define: {
    global: "window",          // map global → window
  },
  optimizeDeps: {
    include: ["sockjs-client"],
  },
  plugins: [
    react(),
    // đọc thẳng alias từ tsconfig.json, khỏi phải khai lại trong vite.config.ts
    tsconfigPaths()
  ],
  server: {
    port: 3000,
    open: true
  },
  // nếu bạn không dùng vite-tsconfig-paths thì dùng:
  // resolve: {
  //   alias: { '@': path.resolve(__dirname, 'src') }
  // }
})
