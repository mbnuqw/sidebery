/* eslint no-console: off */
const fs = require('fs')
const path = require('path')
const { IS_DEV, ADDON_PATH, treeToList, watch, log, logOk, VUE_DIST } = require('./utils')

const COPY = {
  './src/manifest.json': `${ADDON_PATH}/`,
  './src/_locales/en.messages.json': `${ADDON_PATH}/_locales/en/messages.json`,
  './src/_locales/ru.messages.json': `${ADDON_PATH}/_locales/ru/messages.json`,
  './src/assets/bg': `${ADDON_PATH}/assets/bg`,
  './src/assets/logo-native-dark.svg': `${ADDON_PATH}/assets/`,
  './src/assets/logo-native-light.svg': `${ADDON_PATH}/assets/`,
  './src/assets/logo-native.svg': `${ADDON_PATH}/assets/`,
  './src/assets/logo.svg': `${ADDON_PATH}/assets/`,
  './src/assets/snapshot-native.svg': `${ADDON_PATH}/assets/`,
  './src/assets/proxy-native.svg': `${ADDON_PATH}/assets/`,
  [`./node_modules/vue/dist/${VUE_DIST}`]: `${ADDON_PATH}/vendor/`,
}

/**
 * ...
 */
async function build() {
  const entries = await parseEntries()
  await copyAllEntries(entries)
}

/**
 * ...
 */
async function copyAndWatch() {
  const entries = await parseEntries()
  await copyAllEntries(entries)

  const tasks = entries
    .filter(e => !e.isDir)
    .map(e => {
      e.files = [e.src]
      return e
    })

  watch(
    tasks,
    affectedTasks => changeHandler(affectedTasks),
    (task, file) => {
      log(`Copy: File ${file} was renamed, restart this script`)
      tasks.forEach(t => t.watchers.forEach(w => w.close()))
    }
  )
}

/**
 * ...
 */
async function changeHandler(changedFiles) {
  for (const info of changedFiles) {
    log(`Copy: Changed source: ${info.src}`)
    await fs.promises.copyFile(info.src, info.dst)
  }
}

/**
 * ...
 */
async function parseEntries() {
  const entriesInfo = []
  for (const src of Object.keys(COPY)) {
    const srcStats = await fs.promises.stat(src)
    const info = { src, isDir: srcStats.isDirectory() }

    const dst = COPY[src]
    info.dst = path.resolve(dst)
    if (dst.endsWith('/')) {
      info.destDir = info.dst
      if (!info.isDir) info.dst = path.join(info.dst, path.basename(src))
    } else {
      info.destDir = path.dirname(info.dst)
    }

    entriesInfo.push(info)
  }
  return entriesInfo
}

/**
 * ...
 */
async function copyAllEntries(entries) {
  for (const info of entries) {
    await copyEntry(info)
  }
}

/**
 * ...
 */
async function copyEntry(info) {
  await fs.promises.mkdir(info.destDir, { recursive: true })

  const normSrc = path.normalize(info.src)

  if (info.isDir) {
    for (const f of await treeToList(normSrc)) {
      const destDir = path.normalize(f.dir.replace(normSrc, info.dst + path.sep))

      if (f.file) await fs.promises.copyFile(path.join(f.dir, f.file), path.join(destDir, f.file))
      else await fs.promises.mkdir(destDir, { recursive: true })
    }
  } else {
    await fs.promises.copyFile(info.src, info.dst)
  }
}

/**
 * Main
 */
function main() {
  log('Copy: Copying')

  if (IS_DEV) {
    copyAndWatch()
    logOk('Copy: Watching')
  } else {
    build()
    logOk('Copy: Done')
  }
}
main()
