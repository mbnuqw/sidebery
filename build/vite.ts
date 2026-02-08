import path from 'node:path'
import { build, defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { IS_DEV, ADDON_PATH, KEEP_NAMES, BUNDLE_VUE, logErr } from './utils.js'
import { IIFE_BANNER_WITH_REINJECT_GUARD, IIFE_FOOTER } from './utils.js'
import { log, logOk } from './utils.js'

if (IS_DEV) {
  throw logErr('Vite is too slow for dev builds (and dev server is useless for addons) ┐(´ー｀)┌')
}
if (!BUNDLE_VUE) {
  throw logErr('Not bundling Vue is not supported right now')
}

const ROOT_DIR = path.resolve(import.meta.dirname, '..')

const base = defineConfig({
  appType: 'custom',
  mode: 'production',
  define: {},
  clearScreen: false,
  cacheDir: process.env.SIDEBERY_CACHE_DIR || 'node_modules/.vite',
  resolve: {
    alias: {
      src: path.resolve(ROOT_DIR, 'src'),
    },
  },
  esbuild: {
    minifyIdentifiers: !KEEP_NAMES,
  },
  build: {
    minify: 'esbuild',
    assetsDir: '',
    target: 'esnext',
    outDir: ADDON_PATH,
    emptyOutDir: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: BUNDLE_VUE ? undefined : ['vue'],
      preserveEntrySignatures: false,
      treeshake: 'smallest',
      input: {},
      output: {
        generatedCode: 'es2015',
        strict: true,
        compact: true,
        freeze: false,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunk-[hash].js',
      },
    },
  },
})

if (KEEP_NAMES && BUNDLE_VUE && base.resolve?.alias) {
  ;(base.resolve.alias as any)['vue'] = path.resolve(
    ROOT_DIR,
    'node_modules/vue/dist/vue.runtime.esm-browser.prod.js'
  )
}

const visualizerConfig = {
  emitFile: true,
  filename: 'stats.html',
  open: false,
  template: 'treemap',
} as const

async function main() {
  log('Scripts: Building')

  const buildTasks = []

  // Scripts with common splitted chunks
  const splittedScripts = defineConfig({
    build: {
      rollupOptions: {
        input: {
          'bg/background': 'src/bg/background.ts',
          'sidebar/sidebar': 'src/sidebar/sidebar.ts',
          'page.setup/setup': 'src/page.setup/setup.ts',
          'popup.sync/sync': 'src/popup.sync/sync.ts',
          'popup.panel-config/panel-config': 'src/popup.panel-config/panel-config.ts',
          'popup.proxy/proxy': 'src/popup.proxy/proxy.ts',
          'popup.search/search': 'src/popup.search/search.ts',
          'popup.editing/editing': 'src/popup.editing/editing.ts',
          '_locales/dict.common': 'src/_locales/dict.common.ts',
          '_locales/dict.sidebar': 'src/_locales/dict.sidebar.ts',
          '_locales/dict.setup-page': 'src/_locales/dict.setup-page.ts',
        },
      },
    },
    plugins: [vue()],
    // plugins: [vue(), visualizer(visualizerConfig)],
  })
  buildTasks.push(build(mergeConfig(base, splittedScripts, true)))

  // Isolated scripts for injecting
  const mediaInjections = defineConfig({
    build: {
      rollupOptions: {
        input: {
          'injections/play-media': 'src/injections/play-media.ts',
          'injections/pause-media': 'src/injections/pause-media.ts',
          'injections/check-paused-media': 'src/injections/check-paused-media.ts',
        },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, mediaInjections, true)))

  // Isolated group script for injection with re-inject guards
  const groupInjection = defineConfig({
    build: {
      rollupOptions: {
        input: { 'injections/group': 'src/injections/group.ts' },
        output: {
          banner: IIFE_BANNER_WITH_REINJECT_GUARD,
          footer: IIFE_FOOTER,
        },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, groupInjection, true)))

  // Isolated url script for injection with re-inject guards
  const urlInjection = defineConfig({
    build: {
      rollupOptions: {
        input: { 'injections/url': 'src/injections/url.ts' },
        output: {
          banner: IIFE_BANNER_WITH_REINJECT_GUARD,
          footer: IIFE_FOOTER,
        },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, urlInjection, true)))

  // Isolated script for preview injection (in-page)
  const inpagePreviewInjection = defineConfig({
    build: {
      rollupOptions: {
        input: { 'injections/tab-preview': 'src/injections/tab-preview.ts' },
        output: { format: 'iife' },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, inpagePreviewInjection, true)))

  // Isolated script for preview popup (window)
  const windowPreviewScript = defineConfig({
    build: {
      rollupOptions: {
        input: { 'popup.tab-preview/tab-preview': 'src/popup.tab-preview/tab-preview.ts' },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, windowPreviewScript, true)))

  await Promise.all(buildTasks)

  logOk('Scripts: Done')
}
main()
