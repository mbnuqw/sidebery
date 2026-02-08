import { Stored, Reactivator } from 'src/types'
import { InstanceType } from 'src/enums'
import { NOID } from 'src/defaults'
import * as Logs from 'src/services/logs'

interface InfoState {
  os: string
  addonVer: string
}

export let instanceType = InstanceType.unknown
export let isSidebar = false
export let isSetup = false
export let isGroup = false
export let isProxy = false
export let isUrl = false
export let isBg = false
export let isSearch = false
export let isEditing = false
export let isPreview = false
export let isSync = false
export let isPanelConfig = false

export let majorVersion: number | undefined = undefined
export let prevMajorVersion: number | undefined = undefined
export let prevVersion: string | undefined = undefined

export let currentTabId = NOID

export let reactive: InfoState = {
  os: 'unknown',
  addonVer: browser.runtime.getManifest().version,
}

export function reactivate(r: Reactivator<InfoState>) {
  reactive = r(reactive)
}

export async function loadPlatformInfo(): Promise<void> {
  const info = await browser.runtime.getPlatformInfo()
  reactive.os = info.os
}

export async function loadVersionInfo(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('ver')

  // Get major versions
  if (stored.ver) {
    prevMajorVersion = getMajVer(stored.ver)
    prevVersion = stored.ver
  }
  majorVersion = getMajVer(reactive.addonVer)
}

export function setInstanceType(t: InstanceType): void {
  instanceType = t
  if (t === InstanceType.sidebar) isSidebar = true
  else if (t === InstanceType.group) isGroup = true
  else if (t === InstanceType.setup) isSetup = true
  else if (t === InstanceType.bg) isBg = true
  else if (t === InstanceType.url) isUrl = true
  else if (t === InstanceType.proxy) isProxy = true
  else if (t === InstanceType.search) isSearch = true
  else if (t === InstanceType.editing) isEditing = true
  else if (t === InstanceType.preview) isPreview = true
  else if (t === InstanceType.sync) isSync = true
  else if (t === InstanceType.panelConfig) isPanelConfig = true
}

export function getInstanceName(instance?: InstanceType): string {
  if (instance === InstanceType.sidebar) return 'sidebar'
  else if (instance === InstanceType.bg) return 'bg'
  else if (instance === InstanceType.setup) return 'setup'
  else if (instance === InstanceType.group) return 'group'
  else if (instance === InstanceType.proxy) return 'proxy'
  else if (instance === InstanceType.url) return 'url'
  else if (instance === InstanceType.search) return 'search'
  else if (instance === InstanceType.editing) return 'editing'
  else if (instance === InstanceType.preview) return 'preview'
  else if (instance === InstanceType.sync) return 'sync'
  else if (instance === InstanceType.panelConfig) return 'panel-config'
  return 'unknown'
}

export function getMajVer(verStr?: string): number | undefined {
  if (!verStr) return
  const num = parseInt(verStr)
  if (isNaN(num)) return
  else return num
}

export function getProfileId() {
  return browser.runtime.getURL('').slice(16, 52)
}

export function isFreshInstall(): boolean {
  return !prevMajorVersion
}

export function isMajorUpgrade(): boolean {
  if (prevMajorVersion === undefined) return false
  if (majorVersion === undefined) return false

  return prevMajorVersion !== majorVersion
}

export async function loadCurrentTabInfo(): Promise<void> {
  const tab = await browser.tabs.getCurrent()
  currentTabId = tab.id
}

export function versionToInt(version: string): number {
  const parsed = version.split('.').map(n => parseInt(n))
  const major = isNaN(parsed[0]) ? 0 : parsed[0]
  const minor = isNaN(parsed[1]) ? 0 : parsed[1]
  const patch = isNaN(parsed[2]) ? 0 : parsed[2]
  const nightly = isNaN(parsed[3]) ? 0 : parsed[3]
  return nightly + patch * 1_000 + minor * 1_000_000 + major * 1_000_000_000
}
