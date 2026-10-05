/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // e2e/ is Playwright's; vitest would otherwise try to run it.
  test: { include: ['src/**/*.test.{ts,tsx}'] },
})
