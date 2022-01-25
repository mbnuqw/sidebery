/* eslint no-console: off */
const fs = require('fs')
const path = require('path')
const {
  IS_DEV,
  ADDON_PATH,
  getTime,
  treeToList,
  watch,
  colorize,
  log,
  logOk,
  logErr,
} = require('./utils')

const SRC_DIR = './src'
const OUTPUT_DIR = ADDON_PATH

const SVG_RE = /<inject>svg:\/\/(.+?)(#(.+))?<\/inject>/g
const SVG_ID_RE = /<svg([^<]*?)id="([^<]*?)"/
const SVG_TAG_RE = /<svg /
const NORM_SRC_DIR = path.normalize(SRC_DIR)

/**
 * Build
 */
async function build() {
  const entries = (await treeToList(SRC_DIR)).filter(e => e.file && e.file.endsWith('.html'))

  for (const info of entries) {
    await processFile(info)
  }
}

/**
 * Build and watch
 */
async function buildAndWatch() {
  const entries = (await treeToList(SRC_DIR)).filter(e => e.file && e.file.endsWith('.html'))

  for (const info of entries) {
    await processFile(info)
  }

  const tasks = entries.map(e => {
    e.files = [path.join(e.dir, e.file)]
    return e
  })

  watch(
    tasks,
    async tasks => {
      for (const task of tasks) {
        console.log(`${getTime()} HTML: Changed source:`, task.file)
        await processFile(task)
      }
    },
    (task, file) => {
      console.log(`${getTime()} HTML: File ${file} was renamed, restart this script`)
      tasks.forEach(t => t.watchers.forEach(w => w.close()))
    }
  )
}

/**
 * Process HTML file - inline svgs
 */
async function processFile(info) {
  const outputDir = path.join(OUTPUT_DIR, info.dir.replace(NORM_SRC_DIR, ''))
  const srcData = await fs.promises.readFile(path.join(info.dir, info.file), 'utf-8')
  const svgs = {}

  let m
  while ((m = SVG_RE.exec(srcData))) {
    if (!m[1]) {
      console.log(colorize(`${getTime()} |r>HTML: Wrong svg inject in |_>${info.file}|x|`))
      return
    }
    svgs[m[1]] = { path: m[1], id: m[3] }
  }

  for (const svg of Object.values(svgs)) {
    if (!svg.id) continue
    try {
      const c = await fs.promises.readFile(svg.path, 'utf-8')
      if (SVG_ID_RE.test(c)) {
        svg.content = c.replace(SVG_ID_RE, (m, p1) => `<svg${p1}id="${svg.id}"`)
      } else {
        svg.content = c.replace(SVG_TAG_RE, `<svg id="${svg.id}" `)
      }
    } catch (err) {
      logErr(`HTML: ${err.toString()}`)
      return m
    }
  }

  const outData = srcData.replace(SVG_RE, (m, p1) => svgs[p1].content ?? m)
  await fs.promises.mkdir(outputDir, { recursive: true })
  await fs.promises.writeFile(path.join(outputDir, info.file), outData)
}

/**
 * Main
 */
async function main() {
  log('HTML: Building')

  if (IS_DEV) {
    await buildAndWatch()
    logOk('HTML: Watching')
  } else {
    await build()
    logOk('HTML: Done')
  }
}
main()
