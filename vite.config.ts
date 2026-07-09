// Build trigger: env-sync 2026-07-09T01:48Z (VITE_SUPABASE_* production fix)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/web-ifc/web-ifc.wasm',
          dest: '',
          rename: { stripBase: 2 },
        },
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          dest: '',
          rename: { stripBase: 2 },
        },
        {
          src: 'examples/travel-planner/*',
          dest: 'travel-planner',
          rename: { stripBase: 2 },
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['web-ifc', 'hls.js', 'zustand'],
  },
  worker: {
    format: 'es',
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/terminal': { target: 'ws://127.0.0.1:4177', ws: true, changeOrigin: true }, '/api': {
        target: 'http://127.0.0.1:4177',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('web-ifc')) return 'web-ifc'
            if (id.includes('pdfjs-dist') || id.includes('pdf.worker')) return 'pdfjs'
            if (id.includes('xlsx')) return 'xlsx'
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor'
            if (id.includes('lucide-react')) return 'lucide'
            if (id.includes(path.sep + 'react' + path.sep) || id.includes('/react/')) return 'react-vendor'
            if (id.includes(path.sep + 'react-dom' + path.sep) || id.includes('/react-dom/')) return 'react-vendor'
            if (id.includes('@supabase') || id.includes('supabase')) return 'supabase-vendor'
            if (id.includes('docx')) return 'docx'
            // Fallback: split other node_modules by package name to avoid one huge vendor chunk
            const nm = id.split('node_modules' + path.sep)[1] || id.split('node_modules/')[1] || ''
            const pkg = (nm.split(path.sep)[0] || nm.split('/')[0] || '').replace('@','').replace(/[\/]/g,'-')
            if (pkg) return `vendor-${pkg}`
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
