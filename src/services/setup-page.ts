import * as Utils from 'src/utils'
import { DbgInfo, Stored, Bookmark, Container, PanelConfig, BackupData, Snapshot } from 'src/types'
import * as SetupPage from 'src/services/setup-page'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Settings } from 'src/services/settings'
import { SidebarConfigRState } from './sidebar-config'
import { Logs } from './_services'

export type SetupPageView =
  | 'settings'
  | 'menu_editor'
  | 'styles_editor'
  | 'snapshots'
  | 'storage'
  | 'keybindings'

export interface SetupPageNavOption {
  active: boolean
  name: string
  lvl: number
}

export interface StoragePropInfo {
  name: keyof Stored
  size: number
  sizeStr: string
  len: string
}

export interface SetupPageReactiveState {
  nav: SetupPageNavOption[]
  activeView: SetupPageView
  activeSection: string

  selectedContainer: Container | null
  selectedPanelConfig: PanelConfig | null

  detailsText: string
  detailsEdit?: (newValue: string) => void
  detailsTitle?: string
  detailsMode?: 'view' | 'edit'

  exportDialog: boolean
  importedData: BackupData | null

  permissions: string | boolean

  storageProps: StoragePropInfo[]
  storagePropsByName: Record<string, StoragePropInfo>
  storageOveral: string
  faviconsCache: { favicon: string; tooltip: string }[]
}

let isReady = false
let readyStateResolve: (() => void)[] = []
let navLockTimeout: number | undefined
const els: Record<string, HTMLElement> = {}

export const snapshotsViewer: {
  refresh?: (newSnapshots: Snapshot[]) => any
} = {}

export const state = {
  navLock: false,
}

export let reactive: SetupPageReactiveState = {
  nav: [
    { active: false, name: 'settings', lvl: 0 },
    { active: false, name: 'settings_general', lvl: 1 },
    { active: false, name: 'settings_menu', lvl: 1 },
    { active: false, name: 'settings_nav', lvl: 1 },
    { active: false, name: 'settings_group', lvl: 1 },
    { active: false, name: 'settings_containers', lvl: 1 },
    { active: false, name: 'settings_dnd', lvl: 1 },
    { active: false, name: 'settings_search', lvl: 1 },
    { active: false, name: 'settings_tabs', lvl: 1 },
    { active: false, name: 'settings_new_tab_position', lvl: 2 },
    { active: false, name: 'settings_pinned_tabs', lvl: 2 },
    { active: false, name: 'settings_tabs_tree', lvl: 2 },
    { active: false, name: 'settings_tabs_colorization', lvl: 2 },
    { active: false, name: 'settings_tabs_preview', lvl: 2 },
    { active: false, name: 'settings_tabs_native', lvl: 2 },
    { active: false, name: 'settings_bookmarks', lvl: 1 },
    { active: false, name: 'settings_history', lvl: 1 },
    { active: false, name: 'settings_appearance', lvl: 1 },
    { active: false, name: 'settings_mouse', lvl: 1 },
    { active: false, name: 'settings_mouse_nav', lvl: 2 },
    { active: false, name: 'settings_mouse_tabs', lvl: 2 },
    { active: false, name: 'settings_mouse_tabs_panel', lvl: 2 },
    { active: false, name: 'settings_mouse_new_tab_button', lvl: 2 },
    { active: false, name: 'settings_mouse_bookmarks', lvl: 2 },
    { active: false, name: 'settings_mouse_history', lvl: 2 },
    { active: false, name: 'settings_snapshots', lvl: 1 },
    { active: false, name: 'settings_sync', lvl: 1 },
    { active: false, name: 'settings_help', lvl: 1 },
    { active: false, name: 'keybindings', lvl: 0 },
    { active: false, name: 'menu_editor', lvl: 0 },
    { active: false, name: 'menu_editor_tabs', lvl: 1 },
    { active: false, name: 'menu_editor_tabs_panel', lvl: 1 },
    { active: false, name: 'menu_editor_bookmarks', lvl: 1 },
    { active: false, name: 'menu_editor_bookmarks_panel', lvl: 1 },
    { active: false, name: 'styles_editor', lvl: 0 },
    { active: false, name: 'snapshots', lvl: 0 },
  ],
  activeView: 'settings',
  activeSection: 'settings_general',

  selectedContainer: null,
  selectedPanelConfig: null,

  detailsText: '',
  detailsTitle: '',

  exportDialog: false,
  importedData: null,

  permissions: false,

  storageProps: [],
  storagePropsByName: {},
  storageOveral: '_',
  faviconsCache: [],
}

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initSetupPage(reactivate?: (rObj: object) => object) {
  if (!reactivate) return
  reactFn = reactivate as <T extends object>(rObj: T) => T
  reactive = reactFn(reactive)
}

export function setupListeners(): void {
  window.addEventListener('hashchange', updateActiveView)
}

export async function waitForInit(): Promise<void> {
  return new Promise(res => {
    if (isReady) res()
    else readyStateResolve.push(res)
  })
}

export function finishInitialization(): void {
  if (readyStateResolve) readyStateResolve.forEach(cb => cb())
  isReady = true
  readyStateResolve = []
}

/**
 * Open/activate settings page.
 */
export async function open(section?: string): Promise<void> {
  let url = browser.runtime.getURL('page.setup/setup.html')
  const existedTab = Tabs.list.find(t => t.url.startsWith(url))
  const activeTab = Tabs.byId[Tabs.activeId]
  let activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) {
    activePanel = Sidebar.panelsById[Sidebar.prevTabsPanelId]
  }
  if (!Utils.isTabsPanel(activePanel) && activeTab && !activeTab.pinned) {
    activePanel = Sidebar.panelsById[activeTab.panelId]
  }

  if (section) url += '#' + section
  if (existedTab) {
    if (existedTab.url === url) browser.tabs.update(existedTab.id, { active: true })
    else await browser.tabs.update(existedTab.id, { url, active: true })
  } else {
    if (
      activeTab &&
      activeTab.status === 'complete' &&
      !activeTab.pinned &&
      (activeTab.url === 'about:newtab' || activeTab.url === 'about:blank')
    ) {
      await browser.tabs.update(activeTab.id, { url, active: true })
    } else if (Utils.isTabsPanel(activePanel)) {
      Tabs.createTabInPanel(activePanel, { url })
    } else {
      browser.tabs.create({ url, windowId: Windows.id })
    }
  }
}

export function goToPerm(permId: string): void {
  document.title = 'Sidebery / Settings'
  SetupPage.reactive.activeView = 'settings'
  SetupPage.reactive.permissions = permId

  setTimeout(() => {
    const scrollHighlightConf: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
    const el = els[permId]
    if (el) el.scrollIntoView(scrollHighlightConf)
  }, 120)
}

export function closePermissionsPopup(): void {
  SetupPage.reactive.permissions = false
  location.hash = ''
}

/**
 * Check url hash and update active view
 */
export async function updateActiveView(): Promise<void> {
  let hash = location.hash ? location.hash.slice(1) : location.hash
  const hashArg = hash.split('.')
  hash = hashArg[0]
  const arg = hashArg[1]
  const scrollSectionConf: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }

  if (navLockTimeout) clearTimeout(navLockTimeout)
  SetupPage.state.navLock = true
  SetupPage.reactive.activeSection = hash
  navLockTimeout = setTimeout(() => {
    SetupPage.state.navLock = false
  }, 1250)

  if (hash === 'all-urls') return goToPerm('all_urls')
  if (hash === 'tab-hide') return goToPerm('tab_hide')
  if (hash === 'clipboard-write') return goToPerm('clipboard_write')
  if (hash === 'history') return goToPerm('history')
  if (hash === 'bookmarks') return goToPerm('bookmarks')

  if (hash.startsWith('menu_editor')) {
    setTimeout(
      () => els[hash]?.scrollIntoView(scrollSectionConf),
      SetupPage.reactive.activeView === 'menu_editor' ? 0 : 250
    )

    document.title = 'Sidebery / Menu Editor'
    SetupPage.reactive.activeView = 'menu_editor'
    SetupPage.reactive.permissions = false
    return
  }

  if (hash.startsWith('styles_editor')) {
    document.title = 'Sidebery / Styles Editor'
    SetupPage.reactive.activeView = 'styles_editor'
    SetupPage.reactive.activeSection = 'styles_editor'
    SetupPage.reactive.permissions = false
    return
  }

  if (hash.startsWith('snapshots')) {
    document.title = 'Sidebery / Snapshots'
    SetupPage.reactive.activeView = 'snapshots'
    SetupPage.reactive.activeSection = 'snapshots'
    SetupPage.reactive.permissions = false
    return
  }

  if (hash.startsWith('storage')) {
    document.title = 'Sidebery / Storage'
    SetupPage.reactive.activeView = 'storage'
    SetupPage.reactive.activeSection = 'storage'
    SetupPage.reactive.permissions = false
    return
  }

  if (hash.startsWith('keybindings')) {
    document.title = 'Sidebery / Keybindings'
    SetupPage.reactive.activeView = 'keybindings'
    SetupPage.reactive.activeSection = 'keybindings'
    SetupPage.reactive.permissions = false
    return
  }

  await waitForInit()

  setTimeout(
    () => {
      if (els[hash]) els[hash].scrollIntoView(scrollSectionConf)

      if (arg && hash === 'settings_containers') {
        setTimeout(() => {
          const container = Containers.reactive.byId[arg]
          if (container) SetupPage.reactive.selectedContainer = container
        }, 120)
      }

      if (arg && hash === 'settings_nav') {
        if (SetupPage.reactive.selectedPanelConfig) SetupPage.reactive.selectedPanelConfig = null
        setTimeout(() => {
          const panelConf = SidebarConfigRState.panels[arg]
          if (panelConf) SetupPage.reactive.selectedPanelConfig = panelConf
        }, 120)
      }
    },
    SetupPage.reactive.activeView === 'settings' ? 0 : 250
  )

  document.title = 'Sidebery / Settings'
  SetupPage.reactive.activeView = 'settings'
}

export function switchView(name: string): void {
  location.hash = name
}

/**
 * Register element for scroll navigation
 */
export function registerEl(name: string, el: HTMLElement | null): void {
  if (!el) return
  els[name] = el
}

export function updateActiveSection(scrollTop: number): void {
  const actView = SetupPage.reactive.activeView
  for (let opt, el, i = SetupPage.reactive.nav.length; i--; ) {
    opt = SetupPage.reactive.nav[i]
    if (!opt) continue

    el = els[opt.name]
    if (!el || !opt.name.startsWith(actView)) continue

    let offsetTop = el.offsetTop - 8
    if (opt.lvl === 2 && el.parentNode) {
      offsetTop += (el.parentNode as HTMLElement).offsetTop
    }
    if (scrollTop >= offsetTop) {
      SetupPage.reactive.activeSection = opt.name
      break
    }
  }
}

/**
 * Get debug details
 */
export async function getDbgDetails(): Promise<DbgInfo> {
  const dbg: DbgInfo = {
    addonVersion: browser.runtime.getManifest().version,
    firefoxVersion: (await browser.runtime.getBrowserInfo()).version,
    settings: Utils.cloneObject(Settings.state),
  }

  try {
    const perms = await Promise.all([
      browser.permissions.contains({ origins: ['<all_urls>'] }),
      browser.permissions.contains({ permissions: ['webRequest'] }),
      browser.permissions.contains({ permissions: ['webRequestBlocking'] }),
      browser.permissions.contains({ permissions: ['proxy'] }),
      browser.permissions.contains({ permissions: ['tabHide'] }),
      browser.permissions.contains({ permissions: ['clipboardWrite'] }),
      browser.permissions.contains({ permissions: ['history'] }),
      browser.permissions.contains({ permissions: ['bookmarks'] }),
      browser.permissions.contains({ permissions: ['downloads'] }),
    ])
    dbg.permissions = {
      allUrls: perms[0],
      webRequest: perms[1],
      webRequestBlocking: perms[2],
      proxy: perms[3],
      tabHide: perms[4],
      clipboardWrite: perms[5],
      history: perms[6],
      bookmarks: perms[7],
      downloads: perms[8],
    }
  } catch (err) {
    dbg.permissions = (err as Error).toString()
  }

  try {
    const stored = await browser.storage.local.get<Stored>()
    dbg.storage = {
      size: Utils.strSize(JSON.stringify(stored)),
      props: {},
    }
    for (const prop of Object.keys(stored) as (keyof Stored)[]) {
      dbg.storage.props[prop] = Utils.strSize(JSON.stringify(stored[prop]))
    }
  } catch (err) {
    dbg.storage = (err as Error).toString()
  }

  try {
    const stored = await browser.storage.local.get<Stored>('sidebar')
    if (stored.sidebar) {
      for (const panel of Object.values(stored.sidebar.panels)) {
        panel.name = `len: ${panel.name.length}`
        if (panel.iconIMGSrc) panel.iconIMGSrc = `len: ${panel.iconIMGSrc.length}`
        if (panel.iconIMG) panel.iconIMG = `len: ${panel.iconIMG.length}`
      }
      dbg.sidebar = stored.sidebar
    }
  } catch (err) {
    dbg.sidebar = (err as Error).toString()
  }

  try {
    const { containers } = await browser.storage.local.get<Stored>('containers')
    if (containers) {
      dbg.containers = []
      for (const container of Object.values(containers)) {
        const clone = Utils.cloneObject(container)
        if (clone.name) clone.name = clone.name.length.toString()
        if (clone.icon) clone.icon = '...'
        if (clone.proxy) clone.proxy = { type: clone.proxy.type }
        if (clone.reopenRules) clone.reopenRules.forEach(r => (r.url = '...'))
        if (clone.userAgent) clone.userAgent = clone.userAgent.length.toString()
        dbg.containers.push(clone)
      }
    }
  } catch (err) {
    dbg.containers = (err as Error).toString()
  }

  try {
    const s = await browser.storage.local.get<Stored>(['sidebarCSS', 'groupCSS'])
    if (s.sidebarCSS) dbg.sidebarCSSLen = s.sidebarCSS.length.toString()
    if (s.groupCSS) dbg.groupCSSLen = s.groupCSS.length.toString()
  } catch (err) {
    // nothing...
  }

  try {
    const windows = await browser.windows.getAll({ populate: true })
    dbg.windows = []
    for (const w of windows) {
      dbg.windows.push({
        state: w.state,
        incognito: w.incognito,
        tabsCount: w.tabs?.length ?? -1,
      })
    }
  } catch (err) {
    dbg.windows = (err as Error).toString()
  }

  try {
    const s = await browser.storage.local.get<Stored>('contextMenu')
    if (s.contextMenu) dbg.contextMenu = Utils.clone(s.contextMenu)
  } catch (err) {
    dbg.contextMenu = (err as Error).toString()
  }

  try {
    const bookmarks = (await browser.bookmarks.getTree()) as Bookmark[]
    let bookmarksCount = 0
    let foldersCount = 0
    let separatorsCount = 0
    let lvl = 0,
      maxDepth = 0
    const walker = (nodes: Bookmark[]) => {
      if (lvl > maxDepth) maxDepth = lvl
      for (const node of nodes) {
        if (node.type === 'bookmark') bookmarksCount++
        if (node.type === 'folder') foldersCount++
        if (node.type === 'separator') separatorsCount++
        if (node.children) {
          lvl++
          walker(node.children)
          lvl--
        }
      }
    }
    if (bookmarks[0]?.children) walker(bookmarks[0].children)

    dbg.bookmarks = {
      bookmarksCount,
      foldersCount,
      separatorsCount,
      maxDepth,
    }
  } catch (err) {
    dbg.bookmarks = (err as Error).toString()
  }

  return dbg
}

export function copyDevtoolsUrl(): void {
  const url = 'about:devtools-toolbox?id=%7B3c078156-979c-498b-8990-85f7987dd929%7D&type=extension'
  navigator.clipboard.writeText(url)
}

export async function calcStorageInfo(): Promise<void> {
  let stored: Stored
  try {
    stored = await browser.storage.local.get<Stored>()
  } catch (err) {
    return
  }

  let overalSize = 0
  SetupPage.reactive.storagePropsByName = {}
  SetupPage.reactive.storageProps = (Object.keys(stored) as (keyof Stored)[])
    .map(key => {
      const value = stored[key as keyof Stored]
      const size = new Blob([JSON.stringify(value)]).size
      overalSize += size
      const len = Array.isArray(value) ? value.length.toString() : ''
      const prop = { name: key, size, len, sizeStr: Utils.sizeToString(size) }
      SetupPage.reactive.storagePropsByName[key] = prop
      return prop
    })
    .sort((a, b) => b.size - a.size)
  SetupPage.reactive.storageOveral = Utils.sizeToString(overalSize)

  SetupPage.reactive.faviconsCache = []
  if (stored.favicons_01 && stored.favDomains) {
    const fullList = [
      ...(stored.favicons_01 ?? []),
      ...(stored.favicons_02 ?? []),
      ...(stored.favicons_03 ?? []),
      ...(stored.favicons_04 ?? []),
      ...(stored.favicons_05 ?? []),
    ]
    const favsDomainsInfo: { domain: string; index: number; len: number }[][] = []
    for (const d of Object.keys(stored.favDomains)) {
      const domainInfo = stored.favDomains[d]
      const fdi = favsDomainsInfo[domainInfo.index]
      if (fdi) fdi.push({ domain: d, ...domainInfo })
      else favsDomainsInfo[domainInfo.index] = [{ domain: d, ...domainInfo }]
    }
    for (let fav, domains, i = 0; i < fullList.length; i++) {
      fav = fullList[i]
      domains = favsDomainsInfo[i]
      const tooltipInfo = []
      if (fav) {
        tooltipInfo.push(`${fav.substring(0, 32)}...\nSize: ${Utils.sizeToString(fav.length)}`)
      }
      if (domains?.length) {
        const index = domains[0].index
        tooltipInfo.push(`Index: ${index}`)

        for (const domain of domains) {
          tooltipInfo.push(`Domain: ${domain.domain} | src url len: ${domain.len}`)
        }
      }
      SetupPage.reactive.faviconsCache.push({ favicon: fav, tooltip: tooltipInfo.join('\n') })
    }
  }
}

export async function updStorageInfo<T extends keyof Stored>(propKey: T, propData?: Stored[T]) {
  if (!propData) {
    let stored
    try {
      stored = await browser.storage.local.get<Stored>(propKey).catch(() => ({}) as Stored)
    } catch (err) {
      Logs.err(`SetupPage.updStorageInfo: Cannot get propData for "${propKey}"`, err)
      return
    }
    propData = stored[propKey]
  }

  if (propData === undefined) {
    // Removed
    delete SetupPage.reactive.storagePropsByName[propKey]
    const index = SetupPage.reactive.storageProps.findIndex(p => p.name === propKey)
    if (index !== -1) SetupPage.reactive.storageProps.splice(index, 1)
  } else {
    const info = SetupPage.reactive.storagePropsByName[propKey]
    if (!info) {
      // Added
      const size = new Blob([JSON.stringify(propData)]).size
      const len = Array.isArray(propData) ? propData.length.toString() : ''
      const prop = { name: propKey, size, len, sizeStr: Utils.sizeToString(size) }
      SetupPage.reactive.storagePropsByName[propKey] = prop
      SetupPage.reactive.storageProps.push(prop)
    } else {
      // Changed
      info.size = new Blob([JSON.stringify(propData)]).size
      info.sizeStr = Utils.sizeToString(info.size)
      info.len = Array.isArray(propData) ? propData.length.toString() : ''
    }
  }

  SetupPage.reactive.storageProps = SetupPage.reactive.storageProps.sort((a, b) => b.size - a.size)
  const size = SetupPage.reactive.storageProps.reduce((a, v) => a + v.size, 0)
  SetupPage.reactive.storageOveral = Utils.sizeToString(size)
}
