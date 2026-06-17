import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/web-ifc/web-ifc.wasm',
          dest: '',
          rename: { stripBase: 2 },
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
  worker: {
    format: 'es',
  },
})
