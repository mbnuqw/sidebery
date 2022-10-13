import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { PanelConfig, Panel, Stored, ItemBounds, Tab, Bookmark, DstPlaceInfo } from 'src/types'
import { Notification, OldPanelConfig, SidebarConfig, BookmarksPanelConfig } from 'src/types'
import { PanelType, TabsPanel, BookmarksPanel, ScrollBoxComponent } from 'src/types'
import { TabsPanelConfig, ItemBoundsType, ReactiveTab, DialogConfig } from 'src/types'
import { BOOKMARKS_PANEL_STATE, TABS_PANEL_STATE, NOID, CONTAINER_ID, Err } from 'src/defaults'
import { BOOKMARKS_PANEL, TABS_PANEL_CONFIG, DEFAULT_CONTAINER_ID } from 'src/defaults'
import { BKM_ROOT_ID, BKM_OTHER_ID, BOOKMARKED_PANEL_CONF_RE } from 'src/defaults'
import { HISTORY_PANEL, HISTORY_PANEL_STATE, FOLDER_NAME_DATA_RE } from 'src/defaults'
import { BKM_MENU_ID, BKM_MOBILE_ID, BKM_TLBR_ID } from 'src/defaults'
import * as Logs from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Store } from 'src/services/storage'
import { DnD } from 'src/services/drag-and-drop'
import { History } from 'src/services/history'
import { Search } from 'src/services/search'
import { Info } from './info'
import { Permissions } from './permissions'
import { ItemInfo } from 'src/types/tabs'
import { Notifications } from './notifications'
import * as IPC from './ipc'

interface PanelElements {
  scrollBox: HTMLElement
}

let rootEl: HTMLElement | null = null

export function registerRootEl(el: HTMLElement): void {
  rootEl = el
}

let horizontalNavBarEl: HTMLElement | undefined
export function registerHorizontalNavBarEl(el: HTMLElement): void {
  horizontalNavBarEl = el
}

let resizeTimeout: number | undefined
function onSidebarResize(): void {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    // Changed width
    if (Sidebar.reactive.width !== document.body.offsetWidth) {
      Sidebar.reactive.width = document.body.offsetWidth
      if (horizontalNavBarEl) Sidebar.reactive.horNavWidth = horizontalNavBarEl.offsetWidth

      if (panelsBoxEl) {
        const panelsBoxBounds = panelsBoxEl.getBoundingClientRect()
        const area = Settings.state.scrollThroughTabsScrollArea
        if (area >= 0) {
          Sidebar.scrollAreaRightX = panelsBoxBounds.right - area
          Sidebar.scrollAreaLeftX = 0
        } else if (area < 0) {
          Sidebar.scrollAreaRightX = 0
          Sidebar.scrollAreaLeftX = panelsBoxBounds.left - area
        }
      }
    }

    // Changed height
    if (Sidebar.height !== document.body.offsetHeight) {
      Sidebar.height = document.body.offsetHeight

      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === Sidebar.reactive.activePanelId) {
        Tabs.scrollToTab(activeTab.id)
      }
    }
  }, 120)
}

function onBroActionClick(tab: browser.tabs.Tab, info: browser.browserAction.OnClickData): void {
  if (tab.windowId !== Windows.id) return
  if (!info || info.button === 0) browser.sidebarAction.close()
}

export function setupListeners(): void {
  if (Info.isBg) Store.onKeyChange('sidebar', updateSidebarInBg)
  if (Info.isSetup) Store.onKeyChange('sidebar', updateSidebarInSetup)
  if (Info.isSidebar) {
    Store.onKeyChange('sidebar', updateSidebar)
    window.addEventListener('resize', onSidebarResize)
    browser.browserAction.onClicked.addListener(onBroActionClick)
  }
}

export function resetListeners(): void {
  window.removeEventListener('resize', onSidebarResize)
  browser.browserAction.onClicked.removeListener(onBroActionClick)
}

export function confirm(msg: string): Promise<boolean> {
  return new Promise(res => {
    Sidebar.reactive.confirm = {
      msg,
      ok: () => {
        Sidebar.reactive.confirm = null
        res(true)
      },
      cancel: () => {
        Sidebar.reactive.confirm = null
        res(false)
      },
    }
  })
}

export function finishConfirmation(accept: boolean): void {
  if (accept && Sidebar.reactive.confirm?.ok) Sidebar.reactive.confirm.ok()
  else if (Sidebar.reactive.confirm?.cancel) Sidebar.reactive.confirm.cancel()
}

export function recalcElementSizes(): void {
  if (!rootEl) return
  const compStyle = getComputedStyle(rootEl)

  const nbwRaw = compStyle.getPropertyValue('--nav-btn-width')
  Sidebar.reactive.navBtnWidth = Utils.parseCSSNum(nbwRaw.trim())[0]

  const thRaw = compStyle.getPropertyValue('--tabs-height')
  Sidebar.tabHeight = Utils.parseCSSNum(thRaw.trim())[0]

  const bhRaw = compStyle.getPropertyValue('--bookmarks-bookmark-height')
  Sidebar.bookmarkHeight = Utils.parseCSSNum(bhRaw.trim())[0]

  const fhRaw = compStyle.getPropertyValue('--bookmarks-folder-height')
  Sidebar.folderHeight = Utils.parseCSSNum(fhRaw.trim())[0]

  const shRaw = compStyle.getPropertyValue('--bookmarks-separator-height')
  Sidebar.separatorHeight = Utils.parseCSSNum(shRaw.trim())[0]
}
let recalcElementSizesTimeout: number | undefined
export function recalcElementSizesDebounced(delay = 500): void {
  clearTimeout(recalcElementSizesTimeout)
  recalcElementSizesTimeout = setTimeout(recalcElementSizes, delay)
}

export function recalcSidebarSize(): void {
  Sidebar.reactive.width = document.body.offsetWidth
  Sidebar.height = document.body.offsetHeight

  setTimeout(() => {
    if (panelsBoxEl) {
      const panelsBoxBounds = panelsBoxEl.getBoundingClientRect()
      const area = Settings.state.scrollThroughTabsScrollArea
      if (area >= 0) {
        Sidebar.scrollAreaRightX = panelsBoxBounds.right - area
        Sidebar.scrollAreaLeftX = 0
      } else if (area < 0) {
        Sidebar.scrollAreaRightX = 0
        Sidebar.scrollAreaLeftX = panelsBoxBounds.left - area
      }
    }
  }, 120)
}

export function updateFontSize(): void {
  const htmlEl = document.documentElement
  if (Settings.state.fontSize === 'xxs') htmlEl.style.fontSize = '13px'
  else if (Settings.state.fontSize === 'xs') htmlEl.style.fontSize = '13.5px'
  else if (Settings.state.fontSize === 's') htmlEl.style.fontSize = '14px'
  else if (Settings.state.fontSize === 'm') htmlEl.style.fontSize = '14.5px'
  else if (Settings.state.fontSize === 'l') htmlEl.style.fontSize = '15px'
  else if (Settings.state.fontSize === 'xl') htmlEl.style.fontSize = '15.5px'
  else if (Settings.state.fontSize === 'xxl') htmlEl.style.fontSize = '16px'
  else htmlEl.style.fontSize = '14.5px'
}

export async function loadNav(): Promise<void> {
  const storage = await browser.storage.local.get<Stored>('sidebar')
  let saveNeeded = false
  if (!storage.sidebar?.nav?.length) {
    Logs.warn('Sidebar.loadNav: Creating default sidebar config and saving it')
    storage.sidebar = createDefaultSidebar()
    saveNeeded = true
  }
  if (storage.sidebar) parseNav(storage.sidebar)
  if (saveNeeded) await Store.set({ sidebar: storage.sidebar }, 300)
}

function parseNav(config: SidebarConfig): void {
  Sidebar.hasTabs = false
  Sidebar.hasBookmarks = false
  Sidebar.hasHistory = false

  for (const id of config.nav) {
    const panel = config.panels[id]
    if (panel) {
      if (!Sidebar.hasTabs && panel.type === PanelType.tabs) Sidebar.hasTabs = true
      if (!Sidebar.hasBookmarks && panel.type === PanelType.bookmarks) Sidebar.hasBookmarks = true
      if (!Sidebar.hasHistory && panel.type === PanelType.history) Sidebar.hasHistory = true
    }
  }
}

export function recalcTabsPanels(): void {
  const pinnedTabs: ReactiveTab[] = []
  const pinnedTabsByPanel: Record<ID, ReactiveTab[]> = {}
  const pinnedInPanel = Settings.state.pinnedTabsPosition === 'panel'
  let tabIndex = 0
  let tabPanelIndex = 0
  let same = true
  let tab: Tab
  let startIndex = -1

  const firstTabsPanel = Sidebar.reactive.panels.find(p => Utils.isTabsPanel(p))
  for (; (tab = Tabs.list[tabIndex])?.pinned; tabIndex++) {
    const rTab = Tabs.reactive.byId[tab.id]
    if (!rTab) return Logs.err('Sidebar.recalcTabsPanels: Cannot get reactive tab')

    if (pinnedInPanel) {
      let panel = Sidebar.reactive.panelsById[tab.panelId]
      if (!panel) {
        Logs.warn('Cannot find panel for pinned tab', tab.panelId)
        if (firstTabsPanel) {
          tab.panelId = firstTabsPanel.id
          panel = firstTabsPanel
        } else {
          tab.panelId = NOID
          continue
        }
      }
      if (!pinnedTabsByPanel[panel.id]) pinnedTabsByPanel[panel.id] = []
      if (Utils.isTabsPanel(panel)) pinnedTabsByPanel[panel.id].push(rTab)
    }

    pinnedTabs.push(rTab)
  }

  for (const panel of Sidebar.reactive.panels) {
    if (!Utils.isTabsPanel(panel)) continue

    if (pinnedTabsByPanel[panel.id]) panel.pinnedTabs = pinnedTabsByPanel[panel.id]
    else panel.pinnedTabs = []

    const panelTabs: ReactiveTab[] = []
    for (; (tab = Tabs.list[tabIndex]); tabIndex++) {
      const rTab = Tabs.reactive.byId[tab.id]
      if (tab.panelId === NOID) tab.panelId = panel.id
      if (tab.panelId === panel.id) {
        if (same && panel.tabs[tabPanelIndex]?.id !== tab.id) same = false
        if (startIndex === -1) startIndex = tab.index
      } else break
      if (rTab) panelTabs.push(rTab)
      tabPanelIndex++
    }

    if (!same || panel.tabs.length !== tabPanelIndex) {
      // panel.tabs = Tabs.list.slice(startIndex, startIndex + tabPanelIndex)
      panel.tabs = panelTabs
    }

    if (panel.tabs.length) {
      panel.len = panel.tabs.length + panel.pinnedTabs.length
      panel.startTabIndex = startIndex
      panel.endTabIndex = startIndex + panel.tabs.length - 1
      panel.nextTabIndex = panel.endTabIndex + 1
    } else {
      panel.len = panel.pinnedTabs.length
      panel.startTabIndex = tabIndex
      panel.endTabIndex = tabIndex
      panel.nextTabIndex = tabIndex
    }

    startIndex = -1
    tabPanelIndex = 0
    same = true
  }

  Tabs.reactive.pinned = pinnedTabs
}

export function recalcBookmarksPanels(): void {
  for (const panel of Sidebar.reactive.panels) {
    if (!Utils.isBookmarksPanel(panel)) continue

    const rootFolder = Bookmarks.reactive.byId[panel.rootId]
    let rootContent: Bookmark[]
    let count = 0
    if (!panel.rootId || panel.rootId === BKM_ROOT_ID) {
      rootContent = Bookmarks.reactive.tree
      count = Bookmarks.overallCount
    } else {
      rootContent = Bookmarks.reactive.byId[panel.rootId]?.children || []
      count = rootFolder?.len ?? 0
    }

    panel.bookmarks = rootContent
    panel.len = count
  }
}

let panelsBoxEl: HTMLElement | undefined
export function setPanelsBoxEl(el: HTMLElement): void {
  if (!el) return
  panelsBoxEl = el
}

/**
 * Set panel's scroll element
 */
export function setPanelEls(id: ID, els: PanelElements): void {
  const panel = Sidebar.reactive.panelsById[id]
  if (panel) panel.scrollEl = els.scrollBox
}

export function setPanelScrollBox(id: ID, scrollBoxComponent: ScrollBoxComponent): void {
  const panel = Sidebar.reactive.panelsById[id]
  if (panel) panel.scrollComponent = scrollBoxComponent
}

/**
 * Update panel bounds
 */
export function updateBounds(): void {
  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!panel || !panelsBoxEl || !panel.scrollEl || !panel.ready) return

  const panelContentEl = panel.scrollComponent?.getScrollableBox()
  DnD.updatePointerLeftPosition(panelContentEl?.offsetLeft ?? 0)

  const pb = panel.scrollEl.getBoundingClientRect()
  const bb = panelsBoxEl.getBoundingClientRect()

  Sidebar.panelsTop = bb.top
  panel.topOffset = pb.top
  panel.leftOffset = bb.left
  panel.rightOffset = bb.right

  // Check additional padding
  if (panel.scrollComponent) {
    const scrollableEl = panel.scrollComponent.getScrollableBox()
    const firstChildEl = scrollableEl?.firstElementChild as HTMLElement
    if (firstChildEl?.offsetTop) panel.topOffset += firstChildEl.offsetTop
  }

  if (panel.type === PanelType.bookmarks && panel.viewMode === 'tree') {
    panel.bounds = calcBookmarksTreeBounds(panel)
  } else if (panel.type === PanelType.bookmarks && panel.viewMode === 'history') {
    panel.bounds = calcBookmarksHistoryBounds(panel)
  } else if (panel.type === PanelType.tabs) panel.bounds = calcTabsBounds(panel)
}

/**
 * Calc tabs bounds
 */
function calcTabsBounds(panel: TabsPanel): ItemBounds[] {
  const result: ItemBounds[] = []
  const th = Sidebar.tabHeight
  if (th === 0) return result
  const half = th >> 1
  const e = (half >> 1) + 2

  let overallHeight = 0
  let tabs = Tabs.list
  if (panel?.filteredTabs) {
    tabs = []
    for (const rTab of panel.filteredTabs) {
      const tab = Tabs.byId[rTab.id]
      if (tab) tabs.push(tab)
    }
  }
  for (const tab of tabs) {
    if (tab.invisible || tab.pinned) continue
    if (tab.panelId !== panel.id) continue

    result.push({
      type: ItemBoundsType.Tab,
      id: tab.id,
      index: tab.index,
      in: !!Settings.state.tabsTree,
      lvl: tab.lvl,
      folded: tab.folded,
      parent: tab.parentId,
      start: overallHeight,
      top: overallHeight + e,
      center: overallHeight + half,
      bottom: overallHeight + half + e,
      end: overallHeight + th,
    })

    overallHeight += th
  }
  return result
}

/**
 * Calc bookmarks tree bounds
 */
function calcBookmarksTreeBounds(panel: BookmarksPanel): ItemBounds[] {
  const result: ItemBounds[] = []
  if (!Utils.isBookmarksPanel(panel)) return []

  const expandedBookmarks = Bookmarks.reactive.expanded[panel.id]

  const fh = Sidebar.folderHeight
  const fc = fh >> 1
  const fe = fc >> 1

  const bh = Sidebar.bookmarkHeight
  const bc = bh >> 1
  const be = bc >> 1

  const sh = Sidebar.separatorHeight
  const sc = sh >> 1
  const se = sc >> 1

  let overallHeight = 0
  let lvl = 0
  let h: number, c: number, e: number
  const walker = (nodes: Bookmark[]) => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]

      if (n.type === 'folder') {
        h = fh
        c = fc
        e = fe
      }
      if (n.type === 'bookmark') {
        h = bh
        c = bc
        e = be
      }
      if (n.type === 'separator') {
        h = sh
        c = sc
        e = se
      }

      result.push({
        type: ItemBoundsType.Bookmarks,
        id: n.id,
        index: n.index,
        lvl,
        in: n.type === 'folder',
        folded: !expandedBookmarks[n.id],
        parent: n.parentId,
        start: overallHeight,
        top: overallHeight + e,
        center: overallHeight + c,
        bottom: overallHeight + c + e,
        end: overallHeight + h,
      })

      overallHeight += h

      if (n.children && expandedBookmarks[n.id]) {
        lvl++
        walker(n.children)
        lvl--
      }
    }
  }
  walker(panel.filteredBookmarks ?? panel.bookmarks)

  return result
}

function calcBookmarksHistoryBounds(panel: BookmarksPanel): ItemBounds[] {
  if (!Utils.isBookmarksPanel(panel)) return []
  return panel.component?.getBounds() ?? []
}

/**
 * Normalize panels and put them to state
 */
export async function loadPanels(): Promise<void> {
  const gettingActiveId = browser.sessions.getWindowValue<ID>(Windows.id, 'activePanelId')
  const gettingStorage = browser.storage.local.get<Stored>('sidebar')
  const [activeId, storage] = await Promise.all([gettingActiveId, gettingStorage])

  if (!storage.sidebar?.nav?.length) {
    Logs.warn('Sidebar.loadPanels: Creating default sidebar config')
    storage.sidebar = createDefaultSidebar()
  }

  const sidebar = storage.sidebar
  const panelConfigs = sidebar?.panels ? Object.values(sidebar?.panels) : []
  if (sidebar?.nav) Sidebar.reactive.nav = sidebar.nav

  // Normalize tabs panels
  for (const panelConfig of panelConfigs) {
    const panel = createPanelFromConfig(panelConfig)
    if (!panel) continue

    if (Utils.isTabsPanel(panel)) {
      const newTabContainer = panel.newTabCtx ? Containers.reactive.byId[panel.newTabCtx] : null
      const moveTabContainer = panel.moveTabCtx ? Containers.reactive.byId[panel.moveTabCtx] : null

      // if (panel.urlRulesActive && panel.urlRules) parsePanelUrlRules(panel)
      if (panel.newTabCtx !== DEFAULT_CONTAINER_ID && !newTabContainer) panel.newTabCtx = 'none'
      if (panel.moveTabCtx !== DEFAULT_CONTAINER_ID && !moveTabContainer) panel.moveTabCtx = 'none'
    }

    Sidebar.reactive.panelsById[panel.id] = panel
  }

  recalcPanels()

  // Activate last active panel
  if (!Windows.incognito) {
    let actPanel: Panel | undefined = Sidebar.reactive.panelsById[activeId]
    if (!actPanel) actPanel = Sidebar.reactive.panels.find(p => p.type === PanelType.tabs)
    if (actPanel) Sidebar.reactive.activePanelId = actPanel.id
    else Sidebar.reactive.activePanelId = Sidebar.reactive.panels[0]?.id ?? NOID
    Sidebar.reactive.lastActivePanelId = Sidebar.reactive.activePanelId
  } else {
    const tabsPanel = Sidebar.reactive.panels.find(p => p.type === PanelType.tabs)
    if (tabsPanel) Sidebar.reactive.activePanelId = tabsPanel.id
    else Sidebar.reactive.activePanelId = Sidebar.reactive.panels[0]?.id ?? NOID
    Sidebar.reactive.lastActivePanelId = Sidebar.reactive.activePanelId
  }

  Sidebar.ready = true
}

export function convertOldPanelsConfigToNew(panels_v4: OldPanelConfig[]): SidebarConfig {
  const sidebar: SidebarConfig = { panels: {}, nav: [] }

  for (const oldPanelConf of panels_v4) {
    if (oldPanelConf.type === 'bookmarks') {
      const panel = Utils.cloneObject(BOOKMARKS_PANEL)
      panel.id = 'bookmarks'
      panel.lockedPanel = oldPanelConf.lockedPanel
      panel.skipOnSwitching = oldPanelConf.skipOnSwitching

      sidebar.panels[panel.id] = panel
      sidebar.nav.push(panel.id)
    } else {
      const panel = Utils.cloneObject(TABS_PANEL_CONFIG)
      panel.id = oldPanelConf.id
      panel.name = oldPanelConf.name
      panel.lockedPanel = oldPanelConf.lockedPanel
      panel.skipOnSwitching = oldPanelConf.skipOnSwitching
      panel.color = Utils.normalizeColor(oldPanelConf.color)
      panel.iconSVG = oldPanelConf.icon
      panel.iconIMG = oldPanelConf.customIcon
      panel.iconIMGSrc = oldPanelConf.customIconSrc
      panel.noEmpty = oldPanelConf.noEmpty
      panel.newTabCtx = oldPanelConf.newTabCtx
      panel.dropTabCtx = oldPanelConf.dropTabCtx
      panel.moveTabCtx = oldPanelConf.moveTabCtx
      panel.moveTabCtxNoChild = oldPanelConf.moveTabCtxNoChild
      // panel.urlRulesActive = oldPanelConf.urlRulesActive
      // panel.urlRules = oldPanelConf.urlRules

      sidebar.panels[panel.id] = panel
      sidebar.nav.push(panel.id)
    }
  }

  if (!Settings.state.hideAddBtn) sidebar.nav.push('add_tp')
  sidebar.nav.push('sp-0')
  if (!Settings.state.hideSettingsBtn) sidebar.nav.push('settings')

  return sidebar
}

export function createDefaultSidebar(): SidebarConfig {
  const defaultTabsPanel = createTabsPanel({ id: 'tabs-panel' })
  const defaultTabsPanelConfig = createPanelConfigFromPanel(defaultTabsPanel)
  return {
    panels: { [defaultTabsPanelConfig.id]: defaultTabsPanelConfig },
    nav: [defaultTabsPanel.id, 'add_tp', 'sp-0', 'settings'],
  }
}

export function recalcPanels(): void {
  const panels: Panel[] = []
  let index = 0

  Sidebar.hasTabs = false
  Sidebar.hasBookmarks = false
  Sidebar.hasHistory = false

  for (const id of Sidebar.reactive.nav) {
    if ((id as string).startsWith('sp-')) continue
    if ((id as string).startsWith('sd-')) continue
    if (id === 'settings') continue
    if (id === 'search') continue
    if (id === 'add_tp') continue
    if (id === 'create_snapshot') continue
    if (id === 'remute_audio_tabs') continue
    if (id === 'collapse') continue

    const panel = Sidebar.reactive.panelsById[id]
    if (!panel) {
      Utils.rmFromArray(Sidebar.reactive.nav, id)
      continue
    }

    panel.index = index++
    panels.push(panel)

    if (!Sidebar.hasTabs) Sidebar.hasTabs = panel.type === PanelType.tabs
    if (!Sidebar.hasBookmarks) Sidebar.hasBookmarks = panel.type === PanelType.bookmarks
    if (!Sidebar.hasHistory) Sidebar.hasHistory = panel.type === PanelType.history
  }

  Sidebar.reactive.panels = panels
}

// function parsePanelUrlRules(panel: TabsPanel): void {
//   if (!panel.urlRules) return
//   if (!Sidebar.urlRules) Sidebar.urlRules = []

//   for (const rawRule of panel.urlRules.split('\n')) {
//     let rule: string | RegExp = rawRule.trim()
//     if (!rule) continue

//     if (rule[0] === '/' && rule[rule.length - 1] === '/') {
//       try {
//         rule = new RegExp(rule.slice(1, rule.length - 1))
//       } catch (err) {
//         continue
//       }
//     }

//     Sidebar.urlRules.push({ panelId: panel.id, value: rule })
//   }
// }

function getSidebarConfig(): SidebarConfig {
  const panels: Record<ID, PanelConfig> = {}
  for (const id of Sidebar.reactive.nav) {
    const panel = Sidebar.reactive.panelsById[id]
    if (panel) panels[id] = createPanelConfigFromPanel(panel)
  }

  return { panels, nav: Utils.cloneArray(Sidebar.reactive.nav) }
}

export function saveSidebar(delay?: number): Promise<void> {
  return Store.set({ sidebar: getSidebarConfig() }, delay)
}

export function moveNavItem(srcIndex: number, dstIndex: number): void {
  if (srcIndex === dstIndex) return

  const targetId = Sidebar.reactive.nav.splice(srcIndex, 1)[0]
  if (targetId === undefined) return

  Sidebar.reactive.nav.splice(dstIndex, 0, targetId)

  const newSidebarConfig = getSidebarConfig()
  updateSidebar(newSidebarConfig)

  Sidebar.saveSidebar(500)
}

export function createPanelFromConfig(srcPanel: PanelConfig): Panel | null {
  let panelDefs: Panel
  if (srcPanel.id === DEFAULT_CONTAINER_ID) panelDefs = TABS_PANEL_STATE
  else if (srcPanel.type === PanelType.tabs) panelDefs = TABS_PANEL_STATE
  else if (srcPanel.type === PanelType.bookmarks) panelDefs = BOOKMARKS_PANEL_STATE
  else if (srcPanel.type === PanelType.history) panelDefs = HISTORY_PANEL_STATE
  else return null

  return Utils.recreateNormalizedObject(srcPanel as Panel, panelDefs)
}

function createPanelConfigFromPanel(srcPanel: Panel): PanelConfig {
  srcPanel = Utils.cloneObject(srcPanel)
  if (Utils.isTabsPanel(srcPanel))
    return Utils.recreateNormalizedObject(srcPanel, TABS_PANEL_CONFIG)
  if (Utils.isBookmarksPanel(srcPanel))
    return Utils.recreateNormalizedObject(srcPanel, BOOKMARKS_PANEL)
  if (Utils.isHistoryPanel(srcPanel)) return Utils.recreateNormalizedObject(srcPanel, HISTORY_PANEL)
  throw Logs.err('Sidebar: createPanelConfigFromPanel: Unknown panel type')
}

function updateSidebarInBg(newConfig?: SidebarConfig | null): void {
  if (!newConfig) return
  parseNav(newConfig)

  // TODO: Load/Unload services like History?
}

function updateSidebarInSetup(newConfig?: SidebarConfig | null): void {
  if (!newConfig?.nav?.length) newConfig = createDefaultSidebar()

  const sidebar = newConfig
  const panelConfigs = sidebar?.panels ? Object.values(sidebar?.panels) : []
  if (sidebar?.nav) Sidebar.reactive.nav = sidebar.nav

  // Normalize panels
  const newPanelsMap: Record<ID, Panel> = {}
  for (const panelConfig of panelConfigs) {
    const panel = createPanelFromConfig(panelConfig)
    if (!panel) continue

    if (Utils.isTabsPanel(panel)) {
      const newTabContainer = panel.newTabCtx ? Containers.reactive.byId[panel.newTabCtx] : null
      const moveTabContainer = panel.moveTabCtx ? Containers.reactive.byId[panel.moveTabCtx] : null

      // if (panel.urlRulesActive && panel.urlRules) parsePanelUrlRules(panel)
      if (panel.newTabCtx !== DEFAULT_CONTAINER_ID && !newTabContainer) panel.newTabCtx = 'none'
      if (panel.moveTabCtx !== DEFAULT_CONTAINER_ID && !moveTabContainer) panel.moveTabCtx = 'none'
    }

    newPanelsMap[panel.id] = panel
  }

  Sidebar.reactive.panelsById = newPanelsMap
  recalcPanels()
}

async function updateSidebar(newConfig?: SidebarConfig): Promise<void> {
  if (!newConfig) return
  if (!Sidebar.ready) return

  const panelConfigs = Object.values(newConfig.panels)
  const newPanelsMap: Record<ID, Panel> = {}
  const oldNavItems = Sidebar.reactive.nav
  Sidebar.reactive.nav = newConfig.nav

  // // Reset url rules
  // Sidebar.urlRules = []

  const prevHasTabsPanels = Sidebar.hasTabs
  const prevHasBookmarksPanels = Sidebar.hasBookmarks
  const prevHasHistoryPanel = Sidebar.hasHistory

  let tabsSaveNeeded = false
  let tabsPanelId: ID | undefined
  let existedPanelId: ID | undefined

  // Loop over the new panels
  for (const panelConfig of panelConfigs) {
    let panel = Sidebar.reactive.panelsById[panelConfig.id]

    // Update existed panel
    if (panel) {
      Object.assign(panel, panelConfig)
    }

    // or add new panel
    else {
      const newPanel = createPanelFromConfig(panelConfig)
      if (!newPanel) throw Logs.err('Sidebar.updateSidebar: Cannot create new panel')
      panel = newPanel
      Sidebar.reactive.panelsById[panel.id] = panel
    }

    newPanelsMap[panel.id] = panel

    if (Utils.isTabsPanel(panel)) {
      const newTabContainer = panel.newTabCtx ? Containers.reactive.byId[panel.newTabCtx] : null
      const moveTabContainer = panel.moveTabCtx ? Containers.reactive.byId[panel.moveTabCtx] : null

      // if (panel.urlRulesActive && panel.urlRules) parsePanelUrlRules(panel)
      if (panel.newTabCtx !== DEFAULT_CONTAINER_ID && !newTabContainer) panel.newTabCtx = 'none'
      if (panel.moveTabCtx !== DEFAULT_CONTAINER_ID && !moveTabContainer) panel.moveTabCtx = 'none'
    }

    // Save first panel and first tabs panel
    if (!tabsPanelId && panel.type === PanelType.tabs) tabsPanelId = panel.id
    if (!existedPanelId) existedPanelId = panel.id
  }

  // Loop over the old panels
  for (let index = 0; index < oldNavItems.length; index++) {
    const panel = Sidebar.reactive.panelsById[oldNavItems[index]]
    if (!panel) continue

    // Handle removed panels
    if (!newPanelsMap[panel.id]) {
      delete Sidebar.reactive.panelsById[panel.id]

      if (Utils.isTabsPanel(panel)) {
        const firstTabsPanel = Sidebar.reactive.panels.find(p => {
          return Utils.isTabsPanel(p) && p.id !== panel.id
        }) as TabsPanel
        const nearTabsPanelId = Utils.findNear(oldNavItems, index, id => {
          return Utils.isTabsPanel(Sidebar.reactive.panelsById[id])
        })

        // Update panelId of removed panel tabs to nearest panel
        for (const tab of Tabs.list) {
          if (tab.pinned && tab.panelId === panel.id) {
            tab.panelId = firstTabsPanel?.id ?? NOID
            tabsSaveNeeded = true
          }

          if (!tab.pinned && tab.panelId === panel.id) {
            tab.panelId = nearTabsPanelId ?? NOID
            tabsSaveNeeded = true
          }
        }
      }
    } else {
      if (panel.type === PanelType.tabs) tabsPanelId = panel.id
      existedPanelId = panel.id
    }
  }

  recalcPanels()
  if (Settings.state.updateSidebarTitle) updateSidebarTitle()

  if (!prevHasTabsPanels && Sidebar.hasTabs) Tabs.load()
  else if (prevHasTabsPanels && !Sidebar.hasTabs) Tabs.unload()

  if (!prevHasBookmarksPanels && Sidebar.hasBookmarks) Bookmarks.load()
  else if (prevHasBookmarksPanels && !Sidebar.hasBookmarks) Bookmarks.unload()

  if (!prevHasHistoryPanel && Sidebar.hasHistory) History.load()
  else if (prevHasHistoryPanel && !Sidebar.hasHistory) History.unload()

  if (Sidebar.hasTabs) {
    // Get rearrangements for tabs
    const moves: [Tab, number][] = []
    let tabIndex = Tabs.list.findIndex(t => !t.pinned)
    if (tabIndex === -1) tabIndex = 0
    for (const panel of Sidebar.reactive.panels) {
      if (panel.type !== PanelType.tabs) continue

      const panelTabs = Tabs.list.filter(t => !t.pinned && t.panelId === panel.id)
      for (const tab of panelTabs) {
        if (tab.index !== tabIndex) moves.push([tab, tabIndex])
        tabIndex++
      }
    }

    // Move tabs
    if (moves.length) {
      tabsSaveNeeded = true
      Tabs.ignoreTabsEvents = true
      const moving = []
      for (const move of moves) {
        const tab = move[0]
        if (tab.index !== move[1]) {
          moving.push(browser.tabs.move(tab.id, { index: move[1] }))
          Tabs.list.splice(tab.index, 1)
          Tabs.list.splice(move[1], 0, tab)
          const minIndex = Math.min(tab.index, move[1])
          const maxIndex = Math.max(tab.index, move[1]) + 1
          for (let i = minIndex; i < maxIndex; i++) {
            Tabs.list[i].index = i
          }
        }
      }
      await Promise.all(moving)
      Tabs.ignoreTabsEvents = false
    }

    recalcTabsPanels()

    if (tabsSaveNeeded) {
      Tabs.list.forEach(t => Tabs.saveTabData(t.id))
      Tabs.cacheTabsData()
    }
  }

  if (Sidebar.hasBookmarks) recalcBookmarksPanels()

  // Switch to another panel
  if (!Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]) {
    // To active tab's panel
    if (Sidebar.hasTabs && Tabs.byId[Tabs.activeId]) {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab) {
        const targetPanelId = activeTab.panelId
        if (Sidebar.reactive.panelsById[targetPanelId]) {
          Sidebar.activatePanel(targetPanelId)
        }
      }
    }

    // To first panel
    if (!Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]) {
      const firstPanel = Sidebar.reactive.panels[0]
      if (firstPanel) Sidebar.activatePanel(firstPanel.id)
    }

    Sidebar.saveActivePanel()
  }
}

export function activatePanel(panelId: ID, loadPanels = true): void {
  if (Sidebar.reactive.activePanelId === panelId) return

  const prevPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  const panel = Sidebar.reactive.panelsById[panelId]
  if (!panel) return

  if (panel.loading === 'err' || panel.loading === 'ok') panel.loading = false

  let loading: Promise<void> | undefined
  if (loadPanels && !panel.ready) {
    if (panel.type === PanelType.tabs) loading = Tabs.load()
    if (panel.type === PanelType.bookmarks) loading = Bookmarks.load()
    if (panel.type === PanelType.history) loading = History.load()
  }

  if (prevPanel) Sidebar.reactive.lastActivePanelId = Sidebar.reactive.activePanelId
  Sidebar.reactive.activePanelId = panelId

  if (Search.reactive.value && prevPanel && prevPanel.type !== panel.type) {
    if (loading) loading.then(() => Search.search())
    else Search.search()
  }

  if (Utils.isTabsPanel(prevPanel)) Sidebar.lastTabsPanelId = prevPanel.id
  if (Utils.isHistoryPanel(prevPanel)) History.unloadAfter(30_000)

  if (DnD.reactive.isStarted) DnD.reactive.dstPanelId = panelId

  if (Settings.state.updateSidebarTitle) Sidebar.updateSidebarTitle(0)
}

/**
 * Save panel index
 */
export function saveActivePanel(): void {
  if (!Windows.focused || Windows.incognito) return
  browser.sessions.setWindowValue(Windows.id, 'activePanelId', Sidebar.reactive.activePanelId)
}

let updatePanelBoundsTimeout: number | undefined
export function updatePanelBoundsDebounced(delay = 256): void {
  clearTimeout(updatePanelBoundsTimeout)
  updatePanelBoundsTimeout = setTimeout(() => updateBounds(), delay)
}

/**
 * Switch current active panel by index
 */
export function switchToPanel(
  id: ID,
  withoutTabActivation?: boolean,
  withoutTabCreation?: boolean
): void {
  Menu.close()
  if (!DnD.reactive.isStarted) Selection.resetSelection()
  Sidebar.activatePanel(id)

  const panel = Sidebar.reactive.panelsById[id]
  if (
    !withoutTabCreation &&
    Utils.isTabsPanel(panel) &&
    (panel.noEmpty || Settings.state.hideInact || Settings.state.hideEmptyPanels) &&
    !panel.len
  ) {
    Tabs.createTabInPanel(panel)
  }

  if (
    Utils.isTabsPanel(panel) &&
    Settings.state.activateLastTabOnPanelSwitching &&
    !withoutTabActivation &&
    !Search.reactive.value
  ) {
    Tabs.activateLastActiveTabOf(id)
  }

  if (DnD.reactive.isStarted) updatePanelBoundsDebounced()
  else saveActivePanel()
}

/**
 * Try to find not hidden neighbour panel
 */
export function switchToNeighbourPanel(): void {
  let target: Panel | undefined
  let activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!activePanel) activePanel = Sidebar.reactive.panels[0]

  if (!target) {
    for (let i = activePanel.index - 1; i > 0; i--) {
      const panel = Sidebar.reactive.panels[i]
      if (panel) {
        if (Settings.state.hideEmptyPanels && Utils.isTabsPanel(panel) && !panel.len) continue
        target = Sidebar.reactive.panels[i]
        break
      }
    }
  }

  if (!target) {
    for (let i = activePanel.index + 1; i < Sidebar.reactive.panels.length; i++) {
      const panel = Sidebar.reactive.panels[i]
      if (panel) {
        if (Settings.state.hideEmptyPanels && Utils.isTabsPanel(panel) && !panel.len) continue
        target = Sidebar.reactive.panels[i]
        break
      }
    }
  }

  if (target) switchToPanel(target.id)
}

let switchPanelPause: number | undefined
export function switchPanel(
  dir: 1 | -1,
  ignoreHidden?: boolean,
  withoutTabCreation?: boolean
): void {
  // Debounce switching
  if (switchPanelPause) return
  const delay = Settings.state.navSwitchPanelsDelay ?? 128
  if (delay > 0) {
    switchPanelPause = setTimeout(() => {
      clearTimeout(switchPanelPause)
      switchPanelPause = undefined
    }, delay)
  }

  Menu.close()
  Selection.resetSelection()

  // If current active panel is not exist
  let activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!activePanel) {
    activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.lastActivePanelId]
    if (!activePanel) activePanel = Sidebar.reactive.panels[0]
    if (activePanel) Sidebar.reactive.activePanelId = activePanel.id
    return
  }

  const actIndex = Sidebar.reactive.panels.findIndex(p => p.id === Sidebar.reactive.activePanelId)
  if (actIndex === -1) return

  // Find first/last visible/hidden tabs panels (if needed)
  let lastVisibleTabsPanel = -1
  let lastHiddenTabsPanel = -1
  let firstHiddenTabsPanel = -1
  if (Settings.state.hideEmptyPanels) {
    for (let i = Sidebar.reactive.panels.length; i--; ) {
      const panel = Sidebar.reactive.panels[i]
      if (!panel) return
      if (lastVisibleTabsPanel === -1 && Utils.isTabsPanel(panel) && panel.len) {
        lastVisibleTabsPanel = i
      }
      if (lastHiddenTabsPanel === -1 && Utils.isTabsPanel(panel) && !panel.len) {
        lastHiddenTabsPanel = i
      }
      if (lastVisibleTabsPanel !== -1 && lastHiddenTabsPanel !== -1) break
    }
    firstHiddenTabsPanel = Sidebar.reactive.panels.findIndex(p => Utils.isTabsPanel(p) && !p.len)
    if (lastVisibleTabsPanel === -1 && firstHiddenTabsPanel !== -1) {
      lastVisibleTabsPanel = firstHiddenTabsPanel
    }
  }

  const hasHiddenPanels = firstHiddenTabsPanel !== -1 && lastHiddenTabsPanel !== -1

  let panel: Panel | undefined
  for (let i = actIndex + dir; i >= 0 || i < Sidebar.reactive.panels.length; i += dir) {
    panel = Sidebar.reactive.panels[i]
    if (!panel) return
    if (panel.skipOnSwitching) continue

    const isEmpty = Utils.isTabsPanel(panel) && !panel.len
    const isHidden = Settings.state.hideEmptyPanels && isEmpty
    if (ignoreHidden && isHidden) continue

    if (hasHiddenPanels && lastVisibleTabsPanel !== -1) {
      // Open hidden panels bar
      if (!Sidebar.reactive.hiddenPanelsBar && i === lastVisibleTabsPanel + 1) {
        Sidebar.reactive.hiddenPanelsBar = true
        i = dir > 0 ? -1 : Sidebar.reactive.panels.length
        continue
      }

      // Close hidden panels bar
      if (
        Sidebar.reactive.hiddenPanelsBar &&
        ((dir > 0 && i > lastHiddenTabsPanel) || (dir < 0 && i < firstHiddenTabsPanel))
      ) {
        Sidebar.reactive.hiddenPanelsBar = false
        i = lastVisibleTabsPanel + 1
        continue
      }

      if (Sidebar.reactive.hiddenPanelsBar !== isHidden) continue
    }

    break
  }

  if (!panel) return

  switchToPanel(panel.id, false, withoutTabCreation)
}

export function closeHiddenPanelsBar(withoutTabCreation?: boolean): void {
  Sidebar.reactive.hiddenPanelsBar = false

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (
    !withoutTabCreation &&
    Utils.isTabsPanel(panel) &&
    (panel.noEmpty || Settings.state.hideInact || Settings.state.hideEmptyPanels) &&
    !panel.len
  ) {
    Tabs.createTabInPanel(panel)
  }
}

/**
 * Find panel with active tab and switch to it.
 */
export function goToActiveTabPanel(): void {
  let activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  const panel = Sidebar.reactive.panelsById[activeTab.panelId]
  if (panel) switchToPanel(activeTab.panelId)
}

/**
 * Returns active panel info
 */
export function getActivePanelInfo(): Panel {
  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!panel) throw Logs.err('Sidebar: getActivePanelInfo: Active panel not found')
  return Utils.cloneObject(panel)
}

export async function askHowRemoveTabsPanel(panelId: ID): Promise<string | null> {
  const panel = Sidebar.reactive.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return null

  let text
  if (Windows.otherWindows.length) text = translate('popup.tabs_panel_removing.other_win_note')

  const conf: DialogConfig = {
    title: translate('popup.tabs_panel_removing.title'),
    text,
    buttons: [
      {
        value: 'close',
        label: translate('popup.tabs_panel_removing.close'),
      },
      {
        value: 'close',
        label: translate('btn.cancel'),
        warn: true,
      },
    ],
  }

  const isRoot =
    panel.bookmarksFolderId === BKM_OTHER_ID ||
    panel.bookmarksFolderId === BKM_MENU_ID ||
    panel.bookmarksFolderId === BKM_MOBILE_ID ||
    panel.bookmarksFolderId === BKM_TLBR_ID
  if (!isRoot) {
    conf.buttons.unshift({
      value: 'save',
      label: translate('popup.tabs_panel_removing.save'),
    })
  }

  const otherPanelsExisted = !!Sidebar.reactive.panels.find(p => {
    return p.type === PanelType.tabs && panelId !== p.id
  })
  if (otherPanelsExisted) {
    conf.buttons.unshift({
      value: 'attach',
      label: translate('popup.tabs_panel_removing.attach'),
    })
  } else {
    conf.buttons.unshift({
      value: 'leave',
      label: translate('popup.tabs_panel_removing.leave'),
    })
  }

  return Sidebar.ask(conf)
}

export function ask(conf: DialogConfig): Promise<string | null> {
  return new Promise<string | null>(ok => {
    Sidebar.reactive.dialog = {
      title: conf.title,
      text: conf.text,
      buttons: conf.buttons,
      result: (answer: string | null) => {
        ok(answer)
        Sidebar.reactive.dialog = null
      },
    }
  })
}

function attachPanelTabsToNeighbourPanel(panel: TabsPanel): void {
  const index = Sidebar.reactive.nav.indexOf(panel.id)
  const firstPanelId = Sidebar.reactive.nav.find(id => {
    return Utils.isTabsPanel(Sidebar.reactive.panelsById[id]) && id !== panel.id
  })
  const nearPanelId = Utils.findNear(Sidebar.reactive.nav, index, v => {
    return Utils.isTabsPanel(Sidebar.reactive.panelsById[v])
  })

  // Update panelId of removed panel tabs to nearest panel
  for (const tab of Tabs.list) {
    if (tab.pinned && tab.panelId === panel.id) {
      tab.panelId = firstPanelId ?? NOID
    }

    if (!tab.pinned && tab.panelId === panel.id) {
      tab.panelId = nearPanelId ?? NOID
    }
  }

  // TODO: Recalc tabs panels maybe?
}

/**
 * Remove panel
 */
export async function removePanel(panelId: ID): Promise<void> {
  const panel = Sidebar.reactive.panelsById[panelId]
  if (!panel) return

  const index = Sidebar.reactive.nav.indexOf(panelId)
  let tabsSaveNeeded = false

  if (Utils.isTabsPanel(panel)) {
    if (panel.tabs.length) {
      tabsSaveNeeded = true

      const mode = await askHowRemoveTabsPanel(panel.id)
      if (mode === 'attach') {
        attachPanelTabsToNeighbourPanel(panel)
      } else if (mode === 'save') {
        const tabsIds = panel.tabs.map(t => t.id)
        await Sidebar.bookmarkTabsPanel(panel.id, true, true)
        await Tabs.removeTabs(tabsIds, true)
      } else if (mode === 'close') {
        const tabsIds = panel.tabs.map(t => t.id)
        await Tabs.removeTabs(tabsIds, true)
      } else {
        return
      }

      // Check if panel is empty
      const allRemoved = await Tabs.isRemovingFinished()
      if (!allRemoved) {
        return Logs.warn('Sidebar.removePanel: Panel is not empty')
      }
    }
  }

  // Switch to another panel
  if (panel.id === Sidebar.reactive.activePanelId) {
    let nextActivePanelId
    if (Sidebar.reactive.lastActivePanelId !== panel.id) {
      nextActivePanelId = Sidebar.reactive.lastActivePanelId
    } else {
      nextActivePanelId = Utils.findNear(
        Sidebar.reactive.nav,
        index,
        id => !!Sidebar.reactive.panelsById[id]
      )
    }
    if (nextActivePanelId !== undefined) {
      Sidebar.activatePanel(nextActivePanelId)
      saveActivePanel()
    }
  }

  Utils.rmFromArray(Sidebar.reactive.nav, panelId)

  delete Sidebar.reactive.panelsById[panelId]
  recalcPanels()
  if (Utils.isTabsPanel(panel)) recalcTabsPanels()

  if (Utils.isTabsPanel(panel) && !Sidebar.hasTabs) Tabs.unload()
  if (Utils.isBookmarksPanel(panel) && !Sidebar.hasBookmarks) Bookmarks.unload()
  if (Utils.isHistoryPanel(panel) && !Sidebar.hasHistory) History.unload()

  if (tabsSaveNeeded) {
    Tabs.list.forEach(t => Tabs.saveTabData(t.id))
    Tabs.cacheTabsData()
  }

  saveSidebar(120)
}

export function createTabsPanel(conf?: Partial<TabsPanelConfig>): TabsPanel {
  const panel = Utils.cloneObject(TABS_PANEL_STATE)

  if (conf) {
    for (const key of Object.keys(conf) as (keyof TabsPanelConfig)[]) {
      if (conf[key] !== undefined) {
        ;(panel[key] as any) = conf[key] as unknown
      }
    }
  }

  if (!panel.id) panel.id = Utils.uid()
  if (!panel.name) panel.name = translate('panel.tabs.title')

  Sidebar.reactive.panelsById[panel.id] = panel

  return Sidebar.reactive.panelsById[panel.id] as TabsPanel
}

export function createBookmarksPanel(conf?: Partial<BookmarksPanelConfig>): BookmarksPanel {
  const panel = Utils.cloneObject(BOOKMARKS_PANEL_STATE)

  if (conf) {
    for (const key of Object.keys(conf) as (keyof BookmarksPanelConfig)[]) {
      if (conf[key] !== undefined) {
        ;(panel[key] as any) = conf[key] as unknown
      }
    }
  }

  if (!panel.id) panel.id = Utils.uid()
  if (!panel.name) panel.name = translate('panel.bookmarks.title')
  if (!panel.rootId) panel.rootId = BKM_ROOT_ID

  Sidebar.reactive.panelsById[panel.id] = panel

  return Sidebar.reactive.panelsById[panel.id] as BookmarksPanel
}

export function createHistoryPanel(): Panel {
  const panel = Utils.cloneObject(HISTORY_PANEL_STATE)
  Sidebar.reactive.panelsById[panel.id] = panel
  return panel
}

export function unloadPanelType(type: PanelType): void {
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  const switchNeeded = activePanel?.type === type

  if (switchNeeded) {
    const nextPanel = Sidebar.reactive.panels.find(p => p.ready && p.type !== type)
    if (nextPanel) switchToPanel(nextPanel.id)
    else return
  }

  if (type === PanelType.bookmarks) Bookmarks.unload()
  else if (type === PanelType.history) History.unload()
}

/** TODO: Remove
 * Find most appropriate tabs panel id for given url
 */
export function findTabsPanelForUrl(url: string, excludedPanelId?: ID): ID | undefined {
  if (!Sidebar.urlRules) return
  for (const rule of Sidebar.urlRules) {
    if (excludedPanelId === rule.panelId) continue

    let ok
    if (Utils.isRegExp(rule.value)) ok = rule.value.test(url)
    else ok = url.indexOf(rule.value as string) !== -1

    if (ok) return rule.panelId
  }

  const active = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (active?.type === PanelType.tabs) return Sidebar.reactive.activePanelId

  const last = Sidebar.reactive.panelsById[Sidebar.reactive.lastActivePanelId]
  if (last?.type === PanelType.tabs) return Sidebar.reactive.lastActivePanelId
}

export async function bookmarkTabsPanel(
  panelId: ID,
  update = false,
  silent?: boolean,
  parentFolderId?: ID
): Promise<void> {
  const panel = Sidebar.reactive.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (!Permissions.reactive.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return
  }
  if (!Bookmarks.reactive.tree.length) await Bookmarks.load()

  const oldFolderId = panel.bookmarksFolderId
  const oldFolder = Bookmarks.reactive.byId[oldFolderId]
  let parentId = parentFolderId ?? oldFolder?.parentId
  let parent = Bookmarks.reactive.byId[parentId ?? NOID]
  let index = oldFolder?.index ?? -1
  let folderName = panel.name

  // If parent is not found, ask for it
  if (!parentFolderId && (!update || !parent)) {
    const defaultFolderId = oldFolder?.id ?? BKM_OTHER_ID
    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.save_in_bookmarks'),
      name: folderName,
      nameField: true,
      location: defaultFolderId,
      locationField: true,
      locationTree: false,
      recentLocations: true,
      controls: [{ label: 'btn.save' }],
      validate: popupState => {
        const ctrl = popupState.controls?.[0]
        if (!ctrl) return

        // Update existed
        if (popupState.location === oldFolderId) ctrl.label = 'btn.update'
        else ctrl.label = 'btn.save'
      },
    })
    if (!result?.location || result?.location === NOID) throw Err.Canceled

    parentId = result.location ?? NOID
    parent = Bookmarks.reactive.byId[parentId]

    // If selected parent is prev panel folder use prev parent folder (update mode)
    if (parent && oldFolder && parent?.id === oldFolderId) {
      parentId = oldFolder.parentId
      parent = Bookmarks.reactive.byId[parentId ?? NOID]
      update = true
      index = oldFolder.index
    }

    // Set new name
    if (result.name) folderName = result.name.trim()
  }
  if (!parent) throw Err.Canceled
  if (index === -1) index = parent.children?.length ?? 0

  // Start progress notification
  let progress: Notification | undefined
  if (!silent && panel.tabs.length > 5) {
    progress = Notifications.progress({
      icon: '#icon_bookmarks',
      title: translate('notif.tabs_panel_saving_bookmarks'),
      details: panel.name + ' panel',
    })
  }

  // Config data
  const config = createPanelConfigFromPanel(panel)
  if (config.iconIMGSrc && config.iconIMGSrc.length > 1000) config.iconIMGSrc = undefined
  if (config.iconIMG && config.iconIMG.length > 1000) config.iconIMG = undefined
  const confJSON = JSON.stringify(config)
  const dataPrefix = 'data:application/x-sidebery-panel;charset=UTF-8,'
  const folderNameWithConfig = `${folderName} [${dataPrefix}${confJSON}]`

  // Create/Update panel folder
  let panelFolder: Bookmark | undefined

  // If panel folder is exists, update its name
  if (oldFolder) {
    panelFolder = oldFolder
    try {
      await browser.bookmarks.update(panelFolder.id, { title: folderNameWithConfig })
    } catch (err) {
      if (!silent) {
        Logs.err('Sidebar.bookmarkTabsPanel: Cannot update panel folder')
        const title = translate('notif.tabs_panel_to_bookmarks_err')
        const details = translate('notif.tabs_panel_to_bookmarks_err.folder_upd')
        Notifications.err(title, details)
      }
      throw err
    }
  }

  // Or create new folder
  else {
    const parentConf = { title: folderNameWithConfig, index, parentId: parent.id }
    try {
      panelFolder = (await browser.bookmarks.create(parentConf)) as Bookmark
    } catch (err) {
      if (!silent) {
        Logs.err('Sidebar.bookmarkTabsPanel: Cannot create panel folder')
        const title = translate('notif.tabs_panel_to_bookmarks_err')
        const details = translate('notif.tabs_panel_to_bookmarks_err.folder')
        Notifications.err(title, details)
      }
      throw err
    }
  }

  const panelFolderId = panelFolder.id
  const items: ItemInfo[] = []
  const dst: DstPlaceInfo = { parentId: panelFolderId }

  for (const rTab of panel.tabs) {
    const tab = Tabs.byId[rTab.id]
    if (!tab) continue
    const info: ItemInfo = { id: tab.id, title: tab.title, url: tab.url, parentId: tab.parentId }
    if (Containers.reactive.byId[tab.cookieStoreId]) info.container = tab.cookieStoreId
    items.push(info)
  }

  if (items.length) {
    try {
      await Bookmarks.saveToFolder(items, dst, false, progress)
    } catch (err) {
      if (!silent) {
        Logs.err('Tabs.bookmarkTabsPanel: Cannot save bookmarks', err)
        const title = translate('notif.tabs_panel_to_bookmarks_err')
        const details = translate('notif.tabs_panel_to_bookmarks_err.bookmarks')
        Notifications.err(title, details)
      }
      throw err
    }
  }

  // Update and save tabs panel
  if (panel.bookmarksFolderId !== panelFolderId) {
    panel.bookmarksFolderId = panelFolderId
    Sidebar.saveSidebar(300)
  }

  // Stop progress notification and show notification about successfull opperrattionnn
  if (!silent) {
    if (progress) Notifications.finishProgress(progress, 120)
    await Utils.sleep(250)
    Notifications.notify({ icon: '#icon_bookmarks', title: translate('notif.done') })
  }
}

export function setViewMode(panel: BookmarksPanel, mode: string): void {
  panel.viewMode = mode
  Sidebar.saveSidebar(300)
}

export async function restoreFromBookmarks(panel: TabsPanel, silent?: boolean): Promise<void> {
  if (!Bookmarks.reactive.tree.length) await Bookmarks.load()

  let panelFolder = Bookmarks.reactive.byId[panel.bookmarksFolderId]
  if (!panelFolder) {
    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.restore'),
      location: BKM_OTHER_ID,
      locationField: true,
      locationTree: false,
      recentLocations: true,
      controls: [{ label: 'btn.restore' }],
    })
    if (!result?.location || result?.location === NOID) throw Err.Canceled
    panelFolder = Bookmarks.reactive.byId[result.location]
  }
  if (!panelFolder) {
    const title = translate('notif.restore_from_bookmarks_err')
    const details = translate('notif.restore_from_bookmarks_err.root')
    Notifications.err(title, details)
    throw Logs.warn('Restoring panel from bookmarks: Root folder not found')
  }
  if (!panelFolder.children?.length) {
    throw Logs.warn('Restoring panel from bookmarks: Root folder is empty')
  }

  // Restoring panel's config
  let panelName: string | undefined
  let panelConf: TabsPanelConfig | undefined
  const panelConfExec = BOOKMARKED_PANEL_CONF_RE.exec(panelFolder.title)
  if (panelConfExec) {
    panelName = panelConfExec[1]
    const json = panelConfExec[2]
    try {
      panelConf = JSON.parse(json) as TabsPanelConfig
    } catch (err) {
      Logs.err('Restoring panel from bookmarks: Cannot parse panel config, skipping...', err)
    }
  }
  if (panelConf) {
    panelConf.id = panel.id
    panelConf.name = panelName ?? panelFolder.title
    panelConf.bookmarksFolderId = panelFolder.id
    Utils.updateObject(panel, panelConf)
  } else {
    panel.name = panelFolder.title
    panel.bookmarksFolderId = panelFolder.id
  }
  Sidebar.saveSidebar()

  const panelTabs = Utils.cloneArray(panel.tabs)
  const idsMap: Record<ID, ID> = {}
  const reusedTabs: Record<ID, Tab> = {}
  const usedAsParent: Record<ID, true> = {}
  let index = panel.startTabIndex
  for (const node of Bookmarks.listBookmarks(panelFolder.children)) {
    if (usedAsParent[node.id]) continue
    if (node.type === 'separator') continue

    const info: ItemInfo = { id: node.id, title: node.title, parentId: node.parentId }
    const data = Bookmarks.removeDataFromTitle(info)
    let rawUrl = node.url

    if (data) {
      const container = Containers.findUnique(Containers.parseCUID(data))
      if (container) info.container = container.id
    }

    // Get target lvl
    let lvl = 0
    let parent = Bookmarks.reactive.byId[node.parentId]
    while (parent && parent.id !== panelFolder.id) {
      parent = Bookmarks.reactive.byId[parent.parentId]
      lvl++
    }

    // Set url for parent
    if (!node.url && node.children) {
      const firstChild = node.children[0]

      // Use first child for parent tab
      if (firstChild && firstChild.url && firstChild.title === node.title) {
        rawUrl = firstChild.url
        info.url = Utils.normalizeUrl(firstChild.url, firstChild.title)
        usedAsParent[firstChild.id] = true
      }

      // Create group
      else {
        const titleExec = FOLDER_NAME_DATA_RE.exec(node.title)
        info.url = Utils.createGroupUrl(titleExec ? titleExec[1] : node.title)
        rawUrl = info.url
      }
    }

    // Set url for bookmark node
    else {
      info.url = Utils.normalizeUrl(node.url, node.title)
    }

    // Find existed tab
    const existedTabIndex = panelTabs.findIndex(t => {
      return (t.url === rawUrl || t.url === info.url) && t.title === info.title && !reusedTabs[t.id]
    })
    const existedReactiveTab = panel.tabs[existedTabIndex]
    const existedTab = Tabs.byId[existedReactiveTab?.id]

    // Move existed tab
    if (existedTab) {
      reusedTabs[existedTab.id] = existedTab
      info.id = existedTab.id

      if (index !== existedTab.index || lvl !== existedTab.lvl) {
        // Do not separate branch
        let sameIndexTab = Tabs.list[index]
        while (sameIndexTab && sameIndexTab.lvl > lvl) {
          sameIndexTab = Tabs.list[++index]
        }

        const toMove = Tabs.getBranch(existedTab)
        const src = { panelId: panel.id, windowId: Windows.id }
        const dst = {
          windowId: Windows.id,
          index,
          panelId: panel.id,
          parentId: idsMap[info.parentId ?? NOID] ?? NOID,
        }
        await Tabs.move(toMove, src, dst)
      }
      idsMap[node.id] = existedTab.id
    }

    // Create new tab
    else {
      // Do not separate branch
      let sameIndexTab = Tabs.list[index]
      while (sameIndexTab && sameIndexTab.lvl > lvl) {
        sameIndexTab = Tabs.list[++index]
      }

      const conf: browser.tabs.CreateProperties = {
        index: index,
        url: info.url,
        windowId: Windows.id,
        active: false,
        cookieStoreId: info.container,
      }
      const isDefaultContainer = !conf.cookieStoreId || conf.cookieStoreId === CONTAINER_ID
      const parentId = idsMap[info.parentId ?? NOID] ?? NOID
      if (conf.url && !conf.url.startsWith('about') && isDefaultContainer) {
        conf.discarded = true
        conf.title = info.title
      }
      Tabs.setNewTabPosition(index, parentId, panel.id)
      const newTab = await browser.tabs.create(conf)
      idsMap[info.id] = newTab.id
    }

    index++
  }

  if (!silent) {
    Notifications.notify({ title: translate('notif.restore_from_bookmarks_ok') })
  }
}

let updateSidebarTitleTimeout: number | undefined
export function updateSidebarTitle(delay = 456): void {
  clearTimeout(updateSidebarTitleTimeout)
  updateSidebarTitleTimeout = setTimeout(() => {
    if (Settings.state.updateSidebarTitle) {
      const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
      if (!panel) return

      browser.sidebarAction.setTitle({ title: panel.name, windowId: Windows.id })
    } else {
      browser.sidebarAction.setTitle({ title: 'Sidebery', windowId: Windows.id })
    }
  }, delay)
}

export async function convertToBookmarksPanel(panel: TabsPanel): Promise<void> {
  if (Sidebar.convertingPanelLock) return
  Sidebar.convertingPanelLock = true

  const index = Sidebar.reactive.nav.indexOf(panel.id)
  if (index === -1) {
    Sidebar.convertingPanelLock = false
    return
  }

  const isActive = Sidebar.reactive.activePanelId === panel.id

  const notif = Notifications.progress({
    icon: panel.iconIMG || (panel.iconSVG ? '#' + panel.iconSVG : undefined),
    iconColor: panel.color,
    title: translate('notif.converting'),
    progress: { percent: -1 },
  })

  // Load bookmarks if needed
  if (!Bookmarks.reactive.tree.length) await Bookmarks.load()

  const oldFolderId = panel.bookmarksFolderId
  const oldFolder = Bookmarks.reactive.byId[oldFolderId]

  // Ask where to store
  let targetFolderId: ID | undefined
  if (!oldFolder) {
    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.convert'),
      location: BKM_OTHER_ID,
      locationField: true,
      locationTree: false,
      recentLocations: true,
      controls: [{ label: translate('popup.bookmarks.convert') }],
    })
    if (!result) {
      Notifications.finishProgress(notif)
      Sidebar.convertingPanelLock = false
      return
    }
    if (result.location) targetFolderId = result.location
  }

  // Bookmark panel (Create or Update bookmarks)
  if (panel.tabs.length) {
    try {
      await Sidebar.bookmarkTabsPanel(panel.id, true, true, targetFolderId)
    } catch (err) {
      Notifications.finishProgress(notif)
      Sidebar.convertingPanelLock = false
      if (err !== Err.Canceled) {
        Logs.err('Sidebar.convertToBookmarksPanel:bookmarkTabsPanel', err)
      }
      return
    }
  }

  // Close tabs
  const tabsIds = panel.tabs.map(t => t.id)
  if (Tabs.list.length === tabsIds.length) await browser.tabs.create({})
  if (tabsIds.length) await Tabs.removeTabs(tabsIds, true)

  // Check if all tabs actualy removed
  if (tabsIds.length) {
    const allRemoved = await Tabs.isRemovingFinished()
    if (!allRemoved) {
      Notifications.finishProgress(notif)
      Sidebar.convertingPanelLock = false
      return Logs.warn('Sidebar.convertToBookmarksPanel: Cannot remove panel: Panel is not empty')
    }
  }

  // Create bookmarks panel
  const bookmarksPanel = Sidebar.createBookmarksPanel({
    name: panel.name,
    rootId: panel.bookmarksFolderId,
  })
  Sidebar.reactive.nav[index] = bookmarksPanel.id
  if (panel.iconSVG) {
    if (panel.iconSVG === 'icon_tabs') bookmarksPanel.iconSVG = 'icon_bookmarks'
    else bookmarksPanel.iconSVG = panel.iconSVG
  }
  if (panel.color) bookmarksPanel.color = panel.color
  if (panel.iconIMG) bookmarksPanel.iconIMG = panel.iconIMG
  if (panel.iconIMGSrc) bookmarksPanel.iconIMGSrc = panel.iconIMGSrc
  bookmarksPanel.autoConvert = true

  // Temporarily lock panel to prevent switching from it
  if (isActive && !bookmarksPanel.lockedPanel) {
    bookmarksPanel.lockedPanel = true
    setTimeout(() => {
      bookmarksPanel.lockedPanel = false
      Sidebar.saveSidebar(300)
    }, 200)
  }

  // Remove tabs panel
  Sidebar.recalcPanels()
  Sidebar.recalcBookmarksPanels()
  if (isActive) Sidebar.activatePanel(bookmarksPanel.id)
  delete Sidebar.reactive.panelsById[panel.id]
  Sidebar.saveSidebar(500)

  Notifications.finishProgress(notif, 2000)
  notif.title = translate('notif.done')
  Sidebar.convertingPanelLock = false
}

export async function convertToTabsPanel(panel: BookmarksPanel): Promise<void> {
  if (Sidebar.convertingPanelLock) return
  Sidebar.convertingPanelLock = true

  const index = Sidebar.reactive.nav.indexOf(panel.id)
  if (index === -1) {
    Sidebar.convertingPanelLock = false
    return
  }

  const notif = Notifications.progress({
    icon: panel.iconIMG || (panel.iconSVG ? '#' + panel.iconSVG : undefined),
    iconColor: panel.color,
    title: translate('notif.converting'),
    progress: { percent: -1 },
  })

  // Load bookmarks if needed
  if (!Bookmarks.reactive.tree.length) await Bookmarks.load()

  // Check if root folder exists
  const rootFolder = Bookmarks.reactive.byId[panel.rootId]
  if (!rootFolder) {
    Notifications.finishProgress(notif)
    Sidebar.convertingPanelLock = false
    return Logs.warn('Sidebar.convertToTabsPanel: No root folder')
  }

  // Create tabs panel
  const isFirstTabsPanel = !Sidebar.hasTabs
  const tabsPanel = Sidebar.createTabsPanel({ name: panel.name })
  Sidebar.reactive.nav[index] = tabsPanel.id
  delete Sidebar.reactive.panelsById[panel.id]
  Sidebar.recalcPanels()
  Sidebar.recalcTabsPanels()
  Sidebar.activatePanel(tabsPanel.id, false)

  if (isFirstTabsPanel) await Tabs.load()

  // Open tabs
  tabsPanel.bookmarksFolderId = panel.rootId
  try {
    await Sidebar.restoreFromBookmarks(tabsPanel, true)
  } catch (err) {
    Notifications.finishProgress(notif)
    Sidebar.convertingPanelLock = false
    if (err !== Err.Canceled) Logs.err('Sidebar.convertToTabsPanel: Cannot restore tabs', err)
    return
  }

  // Set src panel's props
  if (panel.iconSVG) {
    if (panel.iconSVG === 'icon_bookmarks') tabsPanel.iconSVG = 'icon_tabs'
    else tabsPanel.iconSVG = panel.iconSVG
  }
  if (panel.color) tabsPanel.color = panel.color
  if (panel.iconIMG) tabsPanel.iconIMG = panel.iconIMG
  if (panel.iconIMGSrc) tabsPanel.iconIMGSrc = panel.iconIMGSrc

  Sidebar.saveSidebar(300)

  Notifications.finishProgress(notif, 2000)
  notif.title = translate('notif.done')
  Sidebar.convertingPanelLock = false
}

export function startFastEditingOfPanel(panelId: ID, removeOnCancel: boolean): Promise<boolean> {
  return new Promise(res => {
    const panel = Sidebar.reactive.panelsById[panelId]
    if (!panel) return res(false)

    const fallbackIcon = Utils.isTabsPanel(panel) ? 'icon_tabs' : 'icon_bookmarks'

    Sidebar.reactive.panelConfigPopup = {
      id: panel.id,
      name: panel.name,
      color: panel.color,
      iconSVG: panel.iconSVG ?? fallbackIcon,
      removeOnCancel,
      done: res,
    }
  })
}

export function stopFastEditingOfPanel(result: boolean): void {
  if (Sidebar.reactive.panelConfigPopup?.done) Sidebar.reactive.panelConfigPopup.done(result)
  Sidebar.reactive.panelConfigPopup = null
}

export function startFastEditingOfContainer(
  containerId: ID,
  removeOnCancel: boolean
): Promise<boolean> {
  return new Promise(res => {
    const container = Containers.reactive.byId[containerId]
    if (!container) return res(false)

    Sidebar.reactive.containerConfigPopup = {
      id: container.id,
      name: container.name,
      color: container.color,
      icon: container.icon,
      removeOnCancel,
      done: res,
    }
  })
}

export function stopFastEditingOfContainer(result: boolean): void {
  if (Sidebar.reactive.containerConfigPopup?.done) {
    Sidebar.reactive.containerConfigPopup.done(result)
  }
  Sidebar.reactive.containerConfigPopup = null
}

const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
export function scrollActivePanel(y: number, offset?: boolean): void {
  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!panel?.scrollEl) return

  if (offset) scrollConf.top = panel.scrollEl.scrollTop - y
  else scrollConf.top = y
  panel.scrollEl.scroll(scrollConf)
}

let switchPanelBackTimeout: number | undefined
export function switchPanelBackResetTimeout(): void {
  clearTimeout(switchPanelBackTimeout)
}
export function switchPanelBack(delay: number): void {
  clearTimeout(switchPanelBackTimeout)
  switchPanelBackTimeout = setTimeout(() => {
    const prevPanel = Sidebar.reactive.panelsById[Sidebar.lastTabsPanelId]
    if (prevPanel) Sidebar.switchToPanel(prevPanel.id)
  }, delay)
}

export async function upgrade(): Promise<void> {
  Sidebar.reactive.upgrading = { active: true, init: 'in-progress' }

  while (true) {
    // Wait before send request
    await Utils.sleep(123)

    let upgradeState
    try {
      upgradeState = await IPC.bg('checkUpgrade')
    } catch {
      break
    }

    if (!upgradeState) {
      break
    }

    if (Sidebar.reactive.upgrading) {
      Sidebar.reactive.upgrading.init = upgradeState.init
      Sidebar.reactive.upgrading.settings = upgradeState.settings
      Sidebar.reactive.upgrading.sidebar = upgradeState.sidebar
      Sidebar.reactive.upgrading.snapshots = upgradeState.snapshots
      Sidebar.reactive.upgrading.favicons = upgradeState.favicons
      Sidebar.reactive.upgrading.styles = upgradeState.styles
      Sidebar.reactive.upgrading.error = upgradeState.error
      Sidebar.reactive.upgrading.done = upgradeState.done
    }

    if (upgradeState.done || upgradeState.error) break
  }
}
