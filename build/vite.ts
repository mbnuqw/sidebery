import path from 'node:path'
import { build, defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { RolldownWatcher } from 'rolldown'
import { IS_DEV, ADDON_PATH } from './utils.js'
import { log, logOk } from './utils.js'
// import { visualizer } from 'rollup-plugin-visualizer'
// import type { PluginVisualizerOptions } from 'rollup-plugin-visualizer'

const base = defineConfig({
  appType: 'custom',
  mode: 'production',
  define: {},
  clearScreen: false,
  cacheDir: process.env.SIDEBERY_CACHE_DIR || 'node_modules/.vite',
  logLevel: 'warn',
  build: {
    modulePreload: false,
    watch: IS_DEV ? { buildDelay: 32 } : null,
    minify: !IS_DEV,
    assetsDir: '',
    target: 'esnext',
    outDir: ADDON_PATH,
    emptyOutDir: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    sourcemap: IS_DEV ? 'inline' : false,
    rolldownOptions: {
      preserveEntrySignatures: false,
      treeshake: true,
      input: {},
      output: {
        strict: true,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunk-[hash].js',
      },
    },
  },
})

// const visualizerConfig: PluginVisualizerOptions = {
//   emitFile: true,
//   filename: 'stats.html',
//   open: false,
//   template: 'markdown',
// }

async function main() {
  log('Scripts: Building')
  let firstBuild = true

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
      rolldownOptions: {
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
      rolldownOptions: {
        input: { 'page.group/group': 'src/page.group/group.ts' },
        output: {
          codeSplitting: false,
          dir: path.join(ADDON_PATH, 'sidebery'),
          entryFileNames: 'group.js',
        },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, groupInjection, true)))

  // Isolated url script for injection with re-inject guards
  const urlInjection = defineConfig({
    build: {
      rolldownOptions: {
        input: { 'page.url/url': 'src/page.url/url.ts' },
        output: {
          codeSplitting: false,
          dir: path.join(ADDON_PATH, 'sidebery'),
          entryFileNames: 'url.js',
        },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, urlInjection, true)))

  // Isolated script for preview injection (in-page)
  const inpagePreviewInjection = defineConfig({
    build: {
      rolldownOptions: {
        input: { 'injections/tab-preview': 'src/injections/tab-preview.ts' },
        output: { format: 'iife' },
      },
    },
  })
  buildTasks.push(build(mergeConfig(base, inpagePreviewInjection, true)))

  const buildResults = await Promise.all(buildTasks)

  if (!IS_DEV) logOk('Scripts: Done')
  else {
    let building = 0
    for (const r of buildResults as RolldownWatcher[]) {
      r.on('event', e => {
        if (e.code === 'START' && building++ === 0 && !firstBuild) log('Scripts: Building')
        if (e.code === 'END' && --building === 0) logOk('Scripts: Watching')
        if (firstBuild) firstBuild = false
      })
    }
  }
}
main()
