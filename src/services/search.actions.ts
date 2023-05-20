import * as Utils from 'src/utils'
import { BKM_ROOT_ID, MIN_SEARCH_QUERY_LEN, NOID, SEARCH_URL } from 'src/defaults'
import { Search } from 'src/services/search'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import * as SearchTabs from 'src/services/search.tabs'
import * as SearchBookmarks from 'src/services/search.bookmarks'
import * as SearchHistory from 'src/services/search.history'
import { BookmarksPanel, MenuType, Panel, SubPanelType } from 'src/types'
import * as IPC from './ipc'
import * as Logs from './logs'
import { Menu } from './menu'
import { Windows } from './windows'
import { History } from './history'
import { Bookmarks } from './bookmarks'
import { Selection } from './selection'

export const INPUT_TIMEOUT = 300

export function init(): void {
  if (Settings.state.searchBarMode === 'static') Search.reactive.barIsShowed = true
}

let inputTimeout: number | undefined
export function onOutsideSearchInput(value: string): void {
  if (!Windows.focused) return
  if (!Search.reactive.barIsShowed && Search.reactive.rawValue) Search.toggleBar()

  Search.reactive.rawValue = value

  clearTimeout(inputTimeout)
  inputTimeout = setTimeout(() => {
    Search.search(Search.reactive.rawValue)
  }, INPUT_TIMEOUT)
}

export function onOutsideSearchExit(): void {
  if (!Search.reactive.barIsShowed) return

  if (Sidebar.subPanelActive && subPanelOpenBySearch) Sidebar.closeSubPanel()

  const sidebarFocused = document.hasFocus()
  if (!sidebarFocused) Search.close()
  else if (inputEl && inputEl !== document.activeElement) Search.reactive.barIsActive = false
}

export function next(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return Menu.selectOption(1)

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) {
    if (Sidebar.subPanelActive) {
      if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
        SearchBookmarks.onBookmarksSearchNext(Sidebar.subPanels.bookmarks)
      } else if (Sidebar.subPanelType === SubPanelType.History) {
        SearchHistory.onHistorySearchNext()
      }
    } else {
      SearchTabs.onTabsSearchNext(actPanel)
    }
  } else if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchNext(actPanel)
  else if (Utils.isHistoryPanel(actPanel)) SearchHistory.onHistorySearchNext()
}

export function prev(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return Menu.selectOption(-1)

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) {
    if (Sidebar.subPanelActive) {
      if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
        SearchBookmarks.onBookmarksSearchPrev(Sidebar.subPanels.bookmarks)
      } else if (Sidebar.subPanelType === SubPanelType.History) {
        SearchHistory.onHistorySearchPrev()
      }
    } else {
      SearchTabs.onTabsSearchPrev(actPanel)
    }
  } else if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchPrev(actPanel)
  else if (Utils.isHistoryPanel(actPanel)) SearchHistory.onHistorySearchPrev()
}

export function enter(): void {
  if (!Search.reactive.barIsShowed) return

  if (Menu.isOpen) {
    const activated = Menu.activateOption()
    if (activated) Search.close()
    return
  }

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) {
    if (Sidebar.subPanelActive) {
      if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
        SearchBookmarks.onBookmarksSearchEnter(actPanel, Sidebar.subPanels.bookmarks)
      } else if (Sidebar.subPanelType === SubPanelType.History) {
        SearchHistory.onHistorySearchEnter()
      }
    } else {
      SearchTabs.onTabsSearchEnter(actPanel)
    }
  } else if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchEnter(actPanel)
  else if (Utils.isHistoryPanel(actPanel)) SearchHistory.onHistorySearchEnter()
}

let searchPrevPanelId: ID | undefined
let subPanelOpenBySearch = false

export function bookmarks() {
  if (!Search.reactive.barIsShowed) return

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]

  // Try to open bookmarks sub-panel
  if (Utils.isTabsPanel(actPanel) && Settings.state.subPanelBookmarks) {
    if (
      Sidebar.subPanelActive &&
      Sidebar.subPanelType === SubPanelType.Bookmarks &&
      Sidebar.subPanels.bookmarks
    ) {
      const panel = Sidebar.subPanels.bookmarks
      const isRoot = panel.rootId === BKM_ROOT_ID || panel.rootId === NOID
      if (!isRoot && panel.reactive.rootOffset === 0) {
        const folder = Bookmarks.reactive.byId[panel.rootId]
        if (folder) {
          const path = Bookmarks.getPath(folder)
          panel.reactive.rootOffset = path.length + 1
          Search.reset(panel)
          SearchBookmarks.onBookmarksSearch(actPanel, Sidebar.subPanels.bookmarks)
        }
      } else {
        Sidebar.closeSubPanel()
      }
    } else {
      Sidebar.openSubPanel(SubPanelType.Bookmarks, actPanel)
      subPanelOpenBySearch = true
    }
  }

  // Try to open bookmarks panel
  else if (Sidebar.hasBookmarks) {
    let firstPanel: BookmarksPanel | undefined
    let nextPanel: BookmarksPanel | undefined | null
    let rootPanel: BookmarksPanel | undefined
    for (const p of Sidebar.panels) {
      if (Utils.isBookmarksPanel(p)) {
        if (!firstPanel) firstPanel = p
        if (!rootPanel && p.rootId === BKM_ROOT_ID) rootPanel = p
        if (nextPanel === null) nextPanel = p
        if (p.id === actPanel.id) nextPanel = null
      }
    }
    if (!firstPanel) return

    if (!Utils.isBookmarksPanel(actPanel)) {
      searchPrevPanelId = actPanel.id
      Sidebar.activatePanel(firstPanel.id)
    } else if (nextPanel) {
      Sidebar.activatePanel(nextPanel.id)
    } else if (searchPrevPanelId !== undefined) {
      Sidebar.activatePanel(searchPrevPanelId)
      searchPrevPanelId = undefined
    }
  }
}

export function history() {
  if (!Search.reactive.barIsShowed) return

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]

  // Try to open history sub-panel
  if (Utils.isTabsPanel(actPanel) && Settings.state.subPanelHistory) {
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.History) {
      Sidebar.closeSubPanel()
    } else {
      Sidebar.openSubPanel(SubPanelType.History, actPanel)
      subPanelOpenBySearch = true
    }
  }

  // Try to switch to history panel
  else if (Sidebar.hasHistory) {
    if (!Utils.isHistoryPanel(actPanel)) {
      searchPrevPanelId = actPanel.id
      Sidebar.activatePanel('history')
    } else if (searchPrevPanelId !== undefined) {
      Sidebar.activatePanel(searchPrevPanelId)
      searchPrevPanelId = undefined
    }
  }
}

export function selectAll(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) {
    if (Sidebar.subPanelActive) {
      if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
        SearchBookmarks.onBookmarksSearchSelectAll(Sidebar.subPanels.bookmarks)
      }
    } else {
      SearchTabs.onTabsSearchSelectAll(actPanel)
    }
  } else if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchSelectAll(actPanel)
}

function getMenuCoordinates(type: MenuType): [number, number] {
  const el = document.getElementById('search_bar')
  const sRect = el?.getBoundingClientRect()
  const sx = sRect?.left ?? 16
  const sy = (sRect?.bottom ?? 16) + 2
  const firstSelectedId = Selection.getFirst()

  let rect
  if (type === MenuType.Tabs) {
    rect = document.getElementById('tab' + String(firstSelectedId))?.getBoundingClientRect()
  } else if (type === MenuType.Bookmarks) {
    rect = document.getElementById('bookmark' + String(firstSelectedId))?.getBoundingClientRect()
  } else if (type === MenuType.History) {
    rect = document.getElementById('history' + String(firstSelectedId))?.getBoundingClientRect()
  }

  if (!rect) return [sx, sy]
  else return [rect.left + 2, rect.bottom + 2]
}

export function menu(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return Menu.close()

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) {
    if (Sidebar.subPanelActive) {
      if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
        const [x, y] = getMenuCoordinates(MenuType.Bookmarks)
        Menu.open(MenuType.Bookmarks, x, y, true)
      } else if (Sidebar.subPanelType === SubPanelType.History) {
        const [x, y] = getMenuCoordinates(MenuType.History)
        Menu.open(MenuType.History, x, y, true)
      }
    } else {
      const [x, y] = getMenuCoordinates(MenuType.Tabs)
      Menu.open(MenuType.Tabs, x, y, true)
    }
  } else if (Utils.isBookmarksPanel(actPanel)) {
    const [x, y] = getMenuCoordinates(MenuType.Tabs)
    Menu.open(MenuType.Bookmarks, x, y, true)
  } else if (Utils.isHistoryPanel(actPanel)) {
    const [x, y] = getMenuCoordinates(MenuType.Tabs)
    Menu.open(MenuType.History, x, y, true)
  }
}

let searchTimeout: number | undefined
export function searchDebounced(delay: number, value?: string) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => search(value), delay)
}

let query = ''
export function search(value?: string): void {
  if (value !== undefined) {
    if (value.length < MIN_SEARCH_QUERY_LEN) value = ''
    if (Search.reactive.value === value) return

    Search.prevValue = Search.reactive.value
    Search.reactive.value = value
    query = value.toLowerCase()
  }

  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return
  let targetPanelId = actPanel.id

  if (Utils.isTabsPanel(actPanel)) {
    if (Sidebar.subPanelActive) {
      if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
        targetPanelId = Sidebar.subPanels.bookmarks.id
        SearchBookmarks.onBookmarksSearch(actPanel, Sidebar.subPanels.bookmarks)
      } else if (Sidebar.subPanelType === SubPanelType.History) {
        targetPanelId = NOID
        SearchHistory.onHistorySearch()
      }
    } else {
      SearchTabs.onTabsSearch(actPanel)
    }
  } else if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearch(actPanel)
  else if (Utils.isHistoryPanel(actPanel)) {
    targetPanelId = NOID
    SearchHistory.onHistorySearch()
  }

  if (value === '') {
    for (const panel of Sidebar.panels) {
      if (panel.id === targetPanelId) continue
      reset(panel)
    }

    if (Search.prevExpandedBookmarks) {
      Bookmarks.reactive.expanded = Search.prevExpandedBookmarks
      Search.prevExpandedBookmarks = undefined
    }
    if (Sidebar.subPanels.bookmarks && Sidebar.subPanels.bookmarks.id !== targetPanelId) {
      reset(Sidebar.subPanels.bookmarks)
    }
    if (targetPanelId !== NOID) {
      History.reactive.filtered = undefined
    }
  }
}

export function reset(panel?: Panel): void {
  if (Utils.isTabsPanel(panel)) {
    panel.filteredTabs = undefined
    panel.reactive.filteredTabs = undefined
    panel.reactive.filteredLen = undefined
  } else if (Utils.isBookmarksPanel(panel)) {
    panel.reactive.filteredBookmarks = undefined
    panel.reactive.filteredLen = undefined
  }
}

export function stop(): void {
  if (Settings.state.searchBarMode === 'dynamic') Search.hideBar()
  Search.reactive.rawValue = ''
  Search.search('')
  subPanelOpenBySearch = false
}

export function check(str: string): boolean {
  str = str.toLowerCase()
  return str.includes(query)
}

let inputEl: HTMLInputElement | undefined
export function registerInputEl(el: HTMLInputElement): void {
  inputEl = el
}

export function focus(): void {
  if (inputEl) inputEl.focus({ preventScroll: true })
}

export function toggleBar(): void {
  if (Search.reactive.barIsShowed) hideBar()
  else showBar()
}

export function showBar(): void {
  if (Settings.state.searchBarMode === 'none') return
  Search.reactive.barIsShowed = true
  focus()
}

export function hideBar(): void {
  IPC.sendToSearchPopup(Windows.id, 'closePopup')
  if (Settings.state.searchBarMode !== 'static') Search.reactive.barIsShowed = false
  if (Menu.isOpen) return Menu.close()
}

export function start(): void {
  if (Settings.state.searchBarMode === 'none') return

  const hasFocus = document.hasFocus()
  if (!hasFocus) {
    browser.browserAction.setPopup({ popup: SEARCH_URL })
    browser.browserAction.openPopup()
    Search.reactive.barIsActive = true

    // Reset browser action
    setTimeout(() => browser.browserAction.setPopup({ popup: null }), 500)
  }

  showBar()
}

export function close(): void {
  Search.reactive.barIsActive = false
  Search.reactive.rawValue = ''
  Search.search('')
  hideBar()
  subPanelOpenBySearch = false
}
