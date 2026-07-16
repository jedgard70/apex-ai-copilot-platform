import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Use threads pool — avoids fork worker timeout on Windows + Node 24
    pool: 'threads',
    // Increase timeout for integration-style tests
    testTimeout: 30000,
    hookTimeout: 30000,
    // Exclude heavy native/electron paths
    exclude: [
      ...configDefaults.exclude,
      'dist_electron/**',
      'e2e/**',
      'playwright.config.ts',
      '**/node_modules/node-pty/**',
      '**/node_modules/node-llama-cpp/**',
      '**/runtime/**',
    ],
    // Don't try to transform native binary files
    server: {
      deps: {
        external: [
          'node-pty',
          'node-llama-cpp',
          'ffmpeg-static',
          'whatsapp-web.js',
          'electron',
          'electron-updater',
        ],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'api/**'],
      exclude: ['src/lib/**/*.d.ts'],
    },
  },
})
