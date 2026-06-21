import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import * as T from 'src/types'
import * as E from 'src/enums'
import * as D from 'src/defaults'
import * as Logs from 'src/services/logs'
import * as Settings from 'src/services/settings'
import * as Windows from 'src/services/windows.fg'
import * as Selection from 'src/services/selection.fg'
import * as Containers from 'src/services/containers'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Menu from 'src/services/menu.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as IPC from 'src/services/ipc'
import * as Store from 'src/services/storage.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as History from 'src/services/history.fg'
import * as Search from 'src/services/search.fg'
import * as Info from 'src/services/info'
import * as Permissions from 'src/services/permissions.fg'
import * as Notifications from 'src/services/notifications.fg'
import * as Popups from 'src/services/popups.fg'
import { turnOffBeforeRequestHandler, turnOnBeforeRequestHandler } from 'src/services/web-req.fg'
import * as SidebarConf from 'src/services/sidebar-config'
import * as Sync from 'src/services/sync.fg'

export interface SidebarReactiveState {
  nav: ID[]

  activePanelId: ID

  horNavWidth: number
  navBtnWidth: number
  navBtnMargin: number

  hiddenPanelsPopup: boolean
  hiddenPanelsPopupOffset: number
  hiddenPanelsPopupOffsetSide: 'start' | 'end'

  selectedNavId: ID
  selectedHeader: ID
  selLenBadgeTarget: null | string | HTMLElement
  selLen: number

  subPanelActive: boolean
  subPanelType: E.SubPanelType
}

export interface SubPanels {
  bookmarks?: T.BookmarksPanel
}

export let reactive: SidebarReactiveState = {
  nav: [],

  activePanelId: D.NOID,

  horNavWidth: 0,
  navBtnWidth: 0,
  navBtnMargin: 0,

  hiddenPanelsPopup: false,
  hiddenPanelsPopupOffset: 0,
  hiddenPanelsPopupOffsetSide: 'start',

  selectedNavId: D.NOID,
  selectedHeader: D.NOID,
  selLenBadgeTarget: null,
  selLen: 0,

  subPanelActive: false,
  subPanelType: E.SubPanelType.Null,
}

export let activePanelId = D.NOID
export const setActivePanelId = (id: ID) => {
  if (activePanelId === id) return
  const prevId = activePanelId
  reactive.activePanelId = activePanelId = id
  IPC.bg('setActivePanelId', Windows.id, id)
  saveActivePanelDebounced(1000)

  const panel = panelsById[id]
  const prevPanel = panelsById[prevId]
  if (panel && prevPanel) {
    if (panel.index > prevPanel.index) {
      panel.reactive.pos = 'rc'
      prevPanel.reactive.pos = 'l'
    } else if (panel.index < prevPanel.index) {
      panel.reactive.pos = 'lc'
      prevPanel.reactive.pos = 'r'
    } else {
      panel.reactive.pos = 'c'
      prevPanel.reactive.pos = 'h'
    }
  } else if (panel) {
    panel.reactive.pos = 'c'
  }
}
export let prevActivePanelId = D.NOID
export let prevTabsPanelId = D.NOID
export let panelsById: Record<ID, T.Panel> = {}
export const setPanelsById = (p: Record<ID, T.Panel>) => (panelsById = p)
export let panels: T.Panel[] = []
export const setPanels = (p: T.Panel[]) => (panels = p)
export let nav: ID[] = []
export const setNav = (n: ID[]) => (nav = n)
export let ready = false
export const setReadyState = (s: boolean) => (ready = s)
export let hasTabs = false
export let hasBookmarks = false
export let hasHistory = false
export let hasSync = false
export const setHasPanelTypeState = (t: E.PanelType, s: boolean) => {
  if (t === E.PanelType.tabs) hasTabs = s
  else if (t === E.PanelType.bookmarks) hasBookmarks = s
  else if (t === E.PanelType.history) hasHistory = s
  else if (t === E.PanelType.sync) hasSync = s
}
export const scrollPositions: Partial<Record<ID, number>> = {}
export let convertingPanelLock = false

export let subPanelActive = false
export let subPanelType = E.SubPanelType.Null
export const subPanels: SubPanels = {}

export let width = 0
export let height = 0
export let scrollAreaRightX = 0
export let scrollAreaLeftX = 0
export let panelsTop = 0
export let tabHeight = 0
export let tabMargin = 0
export let bookmarkHeight = 0
export let folderHeight = 0
export let separatorHeight = 0
export let bookmarkMargin = 0
export let switchingLock = false
export let switchOnMouseLeave = false
export const setSwitchOnMouseLeaveState = (s: boolean) => (switchOnMouseLeave = s)
export let scrollOnMouseLeave = false
export const setScrollOnMouseLeaveState = (s: boolean) => (scrollOnMouseLeave = s)

export let reMountSidebar: null | (() => void) = null
export const setReMountSidebarFn = (fn: () => void) => (reMountSidebar = fn)
export let selectPanel: null | ((dir: 1 | -1) => void) = null
export const setSelectPanelFn = (fn: (dir: 1 | -1) => void) => (selectPanel = fn)
export let scrollHiddenPanelsPopupTo: null | ((id: ID) => void) = null
export const setScrollHiddenPanelsPopupToFn = (fn: (id: ID) => void) =>
  (scrollHiddenPanelsPopupTo = fn)

interface PanelElements {
  scrollBox: HTMLElement
}

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function reactivate(r: T.Reactivator<any>) {
  reactive = r(reactive)
  reactFn = r
}

export function setupListeners(): void {
  if (Info.isSetup) Store.onKeyChange('sidebar', updateSidebarInSetup)
  if (Info.isSidebar) {
    Store.onKeyChange('sidebar', updateSidebar)
    window.addEventListener('resize', onSidebarResize)
  }
}

export function resetListeners(): void {
  window.removeEventListener('resize', onSidebarResize)
}

let rootEl: HTMLElement | null = null
export function registerRootEl(el: HTMLElement): void {
  rootEl = el
}

let horizontalNavBarEl: HTMLElement | undefined
export function registerHorizontalNavBarEl(el: HTMLElement): void {
  horizontalNavBarEl = el
}

async function loadSidebarConfig() {
  const msp = browser.storage.managed.get<T.Stored>('sidebar').catch(() => undefined)
  const psp = browser.storage.local.get<T.Stored>('lastFocusedActivePanelId').catch(() => undefined)
  const lsp = Utils.pending({
    action: () => browser.storage.local.get<T.Stored>('sidebar').catch(() => undefined),
    check: storage => !!storage?.sidebar?.nav?.length,
    interval: 250,
    tryCount: 20,
  })

  const [ms, ps, ls] = await Promise.all([msp, psp, lsp])
  if (ms?.sidebar) {
    if (ps?.lastFocusedActivePanelId) Object.assign(ms, ps)
    return ms
  }

  if (ls?.sidebar) {
    if (ps?.lastFocusedActivePanelId) Object.assign(ls, ps)
    return ls
  }

  return {}
}

export async function loadPanels(): Promise<void> {
  const ts = performance.now()
  Logs.info('Sidebar.loadPanels')

  const [storage, activeId, hiddenPanels] = await Promise.all([
    loadSidebarConfig(),
    browser.sessions.getWindowValue<ID>(Windows.id, 'activePanelId').catch(() => undefined),
    browser.sessions.getWindowValue<ID[]>(Windows.id, 'hiddenPanels').catch(() => undefined),
  ])

  if (!storage.sidebar?.nav?.length) {
    Logs.warn('Sidebar.loadPanels: No sidebar config: Creating default sidebar config')
    storage.sidebar = SidebarConf.createDefaultSidebarConfig()
  }

  const sidebar = storage.sidebar
  const lastFocusedActivePanelId = storage.lastFocusedActivePanelId
  const panelConfigs = sidebar?.panels ? Object.values(sidebar?.panels) : []
  if (sidebar?.nav) {
    reactive.nav = sidebar.nav
    nav = sidebar.nav
  }

  // Create panels from config
  for (const panelConfig of panelConfigs) {
    const panel = createPanelFromConfig(panelConfig)
    if (!panel) continue

    if (Utils.isTabsPanel(panel)) {
      const newTabContainer = panel.newTabCtx ? Containers.reactive.byId[panel.newTabCtx] : null
      if (panel.newTabCtx !== D.DEFAULT_CONTAINER_ID && !newTabContainer) panel.newTabCtx = 'none'
    }

    panel.reactive.tooltip = getPanelTooltip(panel)

    if (hiddenPanels?.length && hiddenPanels.includes(panel.id)) {
      panel.hidden = true
      panel.reactive.hidden = true
    }

    panelsById[panel.id] = panel
  }

  recalcPanels()
  Tabs.recalcMoveRules()

  // Activate last active panel
  if (!Windows.incognito) {
    let actPanel: T.Panel | undefined
    if (activeId !== undefined) actPanel = panelsById[activeId]
    if (!actPanel && lastFocusedActivePanelId) actPanel = panelsById[lastFocusedActivePanelId]
    if (!actPanel) actPanel = panels.find(p => p.type === E.PanelType.tabs)
    if (actPanel) setActivePanelId(actPanel.id)
    else setActivePanelId(panels[0]?.id ?? D.NOID)
    prevActivePanelId = activePanelId
  } else {
    const tabsPanel = panels.find(p => p.type === E.PanelType.tabs)
    if (tabsPanel) setActivePanelId(tabsPanel.id)
    else setActivePanelId(panels[0]?.id ?? D.NOID)
    prevActivePanelId = activePanelId
  }

  ready = true

  Logs.info(`Sidebar.loadPanels: Done: ${performance.now() - ts}ms`)
}

let resizeTimeout: number | undefined
function onSidebarResize(): void {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    // Changed width
    if (width !== document.body.offsetWidth) {
      width = document.body.offsetWidth

      if (horizontalNavBarEl) {
        reactive.horNavWidth = horizontalNavBarEl.offsetWidth
      }

      if (panelsBoxEl && !Settings.state.scrollThroughTabsExceptOverflow) {
        const panelsBoxBounds = panelsBoxEl.getBoundingClientRect()
        const area = Settings.state.scrollThroughTabsScrollArea
        if (area >= 0) {
          scrollAreaRightX = panelsBoxBounds.right - area
          scrollAreaLeftX = 0
        } else if (area < 0) {
          scrollAreaRightX = 0
          scrollAreaLeftX = panelsBoxBounds.left - area
        }
      }
    }

    // Changed height
    if (height !== document.body.offsetHeight) {
      height = document.body.offsetHeight

      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === activePanelId) {
        Tabs.scrollToTab(activeTab.id)
      }
    }
  }, 120)
}

export function recalcElementSizes(): void {
  if (!rootEl) return
  const compStyle = getComputedStyle(rootEl)

  const nbwRaw = compStyle.getPropertyValue('--nav-btn-width')
  reactive.navBtnWidth = Utils.parseCSSNum(nbwRaw.trim())[0]

  const nbmRaw = compStyle.getPropertyValue('--nav-btn-margin')
  reactive.navBtnMargin = Utils.parseCSSNum(nbmRaw.trim())[0]

  const thRaw = compStyle.getPropertyValue('--tabs-height')
  tabHeight = Utils.parseCSSNum(thRaw.trim())[0]

  const tmRaw = compStyle.getPropertyValue('--tabs-margin')
  tabMargin = Utils.parseCSSNum(tmRaw.trim())[0]

  const bhRaw = compStyle.getPropertyValue('--bookmarks-bookmark-height')
  bookmarkHeight = Utils.parseCSSNum(bhRaw.trim())[0]

  const fhRaw = compStyle.getPropertyValue('--bookmarks-folder-height')
  folderHeight = Utils.parseCSSNum(fhRaw.trim())[0]

  const shRaw = compStyle.getPropertyValue('--bookmarks-separator-height')
  separatorHeight = Utils.parseCSSNum(shRaw.trim())[0]

  const bmRaw = compStyle.getPropertyValue('--bookmarks-margin')
  bookmarkMargin = Utils.parseCSSNum(bmRaw.trim())[0]
}
let recalcElementSizesTimeout: number | undefined
export function recalcElementSizesDebounced(delay = 500): void {
  clearTimeout(recalcElementSizesTimeout)
  recalcElementSizesTimeout = setTimeout(recalcElementSizes, delay)
}

export function recalcSidebarSize(): void {
  setTimeout(() => {
    width = document.body.offsetWidth
    height = document.body.offsetHeight

    if (panelsBoxEl && !Settings.state.scrollThroughTabsExceptOverflow) {
      const panelsBoxBounds = panelsBoxEl.getBoundingClientRect()
      const area = Settings.state.scrollThroughTabsScrollArea
      if (area >= 0) {
        scrollAreaRightX = panelsBoxBounds.right - area
        scrollAreaLeftX = 0
      } else if (area < 0) {
        scrollAreaRightX = 0
        scrollAreaLeftX = panelsBoxBounds.left - area
      }
    } else {
      scrollAreaRightX = 0
      scrollAreaLeftX = 0
    }

    if (horizontalNavBarEl) {
      reactive.horNavWidth = horizontalNavBarEl.offsetWidth
    }
  }, 500)
}

export function recalcTabsPanels(reset?: boolean): void {
  // Logs.info('Sidebar.recalcTabsPanels', reset)
  const pinnedTabIds: ID[] = []
  const pinnedTabs: T.Tab[] = []
  const pinnedTabIdsByPanel: Record<ID, ID[]> = {}
  const pinnedTabsByPanel: Record<ID, T.Tab[]> = {}
  const pinnedInPanel = Settings.state.pinnedTabsPosition === 'panel'
  const discarded: Record<ID, boolean> = {}
  let tabIndex = 0
  let tabPanelIndex = 0
  let same = !reset
  let samePinned = !reset
  let tab: T.Tab | undefined
  let startIndex = -1

  const firstTabsPanel = panels.find(p => Utils.isTabsPanel(p))
  for (; (tab = Tabs.list[tabIndex])?.pinned; tabIndex++) {
    if (samePinned && Tabs.pinned[tabIndex]?.id !== tab.id) samePinned = false

    if (pinnedInPanel) {
      let panel = panelsById[tab.panelId]
      if (!panel) {
        Logs.warn('Cannot find panel for pinned tab', tab.panelId)
        if (firstTabsPanel) {
          tab.panelId = firstTabsPanel.id
          panel = firstTabsPanel
        } else {
          tab.panelId = D.NOID
          continue
        }
      }
      let pinnedTabIdsOfPanel = pinnedTabIdsByPanel[panel.id]
      let pinnedTabsOfPanel = pinnedTabsByPanel[panel.id]
      if (!pinnedTabsOfPanel) {
        pinnedTabIdsOfPanel = pinnedTabIdsByPanel[panel.id] = []
        pinnedTabsOfPanel = pinnedTabsByPanel[panel.id] = []
      }
      if (Utils.isTabsPanel(panel)) {
        pinnedTabIdsOfPanel.push(tab.id)
        pinnedTabsOfPanel.push(tab)
      }

      if (discarded[panel.id] === undefined) discarded[panel.id] = true
      if (!tab.discarded && discarded[panel.id]) discarded[panel.id] = false
    }

    pinnedTabIds.push(tab.id)
    pinnedTabs.push(tab)
  }

  for (const panel of panels) {
    if (!Utils.isTabsPanel(panel)) continue

    const panelId = panel.id
    if (discarded[panelId] === undefined) discarded[panelId] = true

    const pinnedTabIdsOfPanel = pinnedTabIdsByPanel[panelId]
    const pinnedTabsOfPanel = pinnedTabsByPanel[panelId]
    if (pinnedTabsOfPanel) {
      panel.pinnedTabs = pinnedTabsOfPanel
      panel.reactive.pinnedTabIds = pinnedTabIdsOfPanel
    } else if (panel.pinnedTabs.length > 0) {
      panel.pinnedTabs = []
      panel.reactive.pinnedTabIds = []
    }

    const panelTabIds: ID[] = []
    const panelTabs: T.Tab[] = []
    for (; (tab = Tabs.list[tabIndex]); tabIndex++) {
      if (tab.panelId === D.NOID) tab.panelId = panelId
      if (tab.panelId === panelId) {
        if (same && panel.tabs[tabPanelIndex]?.id !== tab.id) same = false
        if (startIndex === -1) startIndex = tab.index
        if (!tab.discarded && discarded[panelId]) discarded[panelId] = false
      } else break

      panelTabIds.push(tab.id)
      panelTabs.push(tab)

      tabPanelIndex++
    }

    let tabsCount = panel.tabs.length
    if (!same || tabsCount !== tabPanelIndex) {
      tabsCount = panelTabs.length
      panel.tabs = panelTabs
    }

    if (tabsCount) {
      panel.reactive.len = tabsCount + panel.pinnedTabs.length
      panel.reactive.empty = false
      panel.startTabIndex = startIndex
      panel.endTabIndex = startIndex + tabsCount - 1
      panel.nextTabIndex = panel.endTabIndex + 1
    } else {
      panel.reactive.len = panel.pinnedTabs.length
      panel.reactive.empty = panel.pinnedTabs.length === 0
      panel.startTabIndex = tabIndex
      panel.endTabIndex = tabIndex
      panel.nextTabIndex = tabIndex
    }

    if (pinnedTabsOfPanel?.length || tabsCount) {
      panel.allDiscarded = !!discarded[panelId]
    } else {
      panel.allDiscarded = false
    }
    panel.reactive.allDiscarded = panel.allDiscarded

    startIndex = -1
    tabPanelIndex = 0
    same = !reset
  }

  if (!samePinned || pinnedTabs.length !== Tabs.pinned.length) {
    Tabs.setPinned(pinnedTabs)
    Tabs.reactive.pinnedIds = pinnedTabIds
  }
}

export function recalcVisibleTabs(panelId?: ID) {
  // Logs.info('Sidebar.recalcVisibleTabs', panelId)
  if (panelId === undefined) {
    for (const panel of panels) {
      if (!Utils.isTabsPanel(panel)) continue
      recalcVisibleTabsInPanel(panel.id)
    }
  } else {
    recalcVisibleTabsInPanel(panelId)
  }
}

function recalcVisibleTabsInPanel(panelId: ID) {
  const panel = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (panel.filteredTabs) panel.reactive.visibleTabIds = panel.filteredTabs.map(t => t.id)
  else {
    const visibleTabIds = []
    for (const tab of panel.tabs) {
      if (!tab.invisible) visibleTabIds.push(tab.id)
    }
    panel.reactive.visibleTabIds = visibleTabIds
  }
}

export function addToVisibleTabs(panelId: ID, tab: T.Tab) {
  const panel = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  // Trigger search, which will update visibleTabIds list
  if (panel.filteredTabs) return Search.search(undefined)

  if (tab.index === panel.endTabIndex) {
    panel.reactive.visibleTabIds.push(tab.id)
    return
  }

  const tabId = tab.id
  let invisibleShift = 0
  const index = panel.tabs.findIndex(t => {
    if (t.invisible) invisibleShift++
    if (t.id === tabId) return true
  })
  if (index === -1) return recalcVisibleTabsInPanel(panelId)

  panel.reactive.visibleTabIds.splice(index - invisibleShift, 0, tabId)
}

export function removeFromVisibleTabs(panelId: ID, tabId: ID) {
  const panel = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const visibleTabIds = panel.reactive.visibleTabIds
  const index = visibleTabIds.indexOf(tabId)
  if (index !== -1) visibleTabIds.splice(index, 1)
}

const checkDiscardedTabsInPanelTimeouts = new Map<ID, number>()
export function checkDiscardedTabsInPanelDebounced(panelId: ID, delay: number) {
  clearTimeout(checkDiscardedTabsInPanelTimeouts.get(panelId))
  const timeout = setTimeout(() => {
    checkDiscardedTabsInPanel(panelId)
  }, delay)
  checkDiscardedTabsInPanelTimeouts.set(panelId, timeout)
}

export function checkDiscardedTabsInPanel(panelId: ID) {
  const panel = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const pinnedTabsLen = panel.pinnedTabs.length
  const tabsLen = panel.tabs.length

  if (tabsLen === 0 && pinnedTabsLen === 0) {
    panel.allDiscarded = false
    panel.reactive.allDiscarded = false
    return
  }

  let discarded = true
  if (pinnedTabsLen && Settings.state.pinnedTabsPosition === 'panel') {
    if (panel.pinnedTabs.some(t => !t.discarded)) discarded = false
  }

  if (discarded) {
    const startIndex = panel.startTabIndex
    const endIndex = panel.endTabIndex
    for (let i = startIndex; i <= endIndex; i++) {
      const tab = Tabs.list[i]
      if (!tab) break
      if (!tab.discarded && discarded) discarded = false
    }
  }

  panel.allDiscarded = discarded
  panel.reactive.allDiscarded = discarded
}

export function recalcBookmarksPanels(): void {
  for (const panel of panels) {
    if (!Utils.isBookmarksPanel(panel)) continue

    const rootFolder = Bookmarks.byId.get(panel.rootId)
    let rootContent: Bookmarks.BkmNode[]
    let count = 0
    if (!panel.rootId || panel.rootId === D.BKM_ROOT_ID || panel.rootId === D.NOID) {
      rootContent = Bookmarks.tree
      count = Bookmarks.overallCount
    } else {
      rootContent = Bookmarks.byId.get(panel.rootId)?.children || []
      count = rootFolder?.len ?? 0
    }

    panel.bookmarks = rootContent
    panel.reactive.bookmarkIds = Bookmarks.getIds(rootContent)
    panel.reactive.len = count
  }

  if (subPanels.bookmarks) {
    const panel = subPanels.bookmarks

    let rootContent: Bookmarks.BkmNode[]
    if (!panel.rootId || panel.rootId === D.BKM_ROOT_ID || panel.rootId === D.NOID) {
      rootContent = Bookmarks.tree
    } else {
      if (panel.reactive.rootOffset > 0) {
        let folder = Bookmarks.byId.get(panel.rootId)
        if (folder) {
          for (let i = panel.reactive.rootOffset; i-- && folder; ) {
            if (folder.parentId === D.BKM_ROOT_ID) {
              folder = undefined
              break
            }
            folder = Bookmarks.byId.get(folder.parentId)
          }
        }
        rootContent = folder?.children ?? Bookmarks.tree
      } else {
        rootContent = Bookmarks.byId.get(panel.rootId)?.children ?? []
      }
    }

    panel.bookmarks = rootContent
    panel.reactive.bookmarkIds = Bookmarks.getIds(rootContent)
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
  const panel = panelsById[id]
  if (panel) panel.scrollEl = els.scrollBox
}

export function setPanelScrollBox(id: ID, scrollBoxComponent: T.ScrollBoxComponent): void {
  const panel = panelsById[id]
  if (panel) panel.scrollComponent = scrollBoxComponent
}

/**
 * Update panel bounds
 */
export function updateBounds(): void {
  let panel = panelsById[activePanelId]
  if (!panel || !panelsBoxEl) return

  let hostPanel
  if (
    Utils.isTabsPanel(panel) &&
    subPanelType === E.SubPanelType.Bookmarks &&
    subPanels.bookmarks
  ) {
    hostPanel = panel
    panel = subPanels.bookmarks
  }
  if (!panel.scrollEl || !panel.ready) return

  const panelContentEl = panel.scrollComponent?.getScrollableBox()
  DnD.setActivePointer(panel.id)
  DnD.updatePointerLeftPosition(panelContentEl?.offsetLeft ?? 0)

  const pb = panel.scrollEl.getBoundingClientRect()
  const bb = panelsBoxEl.getBoundingClientRect()

  panelsTop = bb.top
  panel.topOffset = pb.top
  panel.leftOffset = bb.left
  panel.rightOffset = bb.right
  panel.bottomOffset = pb.bottom

  // Check additional padding
  if (panel.scrollComponent) {
    const scrollableEl = panel.scrollComponent.getScrollableBox()
    const firstChildEl = scrollableEl?.firstElementChild as HTMLElement
    if (firstChildEl?.offsetTop) panel.topOffset += firstChildEl.offsetTop
  }

  if (panel.type === E.PanelType.bookmarks && panel.viewMode === 'tree') {
    panel.bounds = calcBookmarksTreeBounds(panel, hostPanel)
  } else if (panel.type === E.PanelType.bookmarks && panel.viewMode === 'history') {
    panel.bounds = calcBookmarksHistoryBounds(panel)
  } else if (panel.type === E.PanelType.tabs) panel.bounds = calcTabsBounds(panel)
}

/**
 * Calc tabs bounds
 */
function calcTabsBounds(panel: T.TabsPanel): T.ItemBounds[] {
  // Logs.info('Sidebar.calcTabsBounds', panel.id)
  const result: T.ItemBounds[] = []
  const th = tabHeight
  const tm = tabMargin
  if (th === 0) return result
  const half = th >> 1
  const marginA = Math.floor(tm / 2)
  const marginB = Math.ceil(tm / 2)
  const insideA = (half >> 1) + marginB + 2
  const insideB = (half >> 1) + marginB - 2

  let overallHeight = -marginA
  const tabs = panel?.filteredTabs ?? Tabs.list
  const filtered = !!panel?.filteredTabs
  for (const tab of tabs) {
    if ((!filtered && tab.invisible) || tab.pinned) continue
    if (tab.panelId !== panel.id) continue

    result.push({
      type: E.ItemBoundsType.Tab,
      id: tab.id,
      index: tab.index,
      in: !!Settings.state.tabsTree,
      lvl: tab.lvl,
      folded: tab.folded,
      parent: tab.parentId,
      start: overallHeight,
      top: overallHeight + insideA,
      center: overallHeight + marginA + half,
      bottom: overallHeight + marginA + half + insideB,
      end: overallHeight + th + tm,
    })

    overallHeight += th + tm
  }
  return result
}

/**
 * Calc bookmarks tree bounds
 */
function calcBookmarksTreeBounds(panel: T.BookmarksPanel, hostPanel?: T.TabsPanel): T.ItemBounds[] {
  const result: T.ItemBounds[] = []
  if (!Utils.isBookmarksPanel(panel)) return result

  const expPanelId = hostPanel?.id || panel.id
  const expandedBookmarks = Bookmarks.reactive.expanded[expPanelId] ?? {}

  const marginA = Math.floor(bookmarkMargin / 2)

  const folderHalf = folderHeight >> 1
  const folderQuarter = folderHalf >> 1

  const bookmarkHalf = bookmarkHeight >> 1
  const bookmarkQuarter = bookmarkHalf >> 1

  const sepHalf = separatorHeight >> 1
  const sepQuarter = sepHalf >> 1

  let overallHeight = -marginA
  let lvl = 0
  let height: number, half: number, quarter: number
  const walker = (nodes: Bookmarks.BkmNode[]) => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i] as Bookmarks.BkmNode
      const isFolder = n.type === E.BkmType.Folder

      if (isFolder) {
        height = folderHeight
        half = folderHalf
        quarter = folderQuarter
      } else if (n.type === E.BkmType.Bookmark) {
        height = bookmarkHeight
        half = bookmarkHalf
        quarter = bookmarkQuarter
      } else {
        height = separatorHeight
        half = sepHalf
        quarter = sepQuarter
      }

      result.push({
        type: E.ItemBoundsType.Bookmarks,
        id: n.id,
        index: n.index,
        lvl,
        in: isFolder,
        folded: !expandedBookmarks[n.id],
        parent: n.parentId,
        start: overallHeight,
        top: overallHeight + marginA + quarter,
        center: overallHeight + marginA + half,
        bottom: overallHeight + marginA + half + quarter,
        end: overallHeight + height + bookmarkMargin,
      })

      overallHeight += height + bookmarkMargin

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

function calcBookmarksHistoryBounds(panel: T.BookmarksPanel): T.ItemBounds[] {
  if (!Utils.isBookmarksPanel(panel)) return []
  return panel.component?.getBounds() ?? []
}

export function getPanelTooltip(panel: T.Panel): string {
  if (Utils.isTabsPanel(panel)) {
    if (Settings.state.navTabsPanelMidClickAction === 'rm_all') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_rm_all')
    } else if (Settings.state.navTabsPanelMidClickAction === 'rm_rmp') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_rm_rmp')
    } else if (Settings.state.navTabsPanelMidClickAction === 'rm_act_tab') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_rm_act_tab')
    } else if (Settings.state.navTabsPanelMidClickAction === 'discard') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_discard')
    } else if (Settings.state.navTabsPanelMidClickAction === 'hide') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_hide')
    } else if (Settings.state.navTabsPanelMidClickAction === 'bookmark') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_bookmark')
    } else if (Settings.state.navTabsPanelMidClickAction === 'bkm_rmp') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_bkm_rmp')
    } else if (Settings.state.navTabsPanelMidClickAction === 'convert') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_convert')
    } else if (Settings.state.navTabsPanelMidClickAction === 'conv_hide') {
      return panel.name + '\n' + translate('nav.tabs_panel_tooltip_mid_conv_hide')
    }
  }
  if (Utils.isBookmarksPanel(panel)) {
    if (Settings.state.navBookmarksPanelMidClickAction === 'convert') {
      return panel.name + '\n' + translate('nav.bookmarks_panel_tooltip_mid_convert')
    }
  }
  return panel.name
}

export function updatePanelsTooltips(): void {
  for (const panel of panels) {
    panel.reactive.tooltip = getPanelTooltip(panel)
  }
}

export function recalcPanels(): void {
  const recalculatedPanels: T.Panel[] = []
  let index = 0

  hasTabs = false
  hasBookmarks = false
  hasHistory = false
  hasSync = false

  for (const id of reactive.nav) {
    if ((id as string).startsWith('sp-')) continue
    if ((id as string).startsWith('sd-')) continue
    if (id === 'settings') continue
    if (id === 'search') continue
    if (id === 'add_tp') continue
    if (id === 'create_snapshot') continue
    if (id === 'remute_audio_tabs') continue
    if (id === 'collapse') continue
    if (id === 'hdn') continue

    const panel = panelsById[id]
    if (!panel) {
      Utils.rmFromArray(reactive.nav, id)
      continue
    }

    panel.index = index++
    recalculatedPanels.push(panel)

    if (!hasTabs) hasTabs = panel.type === E.PanelType.tabs
    if (!hasBookmarks) hasBookmarks = panel.type === E.PanelType.bookmarks
    if (!hasHistory) hasHistory = panel.type === E.PanelType.history
    if (!hasSync) hasSync = panel.type === E.PanelType.sync
  }

  panels = recalculatedPanels
}

function getSidebarConfig(): T.SidebarConfig {
  const panels: Record<ID, T.PanelConfig> = {}
  for (const id of reactive.nav) {
    const panel = panelsById[id]
    if (panel) panels[id] = createPanelConfigFromPanel(panel)
  }

  return { panels, nav: Utils.cloneArray(reactive.nav) }
}

export function saveSidebar(delay?: number): Promise<void> {
  return Store.set({ sidebar: getSidebarConfig() }, delay)
}

export function moveNavItem(srcIndex: number, dstIndex: number): void {
  if (srcIndex === dstIndex) return

  const targetId = reactive.nav.splice(srcIndex, 1)[0]
  if (targetId === undefined) return

  reactive.nav.splice(dstIndex, 0, targetId)

  const newSidebarConfig = getSidebarConfig()
  updateSidebar(newSidebarConfig)

  saveSidebar(500)
}

export function createPanelFromConfig(config: T.PanelConfig): T.Panel | null {
  let panelDefs: T.Panel
  if (config.id === D.DEFAULT_CONTAINER_ID) panelDefs = D.TABS_PANEL_STATE
  else if (config.type === E.PanelType.tabs) panelDefs = D.TABS_PANEL_STATE
  else if (config.type === E.PanelType.bookmarks) panelDefs = D.BOOKMARKS_PANEL_STATE
  else if (config.type === E.PanelType.history) panelDefs = D.HISTORY_PANEL_STATE
  else if (config.type === E.PanelType.sync) panelDefs = D.SYNC_PANEL_STATE
  else return null

  const panel = Utils.recreateNormalizedObject(config as T.Panel, panelDefs)
  panel.reactive.name = config.name
  panel.reactive.color = config.color
  panel.reactive.iconSVG = config.iconSVG
  panel.reactive.iconIMG = config.iconIMG
  if (Utils.isTabsPanel(panel)) {
    panel.reactive.newTabCtx = panel.newTabCtx
    panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  } else if (Utils.isBookmarksPanel(panel)) {
    panel.reactive.viewMode = panel.viewMode
  }

  if (reactFn) panel.reactive = reactFn(panel.reactive)

  return panel
}

function createPanelConfigFromPanel(srcPanel: T.Panel): T.PanelConfig {
  srcPanel = Utils.cloneObject(srcPanel)
  if (Utils.isTabsPanel(srcPanel)) {
    return Utils.recreateNormalizedObject(srcPanel, D.TABS_PANEL_CONFIG)
  } else if (Utils.isBookmarksPanel(srcPanel)) {
    return Utils.recreateNormalizedObject(srcPanel, D.BOOKMARKS_PANEL_CONFIG)
  } else if (Utils.isHistoryPanel(srcPanel)) {
    return Utils.recreateNormalizedObject(srcPanel, D.HISTORY_PANEL_CONFIG)
  } else if (Utils.isSyncPanel(srcPanel)) {
    return Utils.recreateNormalizedObject(srcPanel, D.SYNC_PANEL_CONFIG)
  }
  throw Logs.err('Sidebar: createPanelConfigFromPanel: Unknown panel type')
}

function updateSidebarInSetup(newConfig?: T.SidebarConfig | null): void {
  if (!newConfig?.nav?.length) newConfig = SidebarConf.createDefaultSidebarConfig()

  const sidebar = newConfig
  const panelConfigs = sidebar?.panels ? Object.values(sidebar?.panels) : []
  if (sidebar?.nav) {
    reactive.nav = sidebar.nav
    nav = sidebar.nav
  }

  // Normalize panels
  const newPanelsMap: Record<ID, T.Panel> = {}
  for (const panelConfig of panelConfigs) {
    const panel = createPanelFromConfig(panelConfig)
    if (!panel) continue

    if (Utils.isTabsPanel(panel)) {
      const newTabContainer = panel.newTabCtx ? Containers.reactive.byId[panel.newTabCtx] : null
      if (panel.newTabCtx !== D.DEFAULT_CONTAINER_ID && !newTabContainer) panel.newTabCtx = 'none'
    }

    newPanelsMap[panel.id] = panel
  }

  panelsById = newPanelsMap
  recalcPanels()
  Tabs.recalcMoveRules()
}

async function updateSidebar(newConfig?: T.SidebarConfig): Promise<void> {
  if (!newConfig) return
  if (!ready) return

  const newPanelConfigs = Object.values(newConfig.panels)
  const newPanelsMap: Record<ID, T.Panel> = {}
  const oldNavItems = reactive.nav
  reactive.nav = newConfig.nav
  nav = newConfig.nav

  const prevHasTabsPanels = hasTabs
  const prevHasBookmarksPanels = hasBookmarks
  const prevHasHistoryPanel = hasHistory
  const prevHasSyncPanel = hasSync

  let tabsSaveNeeded = false
  let tabsPanelId: ID | undefined
  let existedPanelId: ID | undefined
  let webReqHandlerNeeded = false

  // Loop over the new panels
  for (const newPanelConfig of newPanelConfigs) {
    let panel = panelsById[newPanelConfig.id]

    // Update existed panel
    if (panel) {
      Object.assign(panel, newPanelConfig)

      const r = panel.reactive
      r.name = panel.name
      r.color = panel.color
      r.iconSVG = panel.iconSVG
      r.iconIMG = panel.iconIMG

      if (Utils.isTabsPanel(panel)) {
        panel.reactive.newTabCtx = panel.newTabCtx
        panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
      } else if (Utils.isBookmarksPanel(panel)) {
        panel.reactive.viewMode = panel.viewMode
      }
    }

    // or add new panel
    else {
      const newPanel = createPanelFromConfig(newPanelConfig)
      if (!newPanel) throw Logs.err('Sidebar.updateSidebar: Cannot create new panel')
      panel = newPanel
      panelsById[panel.id] = panel
    }

    newPanelsMap[panel.id] = panel

    if (Utils.isTabsPanel(panel)) {
      const newTabContainer = panel.newTabCtx ? Containers.reactive.byId[panel.newTabCtx] : null
      if (panel.newTabCtx !== D.DEFAULT_CONTAINER_ID && !newTabContainer) panel.newTabCtx = 'none'

      if (!webReqHandlerNeeded && Settings.state.newTabCtxReopen && panel.newTabCtx !== 'none') {
        const container = Containers.reactive.byId[panel.newTabCtx]
        if (container) webReqHandlerNeeded = true
      }
    }

    // Save first panel and first tabs panel
    if (!tabsPanelId && panel.type === E.PanelType.tabs) tabsPanelId = panel.id
    if (!existedPanelId) existedPanelId = panel.id

    // Update tooltips
    panel.reactive.tooltip = getPanelTooltip(panel)
  }

  // Loop over the old panels
  for (let index = 0; index < oldNavItems.length; index++) {
    const panelId = oldNavItems[index]
    if (!panelId) continue

    const panel = panelsById[panelId]
    if (!panel) continue

    // Handle removed panels
    if (!newPanelsMap[panel.id]) {
      delete panelsById[panel.id]

      if (Utils.isTabsPanel(panel)) {
        const firstTabsPanel = panels.find(p => {
          return Utils.isTabsPanel(p) && p.id !== panel.id
        }) as T.TabsPanel
        const nearTabsPanelId = Utils.findNear(oldNavItems, index, id => {
          return Utils.isTabsPanel(panelsById[id])
        })

        // Update panelId of removed panel tabs to nearest panel
        for (const tab of Tabs.list) {
          if (tab.pinned && tab.panelId === panel.id) {
            tab.panelId = firstTabsPanel?.id ?? D.NOID
            tabsSaveNeeded = true
          }

          if (!tab.pinned && tab.panelId === panel.id) {
            tab.panelId = nearTabsPanelId ?? D.NOID
            tabsSaveNeeded = true
          }
        }
      }
    } else {
      if (panel.type === E.PanelType.tabs) tabsPanelId = panel.id
      existedPanelId = panel.id
    }
  }

  recalcPanels()
  Tabs.recalcMoveRules()
  if (Settings.state.updateSidebarTitle) updateSidebarTitle()

  if (!prevHasTabsPanels && hasTabs) Tabs.load()
  else if (prevHasTabsPanels && !hasTabs) Tabs.reloadInShadowMode()

  if (!prevHasBookmarksPanels && hasBookmarks) Bookmarks.load()
  else if (prevHasBookmarksPanels && !hasBookmarks) Bookmarks.unload()

  if (!prevHasHistoryPanel && hasHistory) History.load()
  else if (prevHasHistoryPanel && !hasHistory) History.unload()

  if (!prevHasSyncPanel && hasSync) Sync.load()
  else if (prevHasSyncPanel && !hasSync) Sync.unload()

  if (hasTabs) {
    // Get rearrangements for tabs
    const moves: [T.Tab, number][] = []
    let tabIndex = Tabs.list.findIndex(t => !t.pinned)
    if (tabIndex === -1) tabIndex = 0
    for (const panel of panels) {
      if (panel.type !== E.PanelType.tabs) continue

      const panelTabs = Tabs.list.filter(t => !t.pinned && t.panelId === panel.id)
      for (const tab of panelTabs) {
        if (tab.index !== tabIndex) moves.push([tab, tabIndex])
        tabIndex++
      }
    }

    // Move tabs
    if (moves.length) {
      tabsSaveNeeded = true
      Tabs.setIgnoreTabsEventsState(true)
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
            const t = Tabs.list[i]
            if (t) t.index = i
          }
        }
      }
      await Promise.all(moving)
      Tabs.setIgnoreTabsEventsState(false)
    }

    recalcTabsPanels()
    recalcVisibleTabs()

    if (tabsSaveNeeded) {
      Tabs.list.forEach(t => Tabs.saveTabData(t.id))
      Tabs.cacheTabsData()
    }
  }

  if (hasBookmarks) recalcBookmarksPanels()

  // Switch to another panel
  if (!panelsById[activePanelId]) {
    // To active tab's panel
    if (hasTabs && Tabs.byId[Tabs.activeId]) {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab) {
        const targetPanelId = activeTab.panelId
        if (panelsById[targetPanelId]) {
          activatePanel(targetPanelId)
        }
      }
    }

    // To first panel
    if (!panelsById[activePanelId]) {
      const firstPanel = panels[0]
      if (firstPanel) activatePanel(firstPanel.id)
    }
  }

  // On or off web request handler
  if (webReqHandlerNeeded) turnOnBeforeRequestHandler()
  else turnOffBeforeRequestHandler()
}

export function activatePanel(panelId: ID, loadPanels = true, keepSearching?: boolean): void {
  if (activePanelId === panelId) return
  // Logs.info('Sidebar.activatePanel', panelId, loadPanels)

  const prevPanel = panelsById[activePanelId]
  const panel = panelsById[panelId]
  if (!panel) return

  const isTabsPanel = Utils.isTabsPanel(panel)
  const isPrevTabsPanel = Utils.isTabsPanel(prevPanel)

  let loading
  if (loadPanels && !panel.ready) {
    if (isTabsPanel) loading = Tabs.load()
    else if (panel.type === E.PanelType.bookmarks) loading = Bookmarks.load()
    else if (panel.type === E.PanelType.history) loading = History.load()
    else if (panel.type === E.PanelType.sync) loading = Sync.load()
  }

  if (prevPanel) prevActivePanelId = activePanelId
  setActivePanelId(panelId)

  if (Search.active && prevPanel) {
    if (
      keepSearching ||
      Settings.state.searchPanelSwitch === 'any' ||
      (Settings.state.searchPanelSwitch === 'same_type' && prevPanel.type === panel.type) ||
      Search.query.startsWith('. ')
    ) {
      if (loading) loading.then(() => Search.search())
      else Search.search()
    } else {
      Search.stop()
    }
  }

  if (isPrevTabsPanel) prevTabsPanelId = prevPanel.id
  else if (Utils.isHistoryPanel(prevPanel)) History.unloadAfter(30_000)
  else if (Utils.isSyncPanel(prevPanel)) Sync.unloadAfter(5_000)

  if (DnD.reactive.isStarted) DnD.reactive.dstPanelId = panelId

  if (Settings.state.updateSidebarTitle) updateSidebarTitle(0)

  if (subPanelActive) closeSubPanel()

  if (switchOnMouseLeave) switchOnMouseLeave = false

  if (panel.hidden && !reactive.hiddenPanelsPopup) showPanel(panelId)

  if (Settings.updateWinPrefaceOnPanelSwitch) Windows.updWindowPreface()

  // Recalc native tabs visibility if needed (if the active tab is
  // a global pinned tab so it won't switch)
  if (
    Settings.state.hideInact &&
    isTabsPanel &&
    isPrevTabsPanel &&
    Settings.state.pinnedTabsPosition !== 'panel' &&
    Tabs.byId[Tabs.activeId]?.pinned
  ) {
    Tabs.updateNativeTabsVisibility()
  }
}

let prevSavedActPanelId = D.NOID
/**
 * Save active panel id in current window
 */
function saveActivePanel(): void {
  if (Windows.incognito || prevSavedActPanelId === activePanelId) return
  prevSavedActPanelId = activePanelId
  browser.sessions.setWindowValue(Windows.id, 'activePanelId', activePanelId)
}
const saveActivePanelDebounced = Utils.debounce(saveActivePanel)

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
  activatePanel(id)

  const panel = panelsById[id]
  if (
    !withoutTabCreation &&
    Utils.isTabsPanel(panel) &&
    (panel.noEmpty || Settings.state.hideInact || Settings.state.hideEmptyPanels) &&
    !panel.tabs.length &&
    !panel.pinnedTabs.length
  ) {
    Tabs.createTabInPanel(panel)
  }

  if (
    Utils.isTabsPanel(panel) &&
    Settings.state.activateLastTabOnPanelSwitching &&
    !withoutTabActivation &&
    !Search.active
  ) {
    // Do not switch tab if the current active tab is globally pinned
    const actTab = Tabs.byId[Tabs.activeId]
    if (actTab && (!actTab.pinned || Settings.state.pinnedTabsPosition === 'panel')) {
      Tabs.activateLastActiveTabOf(id)
    }
  }

  if (DnD.reactive.isStarted) updatePanelBoundsDebounced()
}

/**
 * Try to find not hidden neighbour panel
 */
export function switchToNeighbourPanel(): void {
  let target: T.Panel | undefined
  let activePanel = panelsById[activePanelId]
  if (!activePanel) activePanel = panels[0]

  if (!target) {
    for (let i = activePanel.index - 1; i > 0; i--) {
      const panel = panels[i]
      if (panel) {
        if (panel.hidden) continue
        if (Utils.isTabsPanel(panel)) {
          if (Settings.state.hideEmptyPanels && !panel.reactive.len) continue
          if (Settings.state.hideDiscardedTabPanels && panel.allDiscarded) continue
        }
        target = panels[i]
        break
      }
    }
  }

  if (!target) {
    for (let i = activePanel.index + 1; i < panels.length; i++) {
      const panel = panels[i]
      if (panel) {
        if (panel.hidden) continue
        if (Utils.isTabsPanel(panel)) {
          if (Settings.state.hideEmptyPanels && !panel.reactive.len) continue
          if (Settings.state.hideDiscardedTabPanels && panel.allDiscarded) continue
        }
        target = panels[i]
        break
      }
    }
  }

  if (target) switchToPanel(target.id)
}

let switchPanelPaused: boolean = false
const switchPanelPause = Utils.debounce(() => {
  switchPanelPaused = false
})
export function switchPanel(
  dir: 1 | -1,
  ignoreHidden?: boolean,
  withoutTabCreation?: boolean,
  restartDebouncer?: boolean,
  shouldLoop?: boolean
): void {
  // Single panel switch
  const delay = Settings.state.navSwitchPanelsDelay ?? 128
  if (switchPanelPaused) {
    if (restartDebouncer) {
      switchPanelPause(delay)
    }
    return
  }

  // Debounce switching
  if (delay > 0) {
    switchPanelPause(delay)
    switchPanelPaused = true
  }

  Menu.close()
  Selection.resetSelection()

  const currentActivePanelId = activePanelId

  // If current active panel is not exist
  let activePanel = panelsById[currentActivePanelId]
  if (!activePanel) {
    activePanel = panelsById[prevActivePanelId]
    if (!activePanel) activePanel = panels[0]
    if (activePanel) {
      setActivePanelId(activePanel.id)
      if (Settings.updateWinPrefaceOnPanelSwitch) Windows.updWindowPreface()
    }
    return
  }

  const hiddenPanelsPopupIsShown = reactive.hiddenPanelsPopup
  const visiblePanels = []
  const hiddenPanels = []
  const isInline = Settings.state.navBarLayout === 'horizontal' && Settings.state.navBarInline
  let hdnStartIndex = -1

  for (const id of nav) {
    if (id === 'hdn') {
      hdnStartIndex = visiblePanels.length
      continue
    }

    const panel = panelsById[id]
    if (!panel) continue

    const isTabsPanel = Utils.isTabsPanel(panel)
    const isHidden =
      panel.hidden ||
      (isTabsPanel && Settings.state.hideEmptyPanels && !panel.reactive.len) ||
      (isTabsPanel && Settings.state.hideDiscardedTabPanels && panel.allDiscarded)

    if (isHidden) {
      if (panel.id === currentActivePanelId) {
        hiddenPanels.push(panel)
      } else if (!ignoreHidden) {
        hiddenPanels.push(panel)
      }
    } else {
      visiblePanels.push(panel)
    }
  }

  if (hdnStartIndex === -1 || isInline) hdnStartIndex = visiblePanels.length

  let targets = [...visiblePanels]
  targets.splice(hdnStartIndex, 0, ...hiddenPanels)

  let actIndex = targets.indexOf(activePanel)
  if (actIndex === -1) return

  if (shouldLoop) {
    actIndex += targets.length
    targets = [...targets, ...targets, ...targets]
  }

  // Find the next active panel
  let panel
  const finder = (p: T.Panel) => !p.skipOnSwitching
  if (dir > 0) panel = Utils.findFrom(targets, actIndex + dir, finder)
  else panel = Utils.findLastFrom(targets, actIndex + dir, finder)
  if (!panel) return

  const nextActIsHidden = hiddenPanels.includes(panel)

  // Show / Hide popup of hidden panels
  if (nextActIsHidden && !hiddenPanelsPopupIsShown) {
    openHiddenPanelsPopup()
  } else if (!nextActIsHidden && hiddenPanelsPopupIsShown) {
    reactive.hiddenPanelsPopup = false
  }

  switchToPanel(panel.id, false, withoutTabCreation)

  if (nextActIsHidden && scrollHiddenPanelsPopupTo) {
    scrollHiddenPanelsPopupTo(panel.id)
  }
}

export function openHiddenPanelsPopup(): void {
  const hiddenPanelsBtnEl = document.getElementById('hidden_panels_btn')
  const navBarEl = document.getElementById('nav_bar')
  if (!hiddenPanelsBtnEl || !navBarEl) {
    reactive.hiddenPanelsPopupOffset = 3
    reactive.hiddenPanelsPopupOffsetSide = 'start'
    reactive.hiddenPanelsPopup = true
    return
  }

  const navRect = navBarEl.getBoundingClientRect()
  const btnRect = hiddenPanelsBtnEl.getBoundingClientRect()

  // Horizontal
  if (Settings.state.navBarLayout === 'horizontal') {
    let relLeft = btnRect.left - navRect.left
    if (relLeft < navRect.width / 2) {
      if (relLeft === 0) relLeft = 1
      if (width < 200) relLeft /= 2
      reactive.hiddenPanelsPopupOffset = relLeft
      reactive.hiddenPanelsPopupOffsetSide = 'start'
    } else {
      let right = width - (relLeft + btnRect.width)
      if (right === 0) right = 1
      if (width < 200) right = right / 2 + 1
      reactive.hiddenPanelsPopupOffset = right
      reactive.hiddenPanelsPopupOffsetSide = 'end'
    }
  }

  // Vertical
  else if (Settings.state.navBarLayout === 'vertical') {
    const relTop = btnRect.top - navRect.top
    if (relTop < navRect.height / 2) {
      reactive.hiddenPanelsPopupOffset = relTop
      reactive.hiddenPanelsPopupOffsetSide = 'start'
    } else {
      reactive.hiddenPanelsPopupOffset = navRect.height - (btnRect.bottom - navRect.top)
      reactive.hiddenPanelsPopupOffsetSide = 'end'
    }
  }

  reactive.hiddenPanelsPopup = true
}

export function closeHiddenPanelsPopup(withoutTabCreation?: boolean): void {
  reactive.hiddenPanelsPopup = false

  const panel = panelsById[activePanelId]
  if (
    !withoutTabCreation &&
    Utils.isTabsPanel(panel) &&
    (panel.noEmpty || Settings.state.hideInact || Settings.state.hideEmptyPanels) &&
    !panel.tabs.length &&
    !panel.pinnedTabs.length
  ) {
    Tabs.createTabInPanel(panel)
  }

  if (panel?.hidden) showPanel(panel.id)
}

/**
 * Find panel with active tab and switch to it.
 */
export function goToActiveTabPanel(): void {
  let activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  const panel = panelsById[activeTab.panelId]
  if (panel) switchToPanel(activeTab.panelId)
}

/**
 * Returns active panel info
 */
export function getActivePanelConfig(): T.PanelConfig | undefined {
  const panel = panelsById[activePanelId]
  if (!panel) throw Logs.err('Sidebar: getActivePanelConfig: Active panel not found')

  let defaults
  if (Utils.isTabsPanel(panel)) defaults = D.TABS_PANEL_CONFIG
  else if (Utils.isBookmarksPanel(panel)) defaults = D.BOOKMARKS_PANEL_CONFIG
  else if (Utils.isHistoryPanel(panel)) defaults = D.HISTORY_PANEL_CONFIG
  else if (Utils.isSyncPanel(panel)) defaults = D.SYNC_PANEL_CONFIG
  if (!defaults) return

  return Utils.cloneObject(Utils.recreateNormalizedObject(panel, defaults))
}

export async function askHowRemoveTabsPanel(panelId: ID): Promise<string | null> {
  const panel = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return null

  let note
  if (Windows.otherWindows.length) note = translate('popup.tabs_panel_removing.other_win_note')

  const conf: T.DialogConfig = {
    title: translate('popup.tabs_panel_removing.title'),
    note,
    buttons: [
      {
        value: 'close',
        label: translate('popup.tabs_panel_removing.close'),
      },
      {
        value: 'cancel',
        label: translate('btn.cancel'),
        warn: true,
      },
    ],
  }

  const isRoot =
    panel.bookmarksFolderId === D.BKM_OTHER_ID ||
    panel.bookmarksFolderId === D.BKM_MENU_ID ||
    panel.bookmarksFolderId === D.BKM_MOBILE_ID ||
    panel.bookmarksFolderId === D.BKM_TLBR_ID
  if (!isRoot) {
    conf.buttons.unshift({
      value: 'save',
      label: translate('popup.tabs_panel_removing.save'),
    })
  }

  const otherPanelsExisted = !!panels.find(p => {
    return p.type === E.PanelType.tabs && panelId !== p.id
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

  return Popups.ask(conf)
}

function attachPanelTabsToNeighbourPanel(panel: T.TabsPanel) {
  const index = reactive.nav.indexOf(panel.id)
  const firstPanelId = reactive.nav.find(id => {
    return Utils.isTabsPanel(panelsById[id]) && id !== panel.id
  })
  const nearPanelId = Utils.findNear(reactive.nav, index, v => {
    return Utils.isTabsPanel(panelsById[v])
  })

  // Update panelId of removed panel tabs to nearest panel
  for (const tab of Tabs.list) {
    if (tab.pinned && tab.panelId === panel.id) {
      tab.panelId = firstPanelId ?? D.NOID
    }

    if (!tab.pinned && tab.panelId === panel.id) {
      tab.panelId = nearPanelId ?? D.NOID
    }
  }

  return nearPanelId
}

export function hidePanel(panelId: ID) {
  const panel = panelsById[panelId]
  if (!panel) return

  if (panelId === activePanelId) {
    const actTab = Tabs.byId[Tabs.activeId]
    const actTabPanel = panelsById[actTab?.panelId ?? D.NOID]
    if (
      actTab &&
      (!actTab.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
      actTab.panelId !== panelId &&
      Utils.isTabsPanel(actTabPanel) &&
      !actTabPanel.hidden &&
      (!Settings.state.hideEmptyPanels || actTabPanel.reactive.len) &&
      (!Settings.state.hideDiscardedTabPanels || !actTabPanel.allDiscarded)
    ) {
      switchToPanel(actTab.panelId)
    } else {
      switchToNeighbourPanel()
    }
  }

  panel.hidden = true
  panel.reactive.hidden = true

  saveHiddenPanels()
}

export function showPanel(panelId: ID) {
  const panel = panelsById[panelId]
  if (!panel) return

  panel.hidden = false
  panel.reactive.hidden = false

  saveHiddenPanels()
}

export function saveHiddenPanels() {
  const hiddenPanels = []
  for (const panel of panels) {
    if (panel.hidden) hiddenPanels.push(panel.id)
  }
  browser.sessions.setWindowValue(Windows.id, 'hiddenPanels', hiddenPanels)
}

interface RemovingPanelConf {
  tabsMode?: string | null
}

/**
 * Remove panel
 */
export async function removePanel(panelId: ID, conf?: RemovingPanelConf): Promise<void> {
  const panel = panelsById[panelId]
  if (!panel) return

  if (!conf) conf = {}

  const index = reactive.nav.indexOf(panelId)
  let tabsSaveNeeded = false
  let newPanelIdForTabs

  if (Utils.isTabsPanel(panel)) {
    handling_tabs: if (panel.tabs.length) {
      tabsSaveNeeded = true

      if (!conf.tabsMode) conf.tabsMode = await askHowRemoveTabsPanel(panel.id)
      if (conf.tabsMode === 'attach') {
        newPanelIdForTabs = attachPanelTabsToNeighbourPanel(panel)
      } else if (conf.tabsMode === 'save') {
        const tabsIds = panel.tabs.map(t => t.id)
        await bookmarkTabsPanel(panel.id, true, true)
        await Tabs.removeTabs(tabsIds, true)
      } else if (conf.tabsMode === 'close') {
        const tabsIds = panel.tabs.map(t => t.id)
        await Tabs.removeTabs(tabsIds, true)
      } else if (conf.tabsMode === 'leave') {
        break handling_tabs
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
  if (panel.id === activePanelId) {
    let nextActivePanelId
    if (newPanelIdForTabs && panelsById[newPanelIdForTabs]) {
      nextActivePanelId = newPanelIdForTabs
    } else if (prevActivePanelId !== panel.id) {
      nextActivePanelId = prevActivePanelId
    } else {
      nextActivePanelId = Utils.findNear(reactive.nav, index, id => !!panelsById[id])
    }
    if (nextActivePanelId !== undefined) {
      activatePanel(nextActivePanelId)
    }
  }

  Utils.rmFromArray(reactive.nav, panelId)

  delete panelsById[panelId]
  recalcPanels()
  if (Utils.isTabsPanel(panel)) {
    recalcTabsPanels()
    if (newPanelIdForTabs) recalcVisibleTabs(newPanelIdForTabs)
  }

  if (Utils.isTabsPanel(panel) && !hasTabs) Tabs.reloadInShadowMode()
  if (Utils.isBookmarksPanel(panel) && !hasBookmarks) Bookmarks.unload()
  if (Utils.isHistoryPanel(panel) && !hasHistory) History.unload()
  if (Utils.isSyncPanel(panel) && !hasSync) Sync.unload()

  if (tabsSaveNeeded) {
    Tabs.list.forEach(t => Tabs.saveTabData(t.id))
    Tabs.cacheTabsData()
  }

  saveSidebar(120)
}

export function getPanelAutoName(type: E.PanelType): string | undefined {
  const len = panels.length

  if (type === E.PanelType.tabs) return `${translate('panel.tabs.title')}-${len}`
  else if (type === E.PanelType.bookmarks) return `${translate('panel.bookmarks.title')}-${len}`
}

/**
 * Creates tabs-panel object.
 */
export function createTabsPanel(conf?: Partial<T.TabsPanelConfig>): T.TabsPanel {
  const panel = Utils.cloneObject(D.TABS_PANEL_STATE)

  if (conf) Utils.updateObject(panel, conf, conf)
  panel.id = Utils.uid()
  if (!panel.name) panel.name = translate('panel.tabs.title')

  panel.reactive.name = panel.name
  panel.reactive.color = panel.color
  panel.reactive.iconSVG = panel.iconSVG
  panel.reactive.iconIMG = panel.iconIMG
  panel.reactive.newTabCtx = panel.newTabCtx
  panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  panel.reactive.tooltip = getPanelTooltip(panel)

  if (reactFn) panel.reactive = reactFn(panel.reactive)

  return panel
}

export function getIndexForNewTabsPanel(append?: boolean): number {
  const activePanel = panelsById[activePanelId]
  let index = -1

  if (append) {
    index = reactive.nav.findLastIndex(id => {
      const p = panelsById[id]
      return !!(Utils.isTabsPanel(p) || Utils.isBookmarksPanel(p))
    })
    index++
    return index
  }

  if (Utils.isTabsPanel(activePanel)) index = activePanel.index
  else {
    index = reactive.nav.findLastIndex(id => {
      return Utils.isTabsPanel(panelsById[id])
    })
    if (index === -1 && activePanel) index = activePanel.index
  }
  index++
  return index
}

/**
 * Creates bookmarks-panel object.
 */
export function createBookmarksPanel(conf?: Partial<T.BookmarksPanelConfig>): T.BookmarksPanel {
  const panel = Utils.cloneObject(D.BOOKMARKS_PANEL_STATE)

  if (conf) Utils.updateObject(panel, conf, conf)
  if (!panel.id) panel.id = Utils.uid()
  if (!panel.name) panel.name = translate('panel.bookmarks.title')
  if (!panel.rootId) panel.rootId = D.BKM_ROOT_ID

  panel.reactive.name = panel.name
  panel.reactive.color = panel.color
  panel.reactive.iconSVG = panel.iconSVG
  panel.reactive.iconIMG = panel.iconIMG
  panel.reactive.viewMode = panel.viewMode

  if (reactFn) panel.reactive = reactFn(panel.reactive)

  return panel
}

/**
 * Adds panel to the sidebar, returns panel object.
 */
export function addPanel<T extends T.Panel>(index: number, panel: T, replace?: boolean): T {
  if (replace) {
    const replaceableId = reactive.nav[index]
    if (replaceableId !== undefined) {
      if (activePanelId === replaceableId) {
        setActivePanelId(panel.id)
        prevActivePanelId = panel.id

        if (Settings.updateWinPrefaceOnPanelSwitch) Windows.updWindowPreface()
      }

      delete panelsById[replaceableId]
    }

    panelsById[panel.id] = panel
    reactive.nav[index] = panel.id
  } else {
    panelsById[panel.id] = panel
    reactive.nav.splice(index, 0, panel.id)
  }

  return panelsById[panel.id] as T
}

export function unloadPanelType(type: E.PanelType): void {
  const activePanel = panelsById[activePanelId]
  const switchNeeded = activePanel?.type === type

  if (switchNeeded) {
    const nextPanel = panels.find(p => p.ready && p.type !== type)
    if (nextPanel) switchToPanel(nextPanel.id)
    else return
  }

  if (type === E.PanelType.bookmarks) Bookmarks.unload()
  else if (type === E.PanelType.history) History.unload()
  else if (type === E.PanelType.sync) Sync.unload()
}

export async function bookmarkTabsPanel(
  panelId: ID,
  update = false,
  silent?: boolean,
  parentFolderId?: ID
): Promise<void> {
  const panel = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (!Permissions.reactive.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return
  }
  if (!Bookmarks.tree.length) await Bookmarks.load()

  const oldFolderId = panel.bookmarksFolderId
  const oldFolder = Bookmarks.byId.get(oldFolderId)
  let parentId = parentFolderId ?? oldFolder?.parentId
  let parent = Bookmarks.byId.get(parentId ?? D.NOID)
  let isTopLvl = parentId === D.BKM_ROOT_ID
  let index = oldFolder?.index ?? -1
  let folderName = panel.name

  // Ask for location
  if (!parent && !(update && oldFolder && isTopLvl)) {
    const defaultFolderId = oldFolder?.id ?? D.BKM_OTHER_ID
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
    if (!result?.location || result?.location === D.NOID) throw E.Err.Canceled

    parentId = result.location ?? D.NOID
    parent = Bookmarks.byId.get(parentId)

    // If selected parent is prev panel folder use prev parent folder (update mode)
    if (parent && oldFolder && parent?.id === oldFolderId) {
      parentId = oldFolder.parentId
      parent = Bookmarks.byId.get(parentId ?? D.NOID)
      update = true
      index = oldFolder.index
    }

    isTopLvl = parentId === D.BKM_ROOT_ID

    // Set new name
    if (result.name) folderName = result.name.trim()
  }
  if (!parent && !isTopLvl) throw E.Err.Canceled
  if (index === -1 && parent) index = parent.children?.length ?? 0

  // Start progress notification
  let progress: T.Notification | undefined
  if (!silent && panel.tabs.length > 5) {
    progress = Notifications.progress({
      icon: '#icon_bookmarks',
      title: translate('notif.tabs_panel_saving_bookmarks'),
      details: panel.name + ' panel',
    })
  }

  // Create/Update panel folder
  let panelFolder: Bookmarks.BkmNode | undefined

  // If panel folder is exists, update its name
  if (oldFolder) {
    panelFolder = oldFolder
    try {
      await browser.bookmarks.update(panelFolder.id, { title: folderName })
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
    if (!parent) throw E.Err.Canceled

    const parentConf = { title: folderName, index, parentId: parent.id }
    try {
      const nativePanelFolder = await browser.bookmarks.create(parentConf)
      panelFolder = Bookmarks.byId.get(nativePanelFolder.id)
      if (!panelFolder) throw 'No panelFolder'
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
  const items: T.ItemInfo[] = []
  const dst: T.DstPlaceInfo = { parentId: panelFolderId }
  const idsMap: Partial<Record<ID, ID>> = {}

  if (Settings.state.pinnedTabsPosition === 'panel' && panel.pinnedTabs.length) {
    for (const rTab of panel.pinnedTabs) {
      const tab = Tabs.byId[rTab.id]
      if (!tab) continue
      const info: T.ItemInfo = {
        id: tab.id,
        pinned: true,
        title: tab.customTitle ?? tab.title,
        url: tab.url,
        parentId: tab.parentId,
      }
      if (Containers.reactive.byId[tab.cookieStoreId]) info.container = tab.cookieStoreId
      if (tab.customColor) info.customColor = tab.customColor
      if (tab.customTitle) info.customTitle = tab.customTitle
      items.push(info)
    }
    items.push({ id: 'separator' })
  }

  for (const tab of panel.tabs) {
    const info: T.ItemInfo = {
      id: tab.id,
      title: tab.customTitle ?? tab.title,
      url: tab.url,
      parentId: tab.parentId,
      folded: tab.folded,
    }
    if (Containers.reactive.byId[tab.cookieStoreId]) info.container = tab.cookieStoreId
    if (tab.customColor) info.customColor = tab.customColor
    if (tab.customTitle) info.customTitle = tab.customTitle
    items.push(info)
  }

  if (items.length) {
    try {
      await Bookmarks.saveToFolder(items, dst, false, progress, idsMap)
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

  // Preserve tree state (folded/expanded folders)
  for (const tabId of Object.keys(idsMap)) {
    const tab = Tabs.byId[tabId]
    if (!tab || !tab.isParent) continue

    const bookmarkId = idsMap[tabId]
    if (bookmarkId === undefined) continue

    const bookmark = Bookmarks.byId.get(bookmarkId)
    if (!bookmark) continue

    if (tab.folded) Bookmarks.foldBookmark(bookmark.id, panel.id)
    else Bookmarks.expandBookmark(bookmark.id, panel.id, true, true)
  }

  // Update and save tabs panel
  if (panel.bookmarksFolderId !== panelFolderId) {
    panel.bookmarksFolderId = panelFolderId
    saveSidebar(300)
  }

  // Stop progress notification and show notification about successfull opperrattionnn
  if (!silent) {
    if (progress) Notifications.finishProgress(progress, 120)
    await Utils.sleep(250)
    Notifications.notify({ icon: '#icon_bookmarks', title: translate('notif.panel_bkmrkd') })
  }
}

export function setViewMode(panel: T.BookmarksPanel, mode: string): void {
  panel.viewMode = mode
  panel.reactive.viewMode = mode
  saveSidebar(300)
}

export async function restoreFromBookmarks(panel: T.TabsPanel, silent?: boolean): Promise<void> {
  if (!Permissions.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return
  }

  if (!Bookmarks.tree.length) await Bookmarks.load()

  let panelFolder = Bookmarks.byId.get(panel.bookmarksFolderId)
  if (!panelFolder) {
    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.restore'),
      location: D.BKM_OTHER_ID,
      locationField: true,
      locationTree: false,
      recentLocations: true,
      controls: [{ label: 'btn.restore' }],
    })
    if (!result?.location || result?.location === D.NOID) throw E.Err.Canceled
    panelFolder = Bookmarks.byId.get(result.location)
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

  const existedNormalTabs = [...panel.tabs]
  const existedPinnedTabs = [...panel.pinnedTabs]

  const idsMap: Record<ID, ID> = {}
  const reusedTabs: Record<ID, T.Tab> = {}
  const usedAsParent: Record<ID, true> = {}
  let index = panel.startTabIndex
  let indexPinned = 0
  for (const node of Bookmarks.listBookmarks(panelFolder.children)) {
    if (usedAsParent[node.id]) continue
    if (node.type === E.BkmType.Separator) continue

    const info: T.ItemInfo = { id: node.id, title: node.title, parentId: node.parentId }
    let rawUrl = node.url

    // Get target lvl
    let lvl = 0
    let parent = Bookmarks.byId.get(node.parentId)
    while (parent && parent.id !== panelFolder.id) {
      parent = Bookmarks.byId.get(parent.parentId)
      lvl++
    }

    Bookmarks.extractTabInfoFromTitle(info)

    // Set url for parent
    if (!node.url && node.children) {
      // Use first child for parent tab
      const firstChild = node.children[0]
      if (Bookmarks.isFolderWithURL(node)) {
        rawUrl = firstChild.url
        info.url = Utils.sanitizeUrl(firstChild.url, info.title)
        usedAsParent[firstChild.id] = true
      }

      // Create group
      else {
        const titleExec = D.FOLDER_NAME_DATA_RE.exec(node.title)
        info.url = Utils.createGroupUrl(titleExec ? titleExec[1] : info.title)
        rawUrl = info.url
      }
    }

    // Set url for bookmark node
    else {
      info.url = Utils.sanitizeUrl(node.url, info.title)
    }

    const isPinned = info.pinned

    // Find existed tab
    const existedTab = (isPinned ? existedPinnedTabs : existedNormalTabs).find(t => {
      const sameURL = t.url === rawUrl || t.url === info.url
      return sameURL && t.title === info.title && !reusedTabs[t.id]
    })

    // Create pinned tab if needed
    if (isPinned) {
      if (existedTab) continue

      const conf: browser.tabs.CreateProperties = {
        index: indexPinned,
        url: info.url,
        pinned: true,
        windowId: Windows.id,
        active: false,
        cookieStoreId: info.container,
      }
      Tabs.setNewTabPosition(indexPinned, D.NOID, panel.id, false)
      if (info.url) {
        const containerId = Containers.getContainerFor(info.url)
        if (containerId) conf.cookieStoreId = containerId
      }
      const newNativeTab = await browser.tabs.create(conf)
      idsMap[info.id] = newNativeTab.id
      indexPinned++
      index++

      if (info.customColor) {
        const newTab = Tabs.byId[newNativeTab.id]
        if (newTab) newTab.reactive.customColor = newTab.customColor = info.customColor
      }

      if (info.customTitle) {
        const newTab = Tabs.byId[newNativeTab.id]
        if (newTab) {
          newTab.customTitle = info.customTitle
          Tabs.renderTitle(newTab)
        }
      }

      continue
    }

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
          parentId: idsMap[info.parentId ?? D.NOID] ?? D.NOID,
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
      if (info.url) {
        const containerId = Containers.getContainerFor(info.url)
        if (containerId) conf.cookieStoreId = containerId
      }
      const parentId = idsMap[info.parentId ?? D.NOID] ?? D.NOID
      if (conf.url && !conf.url.startsWith('about')) {
        conf.discarded = true
        conf.title = info.title
      }
      Tabs.setNewTabPosition(index, parentId, panel.id, false)
      const newNativeTab = await browser.tabs.create(conf)
      idsMap[info.id] = newNativeTab.id

      if (info.customColor) {
        const newTab = Tabs.byId[newNativeTab.id]
        if (newTab) newTab.reactive.customColor = newTab.customColor = info.customColor
      }

      if (info.customTitle) {
        const newTab = Tabs.byId[newNativeTab.id]
        if (newTab) {
          newTab.customTitle = info.customTitle
          Tabs.renderTitle(newTab)
        }
      }
    }

    index++
  }

  // Restore tree state (folded/expanded branches)
  const expandedFoldersMap = Bookmarks.reactive.expanded[panel.srcPanelConfig?.id ?? panel.id]
  if (expandedFoldersMap) {
    for (const bookmarkId of Object.keys(idsMap)) {
      const bookmark = Bookmarks.byId.get(bookmarkId)
      if (!bookmark) continue

      const tabId = idsMap[bookmarkId]
      const tab = Tabs.byId[tabId]
      if (!tab || !tab.isParent) continue

      const isExpanded = !!expandedFoldersMap[bookmark.id]
      if (isExpanded === tab.folded) {
        if (tab.folded) Tabs.expTabsBranch(tab.id, true, true)
        else Tabs.foldTabsBranch(tab.id)
      }
    }
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
      const panel = panelsById[activePanelId]
      if (!panel) return

      browser.sidebarAction.setTitle({ title: panel.name, windowId: Windows.id })
    } else {
      browser.sidebarAction.setTitle({ title: 'Sidebery', windowId: Windows.id })
    }
  }, delay)
}

export async function convertToBookmarksPanel(
  panel: T.TabsPanel
): Promise<T.BookmarksPanel | void> {
  if (!Permissions.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return
  }

  if (convertingPanelLock) return
  convertingPanelLock = true

  const index = reactive.nav.indexOf(panel.id)
  if (index === -1) {
    convertingPanelLock = false
    return
  }

  const isActive = activePanelId === panel.id

  const notif = Notifications.progress({
    icon: panel.iconIMG || (panel.iconSVG ? '#' + panel.iconSVG : undefined),
    iconColor: panel.color,
    title: translate('notif.converting'),
    progress: { percent: -1 },
  })

  // Load bookmarks if needed
  if (!Bookmarks.tree.length) await Bookmarks.load()

  const oldFolderId = panel.bookmarksFolderId
  const oldFolder = Bookmarks.byId.get(oldFolderId)

  // Ask where to store
  let targetFolderId: ID | undefined
  if (!oldFolder) {
    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.convert'),
      location: D.BKM_OTHER_ID,
      locationField: true,
      locationTree: false,
      recentLocations: true,
      controls: [{ label: translate('popup.bookmarks.convert') }],
    })
    if (!result) {
      Notifications.finishProgress(notif)
      convertingPanelLock = false
      return
    }
    if (result.location) targetFolderId = result.location
  }

  // Bookmark panel (Create or Update bookmarks)
  if (panel.tabs.length) {
    try {
      await bookmarkTabsPanel(panel.id, true, true, targetFolderId)
    } catch (err) {
      Notifications.finishProgress(notif)
      convertingPanelLock = false
      if (err !== E.Err.Canceled) {
        Logs.err('Sidebar.convertToBookmarksPanel:bookmarkTabsPanel', err)
      }
      return
    }
  }

  // Lock switching panels
  if (isActive) {
    switchingLock = true
  }

  // Close tabs
  const tabsIds = []
  if (Settings.state.pinnedTabsPosition === 'panel' && panel.pinnedTabs.length) {
    tabsIds.push(...panel.pinnedTabs.map(t => t.id))
  }
  tabsIds.push(...panel.tabs.map(t => t.id))
  if (Tabs.list.length === tabsIds.length) await browser.tabs.create({})
  if (tabsIds.length) await Tabs.removeTabs(tabsIds, true)

  // Check if all tabs actualy removed
  if (tabsIds.length) {
    const allRemoved = await Tabs.isRemovingFinished()
    if (!allRemoved) {
      Notifications.finishProgress(notif)
      convertingPanelLock = false
      return Logs.warn('Sidebar.convertToBookmarksPanel: Cannot remove panel: Panel is not empty')
    }
  }

  // Create bookmarks panel
  const bookmarksPanelConfig: Partial<T.BookmarksPanelConfig> = {
    name: panel.name,
    rootId: panel.bookmarksFolderId,
    color: panel.color,
    iconSVG: panel.iconSVG === 'icon_tabs' ? 'icon_bookmarks' : panel.iconSVG,
    iconIMG: panel.iconIMG,
    iconIMGSrc: panel.iconIMGSrc,
    autoConvert: true,
    srcPanelConfig: {
      id: panel.id,
      noEmpty: panel.noEmpty,
      newTabCtx: panel.newTabCtx,
      dropTabCtx: panel.dropTabCtx,
      moveRules: panel.moveRules,
      newTabBtns: panel.newTabBtns,
    },
  }
  if (panel.srcPanelConfig) {
    bookmarksPanelConfig.viewMode = panel.srcPanelConfig.viewMode
    bookmarksPanelConfig.tempMode = panel.srcPanelConfig.tempMode
    bookmarksPanelConfig.autoConvert = panel.srcPanelConfig.autoConvert
  }
  let bookmarksPanel = createBookmarksPanel(bookmarksPanelConfig)
  if (panel.srcPanelConfig) bookmarksPanel.id = panel.srcPanelConfig.id
  bookmarksPanel = addPanel(index, bookmarksPanel, true)

  // Preserve tree state (folded/expanded folders)
  const srcTreeState = Bookmarks.reactive.expanded[panel.id]
  if (srcTreeState) {
    Bookmarks.reactive.expanded[bookmarksPanel.id] = Utils.cloneObject(srcTreeState)
    Bookmarks.saveBookmarksTree()
  }

  recalcPanels()
  recalcBookmarksPanels()
  saveSidebar(500)

  setTimeout(() => {
    // Unlock switching panels
    switchingLock = false

    // Mark bookmarks panel as ready
    if (Bookmarks.tree.length) bookmarksPanel.reactive.ready = bookmarksPanel.ready = true
  }, 200)

  Notifications.finishProgress(notif, 2000)
  notif.title = translate('notif.panel_conv')
  convertingPanelLock = false

  return bookmarksPanel
}

export async function convertToTabsPanel(
  bookmarksPanel: T.BookmarksPanel,
  openTabs?: boolean
): Promise<ID> {
  if (convertingPanelLock) return D.NOID
  convertingPanelLock = true

  const index = reactive.nav.indexOf(bookmarksPanel.id)
  if (index === -1) {
    convertingPanelLock = false
    return D.NOID
  }

  let notifIcon = bookmarksPanel.iconIMG
  if (!notifIcon) notifIcon = bookmarksPanel.iconSVG && '#' + bookmarksPanel.iconSVG
  const notif = Notifications.progress({
    icon: notifIcon,
    iconColor: bookmarksPanel.color,
    title: translate('notif.converting'),
    progress: { percent: -1 },
  })

  // Load bookmarks if needed
  if (!Bookmarks.tree.length) await Bookmarks.load()

  // Check if root folder exists
  const rootFolder = Bookmarks.byId.get(bookmarksPanel.rootId)
  if (!rootFolder) {
    Notifications.finishProgress(notif)
    convertingPanelLock = false
    Logs.warn('Sidebar.convertToTabsPanel: No root folder')
    return D.NOID
  }

  // Create tabs panel
  const isFirstTabsPanel = !hasTabs
  const tabsPanelConfig: Partial<T.TabsPanelConfig> = {
    name: bookmarksPanel.name,
    bookmarksFolderId: bookmarksPanel.rootId,
    color: bookmarksPanel.color,
    iconSVG: bookmarksPanel.iconSVG === 'icon_bookmarks' ? 'icon_tabs' : bookmarksPanel.iconSVG,
    iconIMG: bookmarksPanel.iconIMG,
    iconIMGSrc: bookmarksPanel.iconIMGSrc,

    srcPanelConfig: {
      id: bookmarksPanel.id,
      autoConvert: bookmarksPanel.autoConvert,
      tempMode: bookmarksPanel.tempMode,
      viewMode: bookmarksPanel.viewMode,
    },
  }
  if (bookmarksPanel.srcPanelConfig) {
    tabsPanelConfig.noEmpty = bookmarksPanel.srcPanelConfig.noEmpty
    tabsPanelConfig.newTabCtx = bookmarksPanel.srcPanelConfig.newTabCtx
    tabsPanelConfig.dropTabCtx = bookmarksPanel.srcPanelConfig.dropTabCtx
    tabsPanelConfig.moveRules = Utils.cloneArray(bookmarksPanel.srcPanelConfig.moveRules)
    tabsPanelConfig.newTabBtns = Utils.cloneArray(bookmarksPanel.srcPanelConfig.newTabBtns)
  }
  let tabsPanel = createTabsPanel(tabsPanelConfig)
  if (bookmarksPanel.srcPanelConfig) tabsPanel.id = bookmarksPanel.srcPanelConfig.id
  tabsPanel = addPanel(index, tabsPanel, true)
  recalcPanels()
  recalcTabsPanels()
  activatePanel(tabsPanel.id, false)

  if (isFirstTabsPanel) await Tabs.load()

  // Open tabs
  if (openTabs) {
    try {
      await restoreFromBookmarks(tabsPanel, true)
    } catch (err) {
      Notifications.finishProgress(notif)
      convertingPanelLock = false
      if (err !== E.Err.Canceled) Logs.err('Sidebar.convertToTabsPanel: Cannot restore tabs', err)
      return D.NOID
    }
  }

  saveSidebar(300)

  Notifications.finishProgress(notif, 2000)
  notif.title = translate('notif.panel_conv')
  convertingPanelLock = false

  return tabsPanel.id
}

const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
export function scrollActivePanel(y: number, offset?: boolean): void {
  let panel
  if (subPanelActive && subPanelType === E.SubPanelType.Bookmarks) {
    panel = subPanels.bookmarks
  }
  if (!panel) panel = panelsById[activePanelId]
  if (!panel?.scrollEl) return

  if (offset) scrollConf.top = panel.scrollEl.scrollTop - y
  else scrollConf.top = y
  panel.scrollEl.scroll(scrollConf)
}

export function scrollPanelToEdge(panel?: T.Panel): void {
  if (!panel) panel = panelsById[activePanelId]
  if (!panel.scrollComponent || !panel.scrollEl) return

  const scrollableBoxEl = panel.scrollComponent.getScrollableBox()
  if (!scrollableBoxEl) return

  if (panel.scrollEl.scrollTop === 0) {
    scrollableBoxEl.scrollIntoView({ behavior: 'smooth', block: 'end' })
  } else {
    scrollableBoxEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

let switchPanelBackTimeout: number | undefined
export function switchPanelBackResetTimeout(): void {
  clearTimeout(switchPanelBackTimeout)
}
export function switchPanelBack(delay: number): void {
  clearTimeout(switchPanelBackTimeout)
  switchPanelBackTimeout = setTimeout(() => {
    const prevPanel = panelsById[prevTabsPanelId]
    if (prevPanel) switchToPanel(prevPanel.id)
  }, delay)
}

let subPanelTypeResetTimeout: number | undefined
let closeSubPanelLock: number | undefined
export function openSubPanel(type: E.SubPanelType, hostPanel?: T.Panel) {
  if (!Utils.isTabsPanel(hostPanel)) return

  if (hostPanel.filteredTabs) Search.reset(hostPanel)

  if (type === E.SubPanelType.Bookmarks) {
    let panel = subPanels.bookmarks
    if (!panel) {
      panel = createBookmarksPanel({ rootId: hostPanel.bookmarksFolderId })
      if (panel.rootId === D.NOID) panel.rootId = D.BKM_ROOT_ID
      subPanels.bookmarks = panel
    } else {
      panel.rootId = hostPanel.bookmarksFolderId
    }
    if (Bookmarks.tree.length) panel.ready = true
  }

  clearTimeout(subPanelTypeResetTimeout)
  subPanelActive = true
  reactive.subPanelActive = true
  reactive.subPanelType = type
  subPanelType = type

  if (type === E.SubPanelType.History && !History.ready) History.load()
  if (type === E.SubPanelType.Sync && !Sync.ready) Sync.load()

  if (Menu.isOpen) Menu.close()
  if (Selection.isSet()) Selection.resetSelection()
  if (Search.active) Search.search()

  closeSubPanelLock = setTimeout(() => {
    closeSubPanelLock = undefined
  }, 16)
}

export function closeSubPanel() {
  if (!subPanelActive) return
  if (closeSubPanelLock) return

  if (subPanelType === E.SubPanelType.History && activePanelId !== 'history') {
    History.unloadAfter(30_000)
  } else if (subPanelType === E.SubPanelType.Sync && activePanelId !== 'sync') {
    Sync.unloadAfter(5_000)
  }

  subPanelActive = false
  subPanelType = E.SubPanelType.Null
  reactive.subPanelActive = false

  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()
  if (Search.active) Search.search()
  if (DnD.items.length) updateBounds()

  clearTimeout(subPanelTypeResetTimeout)
  subPanelTypeResetTimeout = setTimeout(() => {
    reactive.subPanelType = E.SubPanelType.Null
    if (subPanels.bookmarks) {
      subPanels.bookmarks.filteredBookmarks = undefined
      subPanels.bookmarks.reactive.rootOffset = 0
      subPanels.bookmarks.reactive.filteredBookmarkIds = undefined
      subPanels.bookmarks.reactive.filteredLen = undefined
    }
  }, 500)
}

export function switchPanelOnMouseLeave() {
  switchOnMouseLeave = false

  if (subPanelActive) return

  const activePanel = panelsById[activePanelId]
  if (!activePanel) return

  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) return

  if (activeTab.panelId === activePanel.id) return
  if (activeTab.pinned && Settings.state.pinnedTabsPosition !== 'panel') return

  activatePanel(activeTab.panelId)
}

export function scrollPanelOnMouseLeave() {
  scrollOnMouseLeave = false
  Tabs.scrollToTabDebounced(3, Tabs.activeId, true)
}

const updateMediaStateOfPanelTimeouts: Record<ID, number> = {}
export function updateMediaStateOfPanelDebounced(delay: number, panelId: ID, tab?: T.Tab) {
  if (updateMediaStateOfPanelTimeouts[panelId] !== undefined) tab = undefined

  clearTimeout(updateMediaStateOfPanelTimeouts[panelId])
  updateMediaStateOfPanelTimeouts[panelId] = setTimeout(() => {
    delete updateMediaStateOfPanelTimeouts[panelId]
    updateMediaStateOfPanel(panelId, tab)
  }, delay)
}

export function updateMediaStateOfPanel(panelId: ID, tab?: T.Tab) {
  const panel = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (tab && (!tab.pinned || Settings.state.pinnedTabsPosition === 'panel')) {
    let tabMediaState = E.MediaState.Silent
    if (tab.mediaPaused) tabMediaState = E.MediaState.Paused
    else if (tab.mutedInfo?.muted) tabMediaState = E.MediaState.Muted
    else if (tab.audible) tabMediaState = E.MediaState.Audible

    const panelMediaState = panel.reactive.mediaState

    // Audible state
    if (tabMediaState === E.MediaState.Audible) {
      panel.reactive.mediaState = E.MediaState.Audible
      return
    }

    // Paused state
    else if (tabMediaState === E.MediaState.Paused && panelMediaState !== E.MediaState.Audible) {
      panel.reactive.mediaState = E.MediaState.Paused
      return
    }

    // Muted state
    else if (tabMediaState === E.MediaState.Muted && panelMediaState === E.MediaState.Silent) {
      panel.reactive.mediaState = E.MediaState.Muted
      return
    }
  }

  // Unknown state, need to check all tabs
  // ---
  let hasPaused = false
  let hasMuted = false

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const t of panel.pinnedTabs) {
      if (t.mediaPaused) hasPaused = true
      else if (t.mutedInfo?.muted) hasMuted = true
      else if (t.audible) {
        panel.reactive.mediaState = E.MediaState.Audible
        return
      }
    }
  }

  for (const t of panel.tabs) {
    if (t.mediaPaused) hasPaused = true
    else if (t.mutedInfo?.muted) hasMuted = true
    else if (t.audible) {
      panel.reactive.mediaState = E.MediaState.Audible
      return
    }
  }

  if (hasPaused) panel.reactive.mediaState = E.MediaState.Paused
  else if (hasMuted) panel.reactive.mediaState = E.MediaState.Muted
  else if (Tabs.ready) panel.reactive.mediaState = E.MediaState.Silent
}

export function updateUpdatedStateOfPanel(panel?: T.Panel) {
  if (!Utils.isTabsPanel(panel)) return

  const updatedTabIds: ID[] = []
  panel.pinnedTabs.forEach(t => t.updated && updatedTabIds.push(t.id))
  panel.tabs.forEach(t => t.updated && updatedTabIds.push(t.id))
  panel.updatedTabs = updatedTabIds
  panel.reactive.updated = updatedTabIds.length > 0
}

export function getRecentTabsPanelId(): ID {
  let panelId = activePanelId
  let panel: T.Panel | undefined = panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) {
    panelId = prevTabsPanelId
    panel = panelsById[panelId]
  }
  if (!Utils.isTabsPanel(panel)) {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab) panel = panelsById[activeTab.panelId]
    else panel = panels.find(p => Utils.isTabsPanel(p))
    panelId = panel?.id ?? D.NOID
  }
  return panelId
}

let actPanelPrevScrollPos: number | undefined
export function rememberActivePanelScrollPosition() {
  const actPanel = panelsById[activePanelId]
  if (!actPanel?.scrollEl) return

  actPanelPrevScrollPos = actPanel.scrollEl.scrollTop
}

export function restoreActivePanelScrollPosition() {
  const actPanel = panelsById[activePanelId]
  if (!actPanel?.scrollEl || !actPanel?.scrollComponent || actPanelPrevScrollPos === undefined) {
    return
  }

  actPanel.scrollEl.scrollTop = actPanelPrevScrollPos
  actPanel.scrollComponent.recalcScroll()
}

export function attachSelLenBadgeToTab(id?: ID | null) {
  let tab = Tabs.byId[id ?? D.NOID]
  if (!tab) {
    reactive.selLenBadgeTarget = null
    return
  }

  if (tab?.invisible && !Search.active) {
    tab = Tabs.findAncestor(tab, p => !p.invisible)
  }

  if (tab) reactive.selLenBadgeTarget = document.getElementById('tab' + tab.id)
  else reactive.selLenBadgeTarget = null
}

export function attachSelLenBadgeToBkm(panelId: ID, bkmId?: ID | null) {
  if (!bkmId) {
    reactive.selLenBadgeTarget = null
    return
  }

  const el = document.getElementById('bookmark' + panelId + bkmId)
  reactive.selLenBadgeTarget = el
}

/**
 * Close popups, dialogs, context menu, sub-panels, reset selection etc...
 */
export function resetOrCancelInteraction() {
  // Context menu
  if (Menu.isOpen) {
    Menu.close()
    return
  }

  // Selection
  if (Selection.isSet()) {
    Selection.resetSelection()
    return
  }

  // Searching
  if (
    (Search.reactive.barIsShowed && Settings.state.searchBarMode === 'dynamic') ||
    Search.active
  ) {
    Search.stop()
    return
  }

  // Sub-panel
  if (subPanelActive) closeSubPanel()

  // Confirm popup
  if (Popups.reactive.confirm) Popups.reactive.confirm = null

  // Windows popup
  if (Windows.reactive.choosing) Windows.closeWindowsPopup()

  // Bookmarks popup
  if (Bookmarks.reactive.popup?.close) Bookmarks.reactive.popup.close()

  // Panel config popup
  if (Popups.reactive.panelConfigPopup) Popups.closePanelPopup()

  // Conatiner config popup
  if (Popups.reactive.containerConfigPopup) Popups.closeContainerPopup()

  // Group config popup
  if (Popups.reactive.groupConfigPopup) {
    Popups.reactive.groupConfigPopup.done(E.GroupConfigResult.Cancel)
    Popups.reactive.groupConfigPopup = null
  }

  // Dialog popup
  if (Popups.reactive.dialog) Popups.reactive.dialog.result(null)

  // Hidden panels popup
  if (reactive.hiddenPanelsPopup) {
    closeHiddenPanelsPopup()
  }

  // New tab shortcuts popup
  if (Popups.reactive.newTabShortcutsPopup) {
    Popups.closeNewTabShortcutsPopup()
  }

  // Site config popup
  if (Popups.reactive.siteConfigPopup) Popups.closeSiteConfigPopup()
}

export function resetPanelsPos() {
  for (const panel of panels) {
    if (panel.id === activePanelId) panel.reactive.pos = 'c'
    else panel.reactive.pos = 'h'
  }
}
