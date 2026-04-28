import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Дозволяє підключення ззовні контейнера (еквівалент --host)
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Допомагає Docker відстежувати зміни у файлах (Windows/WSL)
    }
  }
})