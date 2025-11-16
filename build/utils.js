/* eslint no-console: off */
import fs from 'fs'
import path from 'path'
import ts from 'typescript'

export const IS_DEV = process.argv.includes('--dev')
export const ADDON_PATH = (IS_DEV && process.env.SIDEBERY_DEV_DIR) || path.resolve('./addon')
export const VUE_DIST = IS_DEV ? 'vue.runtime.esm-browser.js' : 'vue.runtime.esm-browser.prod.js'
export const FMT_HOST = {
  getCanonicalFileName: path => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}
const WATCH_DEBOUNCE_DELAY = 640

export function getTime() {
  const t = new Date()
  return `\x1b[90m${[t.getHours(), t.getMinutes(), t.getSeconds()]
    .map(t => `${t}`.padStart(2, '0'))
    .join(':')}\x1b[0m`
}

export async function treeToList(dir, list = []) {
  list.push({ dir })
  for await (const d of await fs.promises.opendir(dir)) {
    if (d.isDirectory()) await treeToList(path.join(dir, d.name), list)
    else if (d.isFile()) list.push({ dir, file: d.name })
  }
  return list
}

/**
 * Watch files
 * TODO: use chokidar?
 *
 * - tasks: { files: ['./path', ...], ... }[]
 * - onChange: (affectedTasks) => void
 * - onRename: (affectedTask, renamedFileOldPath) => void
 */
export function watch(tasks, onChange, onRename) {
  const ctx = {}
  ctx.timeout = null
  ctx.changed = {}

  for (const task of tasks) {
    if (!task.id) task.id = Math.random().toString(16)
    task.watchers = []
    for (const file of task.files) {
      const watcher = fs.watch(file)
      task.watchers.push(watcher)
      watcher.addListener('change', changeType => {
        if (changeType === 'rename') return onRename(task, file)

        ctx.changed[task.id] = task

        if (ctx.timeout) clearTimeout(ctx.timeout)
        ctx.timeout = setTimeout(() => {
          onChange(Object.values(ctx.changed))
          ctx.changed = {}
          ctx.timeout = null
        }, WATCH_DEBOUNCE_DELAY)
      })
    }
  }

  return ctx
}

export function colorize(str) {
  str = str.replace(/\|x\|/g, '\x1b[0m')
  str = str.replace(/\|w>/g, '\x1b[37m')
  str = str.replace(/\|_>/g, '\x1b[90m')
  str = str.replace(/\|r>/g, '\x1b[31m')
  str = str.replace(/\|y>/g, '\x1b[33m')
  str = str.replace(/\|g>/g, '\x1b[32m')
  str = str.replace(/\|b>/g, '\x1b[34m')
  str = str.replace(/\|m>/g, '\x1b[35m')
  str = str.replace(/\|c>/g, '\x1b[36m')
  str = str.replace(/\|B>/g, String.raw`\033[1m`)
  str = str.replace(/\|N>/g, String.raw`\033[0m`)

  return str
}

export function getTSConfig() {
  const path = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json')
  const readResult = ts.readConfigFile(path, ts.sys.readFile)
  if (readResult.error) throw new Error(ts.formatDiagnostic(readResult.error, FMT_HOST))

  const jsonConfig = readResult.config
  const convertResult = ts.convertCompilerOptionsFromJson(jsonConfig.compilerOptions, './')
  if (convertResult.error) throw new Error(ts.formatDiagnostic(convertResult.error, FMT_HOST))

  return convertResult.options
}

export function log(...args) {
  console.log(`${getTime()}`, ...args)
}

export function logOk(msg, ...args) {
  console.log(`${getTime()} ${`\x1b[32m${msg}\x1b[0m`}`, ...args)
}

export function logErr(msg, ...args) {
  console.log(`${getTime()} ${`\x1b[31m${msg}\x1b[0m`}`, ...args)
}
