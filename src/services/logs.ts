/* eslint no-console: off */
import { Windows } from 'src/services/windows'
import { Info } from './info'
import { Settings } from './settings'

export const Logs = {
  info,
  warn,
  err,
}

function info<T extends Array<any>>(msg: string, ...args: T): void {
  if (Settings.reactive.logLvl < 3) return

  if (Info.isBg) console.log(`[bg] ${msg}`, ...args)
  else if (Info.isSidebar) console.log(`[sidebar:${Windows.id}] ${msg}`, ...args)
  else if (Info.isSetup) console.log(`[setup:${Windows.id}] ${msg}`, ...args)
  else if (Info.isGroup) console.log(`[group:${Windows.id}] ${msg}`, ...args)
  else if (Info.isUrl) console.log(`[url:${Windows.id}] ${msg}`, ...args)
  else console.log(`[unknown] ${msg}`, ...args)
}

function warn<T extends Array<any>>(msg: string, ...args: T): void {
  if (Settings.reactive.logLvl < 2) return

  if (Info.isBg) console.warn(`[bg] ${msg}`, ...args)
  else if (Info.isSidebar) console.warn(`[sidebar:${Windows.id}] ${msg}`, ...args)
  else if (Info.isSetup) console.warn(`[setup:${Windows.id}] ${msg}`, ...args)
  else if (Info.isGroup) console.warn(`[group:${Windows.id}] ${msg}`, ...args)
  else if (Info.isUrl) console.warn(`[url:${Windows.id}] ${msg}`, ...args)
  else console.warn(`[unknown] ${msg}`, ...args)
}

function err(msg: string, err?: unknown): void {
  if (Settings.reactive.logLvl < 1) return

  if (Info.isBg) msg = `[bg] ${msg}\n`
  else if (Info.isSidebar) msg = `[sidebar:${Windows.id}] ${msg}\n`
  else if (Info.isSetup) msg = `[setup:${Windows.id}] ${msg}\n`
  else if (Info.isGroup) msg = `[group:${Windows.id}] ${msg}\n`
  else if (Info.isUrl) msg = `[url:${Windows.id}] ${msg}\n`
  else msg = `[unknown] ${msg}\n`

  if (err !== undefined) console.error(msg, err)
  else console.error(msg)
}
