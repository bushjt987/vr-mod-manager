import { defineConfig } from 'vite'
import { resolve } from 'node:path'

/** Bundle for scripts/install-local.ts; same shape as the e2e config. */
export default defineConfig({
  resolve: {
    alias: { '@shared': resolve(__dirname, '../src/shared') },
  },
  build: {
    ssr: true,
    outDir: resolve(__dirname, '../out/e2e'),
    emptyOutDir: false,
    minify: false,
    target: 'node22',
    rollupOptions: {
      input: resolve(__dirname, 'install-local.ts'),
      external: ['electron', 'adm-zip'],
      output: { entryFileNames: 'install-local.mjs', format: 'es' },
    },
  },
})
