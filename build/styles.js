/* eslint no-console: off */
const fs = require('fs')
const path = require('path')
const stylus = require('stylus')
const csso = require('csso')
const { IS_DEV, ADDON_PATH, getTime, watch, log, logOk } = require('./utils')

const OUTPUT_DIR = `${ADDON_PATH}/themes`
const THEMES = {
  proton: [
    './src/styles/themes/proton/sidebar/sidebar.styl',
    './src/styles/themes/proton/page.url/url.styl',
    './src/styles/themes/proton/page.group/group.styl',
    './src/styles/themes/proton/page.setup/setup.styl',
    './src/styles/themes/proton/popup.proxy/proxy.styl',
  ],
}

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
          if (!IS_DEV) css = csso.minify(css, { restructure: false }).css
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
  for (const name of Object.keys(THEMES)) {
    const styles = THEMES[name]
    const outputDir = path.join(OUTPUT_DIR, name)
    for (const srcPath of styles) {
      const outputPath = path.join(outputDir, path.basename(srcPath, '.styl') + '.css')
      entries.push({ srcPath, outputDir, outputPath })
    }
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
