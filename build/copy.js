/* eslint no-console: off */
const fs = require('fs')
const path = require('path')
const { IS_DEV, ADDON_PATH, treeToList, watch, log, logOk, VUE_DIST, logErr } = require('./utils')

const COPY = {
  './src/manifest.json': {
    path: `${ADDON_PATH}/`,
    handler: handleManifest,
  },
  './src/_locales/dict.browser.json': {
    path: `${ADDON_PATH}/_locales/`,
    handler: handleLocales,
  },
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
    let dstPath
    if (typeof dst === 'string') dstPath = dst
    else {
      dstPath = dst.path
      if (dst.handler) info.srcHandler = dst.handler
    }

    info.dst = path.resolve(dstPath)
    if (dstPath.endsWith('/')) {
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

      if (f.file) {
        const srcPath = path.join(f.dir, f.file)
        const dstPath = path.join(destDir, f.file)
        if (info.srcHandler) await info.srcHandler(srcPath, dstPath)
        else await fs.promises.copyFile(srcPath, dstPath)
      } else await fs.promises.mkdir(destDir, { recursive: true })
    }
  } else {
    if (info.srcHandler) await info.srcHandler(info.src, info.dst)
    else await fs.promises.copyFile(info.src, info.dst)
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

async function handleManifest(srcPath, dstPath) {
  const forChromium = process.argv.includes('--chromium')

  // Parse and patch manifest for chromium-based browser
  if (forChromium) {
    const srcData = await fs.promises.readFile(srcPath, 'utf-8')
    const data = JSON.parse(srcData)

    // Remove unsupported keys
    delete data.page_action
    delete data.browser_specific_settings

    // Reset commands
    for (const key of Object.keys(data.commands)) {
      const cmd = data.commands[key]
      if (key === '_execute_sidebar_action') {
        cmd.suggested_key.windows = cmd.suggested_key.default
      } else {
        delete cmd.suggested_key
      }
    }

    // Clean up permissions
    const contextualIdentitiesIndex = data.permissions.indexOf('contextualIdentities')
    if (contextualIdentitiesIndex !== -1) data.permissions.splice(contextualIdentitiesIndex, 1)
    const menusIndex = data.permissions.indexOf('menus')
    if (menusIndex !== -1) data.permissions.splice(menusIndex, 1)
    const menusOverrideContextIndex = data.permissions.indexOf('menus.overrideContext')
    if (menusOverrideContextIndex !== -1) data.permissions.splice(menusOverrideContextIndex, 1)
    const tabHideIndex = data.permissions.indexOf('tabHide')
    if (tabHideIndex !== -1) data.permissions.splice(tabHideIndex, 1)
    const proxyIndex = data.optional_permissions.indexOf('proxy')
    if (proxyIndex !== -1) data.optional_permissions.splice(proxyIndex, 1)
    data.permissions.push('proxy')

    const dstData = JSON.stringify(data)
    await fs.promises.writeFile(dstPath, dstData)
  }

  // Copy
  else {
    return fs.promises.copyFile(srcPath, dstPath)
  }
}

async function handleLocales(srcPath, dstPath) {
  const dirPath = path.dirname(dstPath)
  const srcData = await fs.promises.readFile(srcPath, 'utf-8')
  const jsonData = JSON.parse(srcData)

  const langs = {}

  for (const key of Object.keys(jsonData)) {
    const dict = jsonData[key]
    if (!dict || typeof dict !== 'object') {
      logErr(`Copy: Locales: No dictionary for: ${key}`)
      break
    }

    for (const lang of Object.keys(dict)) {
      if (!langs[lang]) langs[lang] = {}
      langs[lang][key] = { message: dict[lang] }
    }
  }

  for (const lang of Object.keys(langs)) {
    const dict = langs[lang]
    const jsonStr = JSON.stringify(dict)
    await fs.promises.writeFile(path.join(dirPath, `${lang}.messages.json`), jsonStr)
  }
}
