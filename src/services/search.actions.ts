import Utils from 'src/utils'
import { MIN_SEARCH_QUERY_LEN, SEARCH_URL } from 'src/defaults'
import { Search } from 'src/services/search'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import * as SearchTabs from 'src/services/search.tabs'
import * as SearchBookmarks from 'src/services/search.bookmarks'
import * as SearchHistory from 'src/services/search.history'
import * as SearchTrash from 'src/services/search.trash'
import * as SearchDownloads from 'src/services/search.downloads'
import { InstanceType, MenuType, Panel } from 'src/types'
import { Msg } from './msg'
import { Menu } from './menu'
import { Windows } from './windows'
import { History } from './history'
import { Trash } from './trash'
import { Downloads } from './downloads'

export function init(): void {
  if (Settings.reactive.searchBarMode === 'static') Search.reactive.barIsShowed = true
}

let inputTimeout: number | undefined
export function onOutsideSearchInput(value: string): void {
  if (!Windows.focused) return
  if (!Search.reactive.barIsShowed && Search.reactive.rawValue) Search.toggleBar()

  Search.reactive.rawValue = value

  clearTimeout(inputTimeout)
  inputTimeout = setTimeout(() => {
    Search.search(Search.reactive.rawValue)
  }, 128)
}

export function onOutsideSearchExit(): void {
  if (!Search.reactive.barIsShowed) return
  const hasFocus = document.hasFocus()
  if (!hasFocus) Search.close()
}

export function next(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return Menu.selectOption(1)

  const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) SearchTabs.onTabsSearchNext(actPanel)
  if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchNext(actPanel)
  if (Utils.isHistoryPanel(actPanel)) SearchHistory.onHistorySearchNext()
  if (Utils.isDownloadsPanel(actPanel)) SearchDownloads.onDownloadsSearchNext()
  if (Utils.isTrashPanel(actPanel)) SearchTrash.onTrashSearchNext()
}

export function prev(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return Menu.selectOption(-1)

  const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) SearchTabs.onTabsSearchPrev(actPanel)
  if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchPrev(actPanel)
  if (Utils.isHistoryPanel(actPanel)) SearchHistory.onHistorySearchPrev()
  if (Utils.isDownloadsPanel(actPanel)) SearchDownloads.onDownloadsSearchPrev()
  if (Utils.isTrashPanel(actPanel)) SearchTrash.onTrashSearchPrev()
}

export function enter(): void {
  if (!Search.reactive.barIsShowed) return

  if (Menu.isOpen) {
    Menu.activateOption()
    Search.close()
    return
  }

  const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) SearchTabs.onTabsSearchEnter(actPanel)
  if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchEnter(actPanel)
  if (Utils.isHistoryPanel(actPanel)) SearchHistory.onHistorySearchEnter()
  if (Utils.isDownloadsPanel(actPanel)) SearchDownloads.onDownloadsSearchEnter()
  if (Utils.isTrashPanel(actPanel)) SearchTrash.onTrashSearchEnter()
}

export function selectAll(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return

  const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) SearchTabs.onTabsSearchSelectAll(actPanel)
  if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearchSelectAll(actPanel)
}

export function menu(): void {
  if (!Search.reactive.barIsShowed) return
  if (Menu.isOpen) return Menu.close()

  const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  const el = document.getElementById('search_bar')
  const rect = el?.getBoundingClientRect()
  const y = (rect?.bottom ?? 8) + 88

  if (Utils.isTabsPanel(actPanel)) Menu.open(MenuType.Tabs, 16, y, true)
  if (Utils.isBookmarksPanel(actPanel)) Menu.open(MenuType.Bookmarks, 16, y, true)
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

  const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) return

  if (Utils.isTabsPanel(actPanel)) SearchTabs.onTabsSearch(actPanel)
  else if (Utils.isBookmarksPanel(actPanel)) SearchBookmarks.onBookmarksSearch(actPanel)
  else if (Utils.isHistoryPanel(actPanel)) SearchHistory.onHistorySearch()
  else if (Utils.isTrashPanel(actPanel)) SearchTrash.onTrashSearch()
  else if (Utils.isDownloadsPanel(actPanel)) SearchDownloads.onDownloadsSearch()

  if (value === '') {
    for (const id of Sidebar.reactive.nav) {
      const panel = Sidebar.reactive.panelsById[id]
      if (panel && panel.id === actPanel.id) continue
      reset(panel)
    }
  }
}

export function reset(panel?: Panel): void {
  if (Utils.isTabsPanel(panel)) {
    panel.filteredTabs = undefined
    panel.filteredLen = undefined
  } else if (Utils.isBookmarksPanel(panel)) {
    panel.filteredBookmarks = undefined
    panel.filteredLen = undefined
  } else if (Utils.isHistoryPanel(panel)) {
    panel.filteredLen = undefined
    History.reactive.filtered = undefined
  } else if (Utils.isTrashPanel(panel)) {
    panel.filteredLen = undefined
    Trash.reactive.filtered = undefined
  } else if (Utils.isDownloadsPanel(panel)) {
    panel.filteredLen = undefined
    Downloads.reactive.filtered = undefined
  }
}

export function stop(): void {
  if (Settings.reactive.searchBarMode === 'dynamic') Search.hideBar()
  Search.reactive.rawValue = ''
  Search.search('')
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
  if (Settings.reactive.searchBarMode === 'none') return
  Search.reactive.barIsShowed = true
  focus()
}

export function hideBar(): void {
  Msg.call(InstanceType.search, 'closePopup')
  if (Settings.reactive.searchBarMode !== 'static') Search.reactive.barIsShowed = false
  if (Menu.isOpen) return Menu.close()
}

export function start(): void {
  if (Settings.reactive.searchBarMode === 'none') return

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
}
