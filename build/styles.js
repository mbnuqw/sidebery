/* eslint no-console: off */
import fs from 'fs'
import path from 'path'
import stylus from 'stylus'
import esbuild from 'esbuild'
import { IS_DEV, ADDON_PATH, getTime, watch, log, logOk } from './utils.js'

const OUTPUT_DIR = `${ADDON_PATH}/styles`
const ENTRIES = [
  './src/styles/sidebar/sidebar.styl',
  './src/styles/page.url/url.styl',
  './src/styles/page.group/group.styl',
  './src/styles/page.setup/setup.styl',
  './src/styles/popup.proxy/proxy.styl',
  './src/styles/popup.sync/sync.styl',
  './src/styles/popup.panel-config/panel-config.styl',
]

/**
 * Build
 */
async function build() {
  const entries = getEntries()
  await compileStyles(entries)
}

/**
 * Build and watch
 */
async function buildAndWatch() {
  const entries = getEntries()
  await compileStyles(entries)

  const tasks = await Promise.all(
    entries.map(async e => {
      const srcContent = await fs.promises.readFile(e.srcPath, 'utf-8')
      const deps = stylus(srcContent)
        .set('paths', [path.dirname(e.srcPath)])
        .deps()

      e.files = [e.srcPath, ...deps]
      return e
    })
  )

  watch(
    tasks,
    async tasks => {
      for (const task of tasks) {
        console.log(`${getTime()} Styles: Changed source:`, task.srcPath)
        try {
          await compile(task.srcPath, task.outputPath)
        } catch (err) {
          console.log(`${getTime()} Styles: Cannot build ${task.srcPath}:\n`, err)
        }
      }
    },
    (task, file) => {
      console.log(`${getTime()} Styles: File ${file} was renamed, restart this script`)
      tasks.forEach(t => t.watchers.forEach(w => w.close()))
    }
  )
}

/**
 * Compile provided entries
 */
async function compileStyles(entries) {
  let lastDir
  for (const entry of entries) {
    if (lastDir !== entry.outputDir) {
      lastDir = entry.outputDir
      try {
        await fs.promises.mkdir(entry.outputDir, { recursive: true })
      } catch (err) {
        console.log(`${getTime()} Styles: Cannot create dir ${entry.outputDir}:\n`, err)
      }
    }

    try {
      await compile(entry.srcPath, entry.outputPath)
    } catch (err) {
      console.log(`${getTime()} Styles: Cannot build ${entry.srcPath}:\n`, err)
    }
  }
}

/**
 * Compile stylus
 */
async function compile(srcPath, outputPath, srcContent) {
  return new Promise(async (res, rej) => {
    try {
      if (!srcContent) srcContent = await fs.promises.readFile(srcPath, 'utf-8')
      stylus(srcContent)
        .set('paths', [path.dirname(srcPath)])
        .render(async (err, css) => {
          if (!IS_DEV) {
            const { code } = await esbuild.transform(css, { minify: true, loader: 'css' })
            css = code
          }
          res(fs.promises.writeFile(outputPath, css))
        })
    } catch (err) {
      console.log(`${getTime()} Styles: Cannot build ${srcPath}`, err)
      rej(err)
    }
  })
}

/**
 * Get list of styles entries
 */
function getEntries() {
  const entries = []
  for (const srcPath of ENTRIES) {
    const outputPath = path.join(OUTPUT_DIR, path.basename(srcPath, '.styl') + '.css')
    entries.push({ srcPath, outputDir: OUTPUT_DIR, outputPath })
  }
  return entries
}

/**
 * Main
 */
async function main() {
  log('Styles: Building')

  if (IS_DEV) {
    await buildAndWatch()
    logOk('Styles: Watching')
  } else {
    await build()
    logOk('Styles: Done')
  }
}
main()
