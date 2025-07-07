import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/baidu": {
        rewrite: (path) => path.replace(/^\/baidu/, ""),
        target: "https://api.map.baidu.com",
        changeOrigin: true,
      },
      "/qweatherapi": {
        rewrite: (path) => path.replace(/^\/qweatherapi/, ""),
        target: "https://m34d92mctd.re.qweatherapi.com",
        changeOrigin: true,
      },
    },
  },
}) 