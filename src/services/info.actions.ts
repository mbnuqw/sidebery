import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import { Stored, InstanceType } from 'src/types'
import { Info } from 'src/services/info'
import { Store } from './storage'

export async function loadPlatformInfo(): Promise<void> {
  const info = await browser.runtime.getPlatformInfo()
  Info.reactive.os = info.os
}

export async function loadVersionInfo(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>(['ver', 'favAutoCleanTime'])

  // Check old versions
  if (!stored.ver && stored.favAutoCleanTime) stored.ver = '4.0.0'

  // Get major versions
  if (stored.ver) {
    Info.prevMajorVersion = Info.getMajVer(stored.ver)
    Info.prevVersion = stored.ver
  }
  Info.majorVersion = Info.getMajVer(Info.reactive.addonVer)
}

export function saveVersion(): void {
  if (Info.prevVersion !== Info.reactive.addonVer) {
    Store.set({ ver: Info.reactive.addonVer }, 500)
  }
}

export function setInstanceType(t: InstanceType): void {
  Info.instanceType = t
  if (t === InstanceType.sidebar) Info.isSidebar = true
  else if (t === InstanceType.group) Info.isGroup = true
  else if (t === InstanceType.setup) Info.isSetup = true
  else if (t === InstanceType.bg) Info.isBg = true
  else if (t === InstanceType.url) Info.isUrl = true
  else if (t === InstanceType.proxy) Info.isProxy = true
  else if (t === InstanceType.search) Info.isSearch = true
  else if (t === InstanceType.preview) Info.isPreview = true
}

export function getInstanceName(instance?: InstanceType): string {
  if (instance === InstanceType.sidebar) return 'sidebar'
  else if (instance === InstanceType.bg) return 'bg'
  else if (instance === InstanceType.setup) return 'setup'
  else if (instance === InstanceType.group) return 'group'
  else if (instance === InstanceType.proxy) return 'proxy'
  else if (instance === InstanceType.url) return 'url'
  else if (instance === InstanceType.search) return 'search'
  else if (instance === InstanceType.preview) return 'preview'
  return 'unknown'
}

export function getMajVer(verStr?: string): number | undefined {
  if (!verStr) return
  const num = parseInt(verStr)
  if (isNaN(num)) return
  else return num
}

export async function getProfileId(): Promise<string> {
  let { profileID } = await browser.storage.local.get<Stored>('profileID')
  if (!profileID) {
    profileID = Utils.uid()
    Store.set({ profileID })
  }
  return profileID
}

export function isFreshInstall(): boolean {
  return !Info.prevMajorVersion
}

export function isMajorUpgrade(): boolean {
  if (Info.prevMajorVersion === undefined) return false
  if (Info.majorVersion === undefined) return false

  return Info.prevMajorVersion !== Info.majorVersion
}

export async function loadCurrentTabInfo(): Promise<void> {
  const tab = await browser.tabs.getCurrent()
  Info.currentTabId = tab.id
}

export function versionToInt(version: string): number {
  const parsed = version.split('.').map(n => parseInt(n))
  const major = isNaN(parsed[0]) ? 0 : parsed[0]
  const minor = isNaN(parsed[1]) ? 0 : parsed[1]
  const patch = isNaN(parsed[2]) ? 0 : parsed[2]
  const nightly = isNaN(parsed[3]) ? 0 : parsed[3]
  return nightly + patch * 1_000 + minor * 1_000_000 + major * 1_000_000_000
}
