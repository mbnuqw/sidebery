import Utils from 'src/utils'
import { DbgInfo, Stored, Bookmark } from 'src/types'
import { SetupPage } from 'src/services/setup-page'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Settings } from 'src/services/settings'

let isReady = false
let readyStateResolve: (() => void) | undefined
let navLockTimeout: number | undefined
const els: Record<string, HTMLElement> = {}

/**
 * Open/activate settings page.
 */
export async function open(section?: string): Promise<void> {
  let url = browser.runtime.getURL('page.setup/setup.html')
  const existedTab = Tabs.list.find(t => t.url.startsWith(url))
  const activeTab = Tabs.byId[Tabs.activeId]
  let activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) {
    activePanel = Sidebar.reactive.panelsById[Sidebar.lastTabsPanelId]
  }
  if (!Utils.isTabsPanel(activePanel) && activeTab && !activeTab.pinned) {
    activePanel = Sidebar.reactive.panelsById[activeTab.panelId]
  }

  if (section) url += '#' + section
  if (existedTab) {
    if (existedTab.url === url) browser.tabs.update(existedTab.id, { active: true })
    else await browser.tabs.update(existedTab.id, { url, active: true })
  } else {
    if (
      activeTab &&
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
  SetupPage.reactive.navLock = true
  SetupPage.reactive.activeSection = hash
  navLockTimeout = setTimeout(() => {
    SetupPage.reactive.navLock = false
  }, 1250)

  await waitForInit()

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
        setTimeout(() => {
          const panel = Sidebar.reactive.panels.find(p => p.id === arg)
          if (panel) SetupPage.reactive.selectedPanel = panel
        }, 120)
      }
    },
    SetupPage.reactive.activeView === 'settings' ? 0 : 250
  )

  document.title = 'Sidebery / Settings'
  SetupPage.reactive.activeView = 'settings'
}

async function waitForInit(): Promise<void> {
  return new Promise(res => {
    if (isReady) res()
    else readyStateResolve = res
  })
}

export function initialized(): void {
  if (readyStateResolve) readyStateResolve()
  isReady = true
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

export function setupListeners(): void {
  window.addEventListener('hashchange', updateActiveView)
}

export function updateActiveSection(scrollTop: number): void {
  for (let name, el, i = SetupPage.reactive.nav.length; i--; ) {
    name = SetupPage.reactive.nav[i]?.name
    el = els[name]
    if (!name || !el || !name.startsWith(SetupPage.reactive.activeView)) continue

    if (scrollTop >= el.offsetTop - 8) {
      SetupPage.reactive.activeSection = name
      break
    }
  }
}

/**
 * Get debug details
 */
export async function getDbgDetails(): Promise<DbgInfo> {
  const dbg: DbgInfo = { settings: Utils.cloneObject(Settings.reactive) }

  try {
    const [allUrls, tabHide, clipboardWrite, webRequest, wrBlocking] = await Promise.all([
      browser.permissions.contains({ origins: ['<all_urls>'] }),
      browser.permissions.contains({ permissions: ['tabHide'] }),
      browser.permissions.contains({ permissions: ['clipboardWrite'] }),
      browser.permissions.contains({ permissions: ['webRequest'] }),
      browser.permissions.contains({ permissions: ['webRequestBlocking'] }),
    ])
    dbg.permissions = {
      allUrls,
      tabHide,
      clipboardWrite,
      webRequest,
      webRequestBlocking: wrBlocking,
    }
  } catch (err) {
    dbg.permissions = (err as Error).toString()
  }

  try {
    // let stored = await storage.get()
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
        if (Utils.isTabsPanel(panel) && panel.urlRules) {
          panel.urlRules = `len: ${panel.urlRules.length}`
        }
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
        if (clone.includeHosts) clone.includeHosts = clone.includeHosts.length.toString()
        if (clone.excludeHosts) clone.excludeHosts = clone.excludeHosts.length.toString()
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
    const s = await browser.storage.local.get<Stored>([
      'tabsMenu',
      'bookmarksMenu',
      'tabsPanelMenu',
      'bookmarksPanelMenu',
    ])
    if (s.tabsMenu) dbg.tabsMenu = s.tabsMenu
    if (s.bookmarksMenu) dbg.bookmarksMenu = s.bookmarksMenu
    if (s.tabsPanelMenu) dbg.tabsPanelMenu = s.tabsPanelMenu
    if (s.bookmarksPanelMenu) dbg.bookmarksPanelMenu = s.bookmarksPanelMenu
  } catch (err) {
    dbg.tabsMenu = (err as Error).toString()
    dbg.bookmarksMenu = (err as Error).toString()
    dbg.tabsPanelMenu = (err as Error).toString()
    dbg.bookmarksPanelMenu = (err as Error).toString()
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
