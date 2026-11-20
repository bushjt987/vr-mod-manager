import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

const sharedDir = resolve(__dirname, 'src/shared')
const rendererDir = resolve(__dirname, 'src/renderer')

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': sharedDir,
      },
    },
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
        },
        // adm-zip is a CommonJS dependency that must stay on disk rather than be
        // inlined; electron is supplied by the runtime.
        // 7zip-min shells out to a bundled 7za binary, so both it and adm-zip
        // must stay on disk rather than being inlined into the bundle.
        external: ['adm-zip', '7zip-min', '7zip-bin', 'electron'],
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        '@shared': sharedDir,
      },
    },
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
        },
      },
    },
  },
  renderer: {
    root: rendererDir,
    resolve: {
      alias: {
        // shadcn/ui generates imports rooted at '@', so that alias has to
        // resolve to the renderer source dir the components live in.
        '@': resolve(__dirname, 'src/renderer/src'),
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': sharedDir,
      },
    },
    plugins: [react({}), tailwindcss()],
    // When launched from PAL, use the port it hands out instead of Vite's
    // default 5173, which other apps' dev servers want too.
    server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: {
          index: resolve(rendererDir, 'index.html'),
        },
      },
    },
  },
})
