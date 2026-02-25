import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // server: {
  //   proxy: {
  //     '/generateResponse': {
  //       target: 'https://us-central1-boc-bot.cloudfunctions.net',
  //       changeOrigin: true,
  //     },
  //   },
  // },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
