import { defineConfig } from 'vite'
import { resolve } from 'node:path'

/**
 * A one-off bundle for the end-to-end installer check, kept out of the app
 * build. It reuses the real main-process modules so the test exercises the
 * shipping code rather than a reimplementation of it.
 */
export default defineConfig({
  resolve: {
    alias: { '@shared': resolve(__dirname, '../src/shared') },
  },
  build: {
    ssr: true,
    outDir: resolve(__dirname, '../out/e2e'),
    // Every script shares out/e2e with a distinct filename; wiping the folder
    // would delete the other bundles, which silently emptied the README table.
    emptyOutDir: false,
    minify: false,
    target: 'node22',
    rollupOptions: {
      input: resolve(__dirname, 'e2e-install.ts'),
      external: ['electron', 'adm-zip'],
      output: { entryFileNames: 'e2e-install.mjs', format: 'es' },
    },
  },
})
