import Utils from 'src/utils'
import { Stored, InstanceType } from 'src/types'
import { Info } from 'src/services/info'
import { Store } from './storage'

export async function loadPlatformInfo(): Promise<void> {
  const info = await browser.runtime.getPlatformInfo()
  Info.reactive.os = info.os
}

export async function loadBrowserInfo(): Promise<void> {
  const info = await browser.runtime.getBrowserInfo()
  Info.reactive.ffVer = parseInt(info.version.slice(0, 2))
  if (isNaN(Info.reactive.ffVer)) Info.reactive.ffVer = 0
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
}

export function getInstanceName(): string {
  if (Info.isSidebar) return 'sidebar'
  else if (Info.isBg) return 'bg'
  else if (Info.isSetup) return 'setup'
  else if (Info.isGroup) return 'group'
  else if (Info.isProxy) return 'proxy'
  else if (Info.isUrl) return 'url'
  else if (Info.isSearch) return 'search'
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
