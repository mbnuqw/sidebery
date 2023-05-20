import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Bookmark, Panel, Notification, DialogConfig, DragInfo, SubPanelType } from 'src/types'
import { Stored, BookmarksSortType, DstPlaceInfo, ItemInfo, TabsPanel } from 'src/types'
import { CONTAINER_ID, NOID, BKM_OTHER_ID, BKM_ROOT_ID, PRE_SCROLL, GROUP_RE } from 'src/defaults'
import { FOLDER_NAME_DATA_RE, GROUP_URL, PIN_MARK } from 'src/defaults'
import { Bookmarks, BookmarksPopupConfig, BookmarksPopupResult } from 'src/services/bookmarks'
import { BookmarksPopupState } from 'src/services/bookmarks'
import * as Logs from 'src/services/logs'
import * as Popups from 'src/services/popups'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Tabs } from 'src/services/tabs.fg'
import { Store } from 'src/services/storage'
import { Notifications } from 'src/services/notifications'
import { Info } from 'src/services/info'
import * as IPC from 'src/services/ipc'
import { Favicons } from './favicons'
import { PanelType } from 'src/types/sidebar'
import { Permissions } from './permissions'
import { Containers } from './containers'
import { DnD } from './drag-and-drop'
import { Search } from './search'

export async function load(): Promise<void> {
  if (!browser.bookmarks) return
  if (!Info.isBg) return loadInFg()
}

async function loadInFg(): Promise<void> {
  const bookmarks = (await browser.bookmarks.getTree()) as Bookmark[]
  if (!bookmarks[0].children) return

  // Normalize objects before vue
  Bookmarks.reactive.byId = {}
  Bookmarks.byUrl = {}
  const list: Bookmark[] = []
  const walker = (nodes: Bookmark[], count: number): number => {
    for (const n of nodes) {
      Bookmarks.reactive.byId[n.id] = n
      n.sel = false
      n.isOpen = false
      if (n.type === 'separator') n.url = undefined
      else if (n.url) {
        count++
        list.push(n)
        const rBookmark = Bookmarks.reactive.byId[n.id]
        if (Bookmarks.byUrl[n.url]) Bookmarks.byUrl[n.url].push(rBookmark)
        else Bookmarks.byUrl[n.url] = [rBookmark]
      }
      if (n.children) {
        n.len = walker(n.children, 0)
        count += n.len
      }
    }
    return count
  }
  Bookmarks.overallCount = walker(bookmarks[0].children, 0)
  Bookmarks.reactive.tree = bookmarks[0].children

  Sidebar.recalcBookmarksPanels()

  Bookmarks.setupBookmarksListeners()

  if (Settings.state.highlightOpenBookmarks) Bookmarks.markOpenBookmarksForAllTabs()

  if (!Windows.incognito) await restoreTree()

  for (const panel of Sidebar.panels) {
    if (Utils.isBookmarksPanel(panel)) panel.reactive.ready = panel.ready = true
  }

  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (DnD.reactive.isStarted && Utils.isBookmarksPanel(activePanel)) {
    Sidebar.updateBounds()
  }
}

export async function restoreTree(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('expandedBookmarkFolders')
  const expandedBookmarkFolders = stored.expandedBookmarkFolders

  if (expandedBookmarkFolders) {
    for (const panelId of Object.keys(expandedBookmarkFolders)) {
      if (!Sidebar.panelsById[panelId]) delete expandedBookmarkFolders[panelId]
    }
  }

  Bookmarks.reactive.expanded = expandedBookmarkFolders ?? {}
}

export function convertOldTreeStruct(struct?: ID[][]): Record<ID, Record<ID, boolean>> {
  if (!struct) return {}

  const output: Record<ID, boolean> = {}
  for (const path of struct) {
    const id = path.pop?.()
    if (id) output[id] = true
  }

  return { bookmarks: output }
}

export function unload(): void {
  Bookmarks.resetBookmarksListeners()

  Bookmarks.reactive.tree = []
  Bookmarks.reactive.byId = {}
  Bookmarks.byUrl = {}

  for (const panel of Sidebar.panels) {
    if (Utils.isBookmarksPanel(panel)) {
      panel.ready = false
      panel.reactive.ready = false
      panel.reactive.len = 0
    }
  }
}

export function countBookmarks(nodes: Bookmark[]): number {
  let count = 0
  const walker = (nodes: Bookmark[]) => {
    for (const n of nodes) {
      if (n.type === 'bookmark') count++
      if (n.children) walker(n.children)
    }
  }
  walker(nodes)

  return count
}

let saveBookmarksTreeTimeout: number | undefined
/**
 * Save tree state
 */
export function saveBookmarksTree(delay = 128): void {
  if (!Windows.focused) return
  if (Bookmarks.reactive.popup) return
  if (Search.reactive.rawValue) return

  clearTimeout(saveBookmarksTreeTimeout)
  saveBookmarksTreeTimeout = setTimeout(() => {
    const expandedBookmarkFolders = Utils.cloneObject(Bookmarks.reactive.expanded)
    Store.set({ expandedBookmarkFolders }, 500)
  }, delay)
}

/**
 * Expand bookmark folder
 */
export function expandBookmark(nodeId: ID, panelId: ID): void {
  const node = Bookmarks.reactive.byId[nodeId]
  if (!node) return

  const isEmpty = !node.children?.length
  if (Settings.state.autoCloseBookmarks && !isEmpty && !Selection.isBookmarks()) {
    Bookmarks.reactive.expanded[panelId] = {}
  }

  if (!Bookmarks.reactive.expanded[panelId]) Bookmarks.reactive.expanded[panelId] = {}
  const expandedInPanel = Bookmarks.reactive.expanded[panelId]

  const expandPath: ID[] = [nodeId]
  let parent = Bookmarks.reactive.byId[node.parentId]
  while (parent) {
    expandPath.push(parent.id)
    parent = Bookmarks.reactive.byId[parent.parentId]
  }

  for (const id of expandPath) {
    expandedInPanel[id] = true
  }

  saveBookmarksTree()
}

/**
 * Fold bookmark folder
 */
export function foldBookmark(nodeId: ID, panelId: ID): void {
  if (!Bookmarks.reactive.expanded[panelId]) Bookmarks.reactive.expanded[panelId] = {}
  delete Bookmarks.reactive.expanded[panelId][nodeId]

  saveBookmarksTree()
}

export function toggleBranch(nodeId: ID, panelId: ID): void {
  const node = Bookmarks.reactive.byId[nodeId]
  if (!node) return

  const isExpanded = Bookmarks.reactive.expanded[panelId]?.[nodeId]
  if (isExpanded) foldBookmark(nodeId, panelId)
  else expandBookmark(nodeId, panelId)
}

export function openInNewWindow(ids: ID[], incognito?: boolean): void {
  const toOpen: Bookmark[] = []

  // Get ordered list of nodes
  const walker = (nodes: Bookmark[]) => {
    for (const node of nodes) {
      if (node.type === 'separator') continue
      if (ids.includes(node.parentId)) {
        toOpen.push(node)
        ids.push(node.id)
      } else if (ids.includes(node.id)) {
        toOpen.push(node)
      }
      if (node.children) walker(node.children)
    }
  }
  walker(Bookmarks.reactive.tree)

  // Create items info
  const itemsInfo: ItemInfo[] = []
  for (const bookmark of toOpen) {
    const info: ItemInfo = { id: bookmark.id, title: bookmark.title }

    if (itemsInfo.find(i => i.id === bookmark.parentId)) info.parentId = bookmark.parentId

    if (bookmark.type === 'bookmark') info.url = bookmark.url
    if (bookmark.type === 'folder' && Settings.state.tabsTree) {
      info.url = Utils.createGroupUrl(bookmark.title)
    }

    itemsInfo.push(info)
  }

  IPC.bg('createWindowWithTabs', itemsInfo, { incognito })
  return
}

export async function openInNewPanel(ids: ID[]): Promise<void> {
  if (!ids.length) return

  const isFirstTabsPanel = !Sidebar.hasTabs

  // Create panel
  const panel = Sidebar.createTabsPanel()
  const index = Sidebar.getIndexForNewTabsPanel()
  Sidebar.addPanel(index, panel)
  panel.ready = true
  panel.reactive.ready = true
  Sidebar.recalcPanels()
  Sidebar.recalcTabsPanels()
  Sidebar.saveSidebar(300)

  if (isFirstTabsPanel) await Tabs.load()

  // Open tabs in new panel
  return Bookmarks.open(ids, { panelId: panel.id })
}

export interface OpeningBookmarksConfig {
  dst: DstPlaceInfo
  useActiveTab: boolean
  activateFirstTab: boolean
  removeBookmark: boolean
}

export function getMouseOpeningConf(button: number): OpeningBookmarksConfig {
  const conf: OpeningBookmarksConfig = {
    dst: {},
    useActiveTab: false,
    activateFirstTab: false,
    removeBookmark: false,
  }

  // Left click
  if (button === 0) {
    const panelId = Bookmarks.getTargetTabsPanelId()
    conf.useActiveTab = Settings.state.bookmarksLeftClickAction === 'open_in_act'
    conf.activateFirstTab = Settings.state.bookmarksLeftClickActivate
    conf.dst.panelId = panelId
    if (!conf.useActiveTab && Settings.state.bookmarksLeftClickPos === 'after') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === panelId) {
        conf.dst.index = activeTab.index + 1
        conf.dst.parentId = activeTab.parentId
      }
    }
  }

  // Middle click
  else if (button === 1) {
    const panelId = Bookmarks.getTargetTabsPanelId()
    conf.activateFirstTab = Settings.state.bookmarksMidClickActivate
    conf.removeBookmark = Settings.state.bookmarksMidClickRemove
    conf.dst.panelId = panelId
    if (Settings.state.bookmarksMidClickPos === 'after') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === panelId) {
        conf.dst.index = activeTab.index + 1
        conf.dst.parentId = activeTab.parentId
      }
    }
  }

  return conf
}

export async function open(
  ids: ID[],
  dst: DstPlaceInfo,
  useActiveTab?: boolean,
  activateFirstTab?: boolean
): Promise<void> {
  const firstBookmark = Bookmarks.reactive.byId[ids[0]]
  if (ids.length === 1 && firstBookmark?.type === 'separator') return

  const dstContainerId = dst.containerId ?? CONTAINER_ID
  let dstPanel: Panel | undefined
  if (dst.panelId !== undefined) dstPanel = Sidebar.panelsById[dst.panelId]
  if (!Utils.isTabsPanel(dstPanel)) {
    let dstCtxTabsPanel: TabsPanel | undefined
    for (const rule of Tabs.moveRules) {
      if (rule.containerId && !rule.urlRE && !rule.urlStr && rule.containerId === dstContainerId) {
        const panel = Sidebar.panelsById[rule.panelId]
        if (Utils.isTabsPanel(panel)) {
          dstCtxTabsPanel = panel
          break
        }
      }
    }
    dstPanel = dstCtxTabsPanel
  }
  if (!dstPanel) {
    let dstTabsPanel: TabsPanel | undefined
    for (const p of Sidebar.panels) {
      if (Utils.isTabsPanel(p)) {
        dstTabsPanel = p
        break
      }
    }
    dstPanel = dstTabsPanel
  }
  if (Utils.isTabsPanel(dstPanel)) {
    if (dstPanel.newTabCtx && dstPanel.newTabCtx !== 'none' && !dst.containerId) {
      dst.containerId = dstPanel.newTabCtx
    }
    if (dst.index === undefined) {
      dst.index = dstPanel?.nextTabIndex ?? Tabs.list.length
    }
    if (!dst.panelId && dstPanel) dst.panelId = dstPanel.id
  }

  const toOpen: ItemInfo[] = []
  const toRemove: ID[] = []
  const walker = (nodes: Bookmark[]) => {
    for (const node of nodes) {
      if (node.type === 'separator') continue

      const isDirectTarget = ids.includes(node.id)
      const isIndirectTarget = ids.includes(node.parentId)

      if (isDirectTarget || isIndirectTarget) {
        const info: ItemInfo = { id: node.id, title: node.title }
        if (node.url) info.url = node.url
        if (isIndirectTarget) info.parentId = node.parentId
        if (!info.url && info.title && info.title.length > 20) {
          Bookmarks.extractTabInfoFromTitle(info, true)
        }

        // Set url for parent node
        const prev = toOpen[toOpen.length - 1]
        if (prev && prev.id === info.parentId && bookmarkIsParentTab(node, prev.title)) {
          prev.url = info.url
          continue
        }

        if (isIndirectTarget && node.type === 'folder') ids.push(node.id)

        if (
          Settings.state.autoRemoveOther &&
          node.parentId === BKM_OTHER_ID &&
          node.type === 'bookmark'
        ) {
          toRemove.push(info.id)
        }

        toOpen.push(info)
      }

      if (node.children) walker(node.children)
    }
  }

  if (ids.length === 1 && firstBookmark?.type === 'bookmark') {
    if (useActiveTab) {
      browser.tabs.update({ url: Utils.normalizeUrl(firstBookmark.url, firstBookmark.title) })
      if (Settings.state.autoRemoveOther && firstBookmark.parentId === BKM_OTHER_ID) {
        Bookmarks.removeBookmarks([firstBookmark.id])
      }
      return
    }

    if (Settings.state.autoRemoveOther && firstBookmark.parentId === BKM_OTHER_ID) {
      toRemove.push(firstBookmark.id)
    }

    toOpen.push({ id: firstBookmark.id, url: firstBookmark.url, title: firstBookmark.title })
  } else {
    walker(Bookmarks.reactive.tree)
  }

  if (!toOpen.length) return

  if (activateFirstTab) toOpen[0].active = true

  try {
    await Tabs.open(toOpen, dst)
  } catch (err) {
    Logs.err('Bookmarks: Cannot open bookmark[s]', err)
  }

  if (toRemove.length) {
    Bookmarks.removeBookmarks(toRemove)
  }
}

export async function createBookmarkNode(
  type: browser.bookmarks.TreeNodeType,
  target: Bookmark
): Promise<void> {
  let parentId: ID | undefined
  let index = 0

  if (target.type === 'bookmark' || target.type === 'separator') {
    parentId = target.parentId
    index = target.index + 1
  } else if (target.type === 'folder') {
    parentId = target.id
  }

  if (!parentId) parentId = BKM_OTHER_ID

  if (type === 'separator') {
    browser.bookmarks.create({ parentId, type: 'separator', index })
  } else {
    const isBookmark = type === 'bookmark'
    const result = await openBookmarksPopup({
      title: translate('popup.bookmarks.' + (isBookmark ? 'create_bookmark' : 'create_folder')),
      nameField: true,
      urlField: isBookmark,
      locationField: true,
      location: parentId,
      controls: [{ label: 'btn.create' }],
      validate: popupState => {
        popupState.nameValid = !!popupState.name
        popupState.urlValid = !!popupState.url
      },
    })

    if (result) {
      if (parentId !== result.location) index = 0

      parentId = result.location ?? BKM_OTHER_ID
      if (parentId === NOID) parentId = BKM_OTHER_ID

      browser.bookmarks.create({
        parentId,
        title: result.name,
        type,
        url: result.url,
        index,
      })
    }
  }
}

export async function editBookmarkNode(target: Bookmark): Promise<void> {
  if (target.type === 'separator') return

  const isBookmark = target.type === 'bookmark'
  const result = await openBookmarksPopup({
    target,
    title: translate(isBookmark ? 'popup.bookmarks.edit_bookmark' : 'popup.bookmarks.edit_folder'),
    nameField: true,
    urlField: isBookmark,
    controls: [{ label: 'btn.save' }],
    validate: popupState => {
      popupState.nameValid = !!popupState.name
      popupState.urlValid = !popupState.urlField || !!popupState.url

      if (popupState.controls) {
        if (!popupState.nameValid || !popupState.urlValid) {
          popupState.controls[0].inactive = true
        } else {
          popupState.controls[0].inactive = false
        }
      }
    },
  })

  if (result) {
    if (isBookmark) browser.bookmarks.update(target.id, { title: result.name, url: result.url })
    else browser.bookmarks.update(target.id, { title: result.name })
  }
}

export function openBookmarksPopup(
  config: BookmarksPopupConfig
): Promise<BookmarksPopupResult | void> {
  return new Promise<BookmarksPopupResult | void>(res => {
    const popupState: BookmarksPopupState = {
      ...config,
      name: config.target?.title ?? '',
      nameValid: true,
      url: config.target?.url ?? '',
      urlValid: true,
      close: (result?: BookmarksPopupResult) => {
        res(result)
        Bookmarks.reactive.popup = null
      },
    }
    if (!popupState.name && config.name) popupState.name = config.name
    if (!popupState.url && config.url) popupState.url = config.url
    Bookmarks.reactive.popup = popupState
  })
}

/**
 * Remove bookmarks
 */
export async function removeBookmarks(ids: ID[], silent = false): Promise<void> {
  let count = 0
  let hasCollapsed = false
  const expandedBookmarks = Bookmarks.reactive.expanded[Sidebar.reactive.activePanelId]
  const deleted: Bookmark[] = []
  const idsToRemove = []
  const favicons: string[] = []
  const walker = (nodes: Bookmark[]) => {
    for (const n of nodes) {
      count++
      deleted.push(n)
      if (n.children && n.children.length) {
        const isExpanded = expandedBookmarks?.[n.id]
        if (!isExpanded) hasCollapsed = true
        walker(n.children)
      }
    }
  }
  for (const id of ids) {
    const n = Bookmarks.reactive.byId[id]
    if (!n) continue
    if (ids.includes(n.parentId)) continue
    count++
    if (n.url) {
      const fav = Favicons.reactive.list[Favicons.reactive.domains[Utils.getDomainOf(n.url)]]
      if (fav) favicons.push(fav)
      else Favicons.getFavPlaceholder(n.url)
    }
    deleted.push(n)
    idsToRemove.push(id)
    if (n.children && n.children.length) {
      const isExpanded = expandedBookmarks?.[n.id]
      if (!isExpanded) hasCollapsed = true
      walker(n.children)
    }
  }

  const warn =
    Settings.state.warnOnMultiBookmarkDelete === 'any' ||
    (Settings.state.warnOnMultiBookmarkDelete === 'collapsed' && hasCollapsed)
  if (warn && count > 1) {
    const ok = await Popups.confirm(translate('confirm.bookmarks_delete'))
    if (!ok) return
  }

  for (const id of idsToRemove) {
    await browser.bookmarks.removeTree(id)
  }

  if (count > 0 && Settings.state.bookmarksRmUndoNote && !warn && !silent) {
    Notifications.notify({
      icon: '#icon_trash',
      title: String(count) + translate('notif.bookmarks_rm_post', count),
      ctrl: translate('notif.undo_ctrl'),
      favicons: favicons.length ? favicons : undefined,
      callback: () => undoRemove(deleted),
    })
  }
}

async function undoRemove(deleted: Bookmark[]): Promise<void> {
  const oldNewIds: Record<ID, ID> = {}
  let offset = 0
  let prevParent
  for (const n of deleted) {
    if (prevParent !== n.parentId) offset = 0
    const conf: browser.bookmarks.CreateDetails = { type: n.type, index: n.index + offset }
    if (Bookmarks.reactive.byId[n.parentId]) conf.parentId = n.parentId
    if (oldNewIds[n.parentId]) conf.parentId = oldNewIds[n.parentId]
    if (n.type !== 'separator') conf.title = n.title
    if (n.type === 'bookmark') conf.url = n.url
    const newNode = await browser.bookmarks.create(conf)
    prevParent = n.parentId
    oldNewIds[n.id] = newNode.id
    offset++
  }
}

/**
 * Collapse all bookmarks folders
 */
export function collapseAllBookmarks(panelId: ID): void {
  Bookmarks.reactive.expanded[panelId] = {}
  saveBookmarksTree()
}

/**
 * Sort bookmarks
 */
export async function sortBookmarks(
  type: BookmarksSortType,
  nodeIds: ID[],
  dir = 0
): Promise<void> {
  const byName = type === 'name'
  const byLink = type === 'link'
  const byTime = type === 'time'

  let notifIcon: string | undefined
  if (byName) {
    if (dir > 0) notifIcon = '#icon_sort_name_asc'
    else notifIcon = '#icon_sort_name_des'
  } else if (byLink) {
    if (dir > 0) notifIcon = '#icon_sort_url_asc'
    else notifIcon = '#icon_sort_url_des'
  } else if (byTime) {
    if (dir > 0) notifIcon = '#icon_sort_time_asc'
    else notifIcon = '#icon_sort_time_des'
  }

  const expandedBookmarks = Bookmarks.reactive.expanded[Sidebar.reactive.activePanelId]

  // Separate nodes by groups (bookmarks with the same parentId)
  const groups: Record<string, Bookmark[]> = {}
  let count = 0
  const walker = (nodes: Bookmark[]) => {
    for (const node of nodes) {
      if (node.type === 'separator') continue
      if (type !== 'link' || node.url) {
        if (!groups[node.parentId]) groups[node.parentId] = []
        groups[node.parentId].push(node)
        count++
      }
      if (node.children && expandedBookmarks?.[node.id]) walker(node.children)
    }
  }
  for (const nodeId of nodeIds) {
    const node = Bookmarks.reactive.byId[nodeId]
    if (!node) continue
    if (node.type === 'separator') continue
    if (type !== 'link' || node.url) {
      if (!groups[node.parentId]) groups[node.parentId] = []
      groups[node.parentId].push(node)
      count++
    }
    if (node.children && expandedBookmarks?.[node.id]) walker(node.children)
  }

  const initialCount = count

  let progressNotification
  let stopSorting = false
  if (count > 25) {
    progressNotification = Notifications.progress({
      icon: notifIcon,
      title: translate('notif.bookmarks_sort'),
      ctrl: translate('btn.stop'),
      callback: () => {
        stopSorting = true
      },
    })
  }

  // Sort
  for (const nodes of Object.values(groups)) {
    if (nodes.length === 1) {
      count--
      continue
    }

    // Min index - target index to move
    const minIndex = nodes.reduce((a, v) => Math.min(a, v.index), 9999)

    // Direction
    if (dir === 0) {
      const last = nodes[nodes.length - 1]
      let first = nodes.find(n => n.type === last.type) ?? nodes[0]
      if (first === last) first = nodes[0]
      if (!first) break
      if (byName) dir = first.title.localeCompare(last.title)
      if (byLink) {
        if (first.url && last.url) dir = first.url.localeCompare(last.url)
        else dir = 0
      }
      if (byTime) {
        if (first.dateAdded === undefined || last.dateAdded === undefined) dir = 0
        else dir = first.dateAdded - last.dateAdded
      }
    }
    if (dir === 0) break

    nodes.sort((aa, bb) => {
      if (aa.type !== bb.type) {
        if (aa.type === 'folder') return -1
        if (aa.type === 'bookmark') return 1
      }

      const a = dir > 0 ? aa : bb
      const b = dir > 0 ? bb : aa

      if (byName) return a.title.localeCompare(b.title)
      if (byLink && a.url && b.url) {
        const aIndex = a.url.indexOf('://')
        const bIndex = b.url.indexOf('://')
        const aLink = aIndex === -1 ? a.url : a.url.slice(aIndex + 3)
        const bLink = bIndex === -1 ? b.url : b.url.slice(bIndex + 3)
        return aLink.localeCompare(bLink)
      }
      if (byTime && a.dateAdded !== undefined && b.dateAdded !== undefined) {
        return a.dateAdded - b.dateAdded
      }
      return 0
    })

    for (let n, i = 0; i < nodes.length; i++) {
      if (stopSorting) break

      n = nodes[i]
      await browser.bookmarks.move(n.id, { index: minIndex + i })
      count--
      if (progressNotification) {
        Notifications.updateProgress(progressNotification, initialCount - count, initialCount)
      }
    }
  }

  if (progressNotification) Notifications.finishProgress(progressNotification)
}

const unmarkOpenBookmarksTimeout: Record<string, number> = {}

export function unmarkOpenBookmarksDebounced(url: string, delay = 500): void {
  clearTimeout(unmarkOpenBookmarksTimeout[url])
  unmarkOpenBookmarksTimeout[url] = setTimeout(() => {
    delete unmarkOpenBookmarksTimeout[url]
    unmarkOpenBookmarks(url)
  }, delay)
}

export function unmarkOpenBookmarks(url: string): void {
  clearTimeout(unmarkOpenBookmarksTimeout[url])
  unmarkOpenBookmarksTimeout[url] = setTimeout(() => {
    delete unmarkOpenBookmarksTimeout[url]

    const bookmarks = Bookmarks.byUrl[url]
    if (!bookmarks) return

    for (const b of bookmarks) {
      b.isOpen = false
      Bookmarks.unmarkParents(b)
    }
  }, 500)
}

export function reMarkOpenBookmark(bookmark: Bookmark): void {
  if (!bookmark.url) return

  const tabIsOpen = !!Tabs.urlsInUse[bookmark.url]
  const bookmarkIsMarked = bookmark.isOpen ?? false
  if (tabIsOpen === bookmarkIsMarked) return

  // Unmark
  if (bookmarkIsMarked) {
    bookmark.isOpen = false
    Bookmarks.unmarkParents(bookmark)
  }

  // Mark
  else {
    bookmark.isOpen = true
    Bookmarks.markParents(bookmark)
  }
}

const markOpenBookmarksTimeout: Record<string, number> = {}

export function markOpenBookmarksDebounced(url: string, delay = 500): void {
  clearTimeout(markOpenBookmarksTimeout[url])
  markOpenBookmarksTimeout[url] = setTimeout(() => {
    delete markOpenBookmarksTimeout[url]
    markOpenBookmarks(url)
  }, delay)
}

export function markOpenBookmarks(url: string): void {
  const bookmarks = Bookmarks.byUrl[url]
  if (!bookmarks) return

  for (const b of bookmarks) {
    b.isOpen = true
    Bookmarks.markParents(b)
  }
}

export function unmarkAllOpenBookmarks(nodes?: Bookmark[]): void {
  if (!nodes) {
    nodes = Bookmarks.reactive.tree
    Bookmarks.markedFolders = {}
  }

  for (const node of nodes) {
    if (node.children?.length && node.isOpen) unmarkAllOpenBookmarks(node.children)
    node.isOpen = false
  }
}

export function markOpenBookmarksForAllTabs(): void {
  for (const url of Object.keys(Tabs.urlsInUse)) {
    markOpenBookmarks(url)
  }
}

export function markParents(node: Bookmark): void {
  let parent = Bookmarks.reactive.byId[node.parentId]
  while (parent) {
    Bookmarks.markedFolders[parent.id] = (Bookmarks.markedFolders[parent.id] ?? 0) + 1
    if (!parent.isOpen) parent.isOpen = true
    else break
    parent = Bookmarks.reactive.byId[parent.parentId]
  }
}

export function unmarkParents(node: Bookmark): void {
  let parent = Bookmarks.reactive.byId[node.parentId]
  while (parent) {
    Bookmarks.markedFolders[parent.id] = (Bookmarks.markedFolders[parent.id] ?? 1) - 1
    if (!Bookmarks.markedFolders[parent.id] && parent.isOpen) parent.isOpen = false
    else break
    parent = Bookmarks.reactive.byId[parent.parentId]
  }
}

export async function createFromDragEvent(e: DragEvent, dst: DstPlaceInfo): Promise<void> {
  if (!dst.parentId || !Bookmarks.reactive.byId[dst.parentId]) return

  // Handle sidebery dnd info from another firefox profile
  const dndInfo = e.dataTransfer?.getData('application/x-sidebery-dnd')
  if (dndInfo) {
    let info: DragInfo
    try {
      info = JSON.parse(dndInfo) as DragInfo
    } catch (err) {
      return
    }
    if (info.items) {
      const groupUrlStartRe = /^moz-extension:\/\/.{36}\/(page.)?group\/group\.html(.+)$/
      // Update sidebery internal urls
      for (const item of info.items) {
        if (item.url && groupUrlStartRe.test(item.url)) {
          item.url = item.url.replace(groupUrlStartRe, (_, _1, $2: string) => GROUP_URL + $2)
        }
      }

      Bookmarks.createFrom(info.items, dst)
    }
    return
  }

  const result = await Utils.parseDragEvent(e)
  if (!result?.url) return
  if (!result.text) result.text = Tabs.list.find(t => t.url === result.url)?.title

  await browser.bookmarks.create({
    url: result.url,
    title: result.text || result.url,
    index: dst.index,
    parentId: dst.parentId,
  })
}

export async function move(ids: ID[], dst: DstPlaceInfo): Promise<void> {
  if (!dst.parentId) {
    const firstNode = Bookmarks.reactive.byId[ids[0]]
    if (!firstNode) return Logs.warn('Bookmarks: Cannot move bookmarks: No first node')

    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.move_to'),
      location: firstNode.parentId,
      locationField: true,
      locationTree: false,
      newFolderPosition: [firstNode.parentId, firstNode.index],
      recentLocations: true,
      controls: [{ label: translate('popup.bookmarks.move') }],
    })
    if (result?.location) {
      dst.parentId = result.location
    } else {
      return Logs.warn('Bookmarks: Cannot move bookmarks: No destination')
    }
  }

  let dstIndex = dst.index
  if (dstIndex === undefined) {
    const parent = Bookmarks.reactive.byId[dst.parentId]
    dstIndex = parent?.children?.length ?? 0
  }

  for (const id of ids) {
    const bookmark = Bookmarks.reactive.byId[id]
    if (!bookmark) continue
    if (ids.includes(bookmark.parentId)) continue
    if (bookmark.parentId === dst.parentId && bookmark.index < dstIndex) dstIndex--
    await browser.bookmarks.move(id, { parentId: dst.parentId, index: dstIndex++ })
  }
}

export function attachTabInfoToTitle(item: ItemInfo) {
  if (item.pinned) item.title += ' ' + PIN_MARK
  if (item.container && item.container !== CONTAINER_ID) {
    const container = Containers.reactive.byId[item.container]
    if (container) item.title += ` [${Containers.getCUID(container)}]`
  }
}

export function extractTabInfoFromTitle(item: ItemInfo, updateTitleOnly?: boolean) {
  if (!item.title) return

  const pinIndex = item.title.indexOf(' ' + PIN_MARK)
  if (pinIndex !== -1) {
    item.title = item.title.slice(0, pinIndex) + item.title.slice(pinIndex + 1 + PIN_MARK.length)
    if (!updateTitleOnly) item.pinned = true
  }

  const nameExec = FOLDER_NAME_DATA_RE.exec(item.title)
  if (nameExec) {
    if (nameExec[2]) {
      const container = Containers.findUnique(Containers.parseCUID(nameExec[2]))
      if (container) {
        item.title = nameExec[1]
        if (!updateTitleOnly) item.container = container.id
      }
    }
  }
}

/**
 * Creates bookmarks in destination folder
 */
export async function createFrom(
  items: ItemInfo[],
  dst: DstPlaceInfo,
  progress?: Notification
): Promise<void> {
  if (!dst.parentId) return Logs.warn('Bookmarks: Cannot create bookmarks: No parentId')
  let dstIndex = dst.index
  let n = 0

  if (dstIndex === undefined) {
    const parent = Bookmarks.reactive.byId[dst.parentId]
    dstIndex = parent?.children?.length ?? 0
  }

  if (Settings.state.tabsTreeBookmarks) {
    const idsMap: Partial<Record<ID, ID>> = {}

    for (const item of items) {
      const parent = items.find(t => t.id === item.parentId)
      const children = items.filter(t => t.parentId === item.id)
      const parentId = idsMap[item.parentId ?? NOID] ?? dst.parentId
      const index = !parent ? dstIndex++ : undefined

      // Create folder
      if (children.length) {
        const folderConf = { title: item.title, parentId, index }
        const folder = (await browser.bookmarks.create(folderConf)) as Bookmark
        idsMap[item.id] = folder.id

        if (progress) Notifications.updateProgress(progress, n++, items.length)

        // Create bookmark of parent item
        if (item.url && !GROUP_RE.test(item.url)) {
          attachTabInfoToTitle(item)
          const url = Utils.denormalizeUrl(item.url)
          await browser.bookmarks.create({ title: item.title, url, parentId: folder.id })
        }

        continue
      }

      attachTabInfoToTitle(item)
      const url = Utils.denormalizeUrl(item.url)
      await browser.bookmarks.create({ title: item.title, url, parentId, index })

      if (progress) Notifications.updateProgress(progress, n++, items.length)
    }
  } else {
    for (const t of items) {
      attachTabInfoToTitle(t)
      await browser.bookmarks.create({
        url: Utils.denormalizeUrl(t.url),
        title: t.title,
        index: dstIndex++,
        parentId: dst.parentId,
      })

      if (progress) Notifications.updateProgress(progress, n++, items.length)
    }
  }
}

/**
 * Creates or reuse bookmarks in destination folder.
 * Optionally returns list of old unused bookmarks.
 */
export async function saveToFolder(
  items: ItemInfo[],
  dst: DstPlaceInfo,
  removeOld: boolean,
  progress?: Notification
): Promise<Bookmark[] | void> {
  if (!dst.parentId) return Logs.warn('Bookmarks.saveToFolder: No dst parentId')

  const dstFolder = Bookmarks.reactive.byId[dst.parentId]
  if (!dstFolder) return Logs.warn('Bookmarks.saveToFolder: No dst parent folder')

  const panelFolderId = dstFolder.id
  const bookmarksList = Array.from(listBookmarks(dstFolder.children))
  let n = 0

  // Tree
  if (Settings.state.tabsTreeBookmarks) {
    const idsMap: Partial<Record<ID, ID>> = { [NOID]: panelFolderId }
    const indexes: Record<ID, number> = { [panelFolderId]: 0 }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const nextItem = items[i + 1]
      const parentFolderId = idsMap[item.parentId ?? NOID]
      if (parentFolderId === undefined) {
        Logs.warn('Bookmarks.saveToFolder: No parentFolderId: Skipping')
        continue
      }

      // Get target index and update indexes map
      let index = indexes[parentFolderId]
      if (index === undefined) {
        index = 0
        indexes[parentFolderId] = 0
      }
      indexes[parentFolderId] += 1

      // Separator
      if (!item.url && !item.title) {
        const sepIndex = bookmarksList.findIndex(n => n.type === 'separator')
        const separator = bookmarksList[sepIndex]
        // Separator exists
        if (separator) {
          bookmarksList.splice(sepIndex, 1)
          if (separator.index !== index || parentFolderId !== separator.parentId) {
            await browser.bookmarks.move(separator.id, { index, parentId: parentFolderId })
          }
        }
        // Create separator
        else {
          const createConf = { type: 'separator' as const, index, parentId: parentFolderId }
          await browser.bookmarks.create(createConf)
        }
        continue
      }

      // Folder
      if (nextItem?.parentId === item.id || !item.url) {
        const folderIndex = bookmarksList.findIndex(n => {
          return n.type === 'folder' && n.title === item.title
        })
        let folder = bookmarksList[folderIndex]
        // Folder exists
        if (folder) {
          bookmarksList.splice(folderIndex, 1)
          // Move folder
          if (folder.index !== index || parentFolderId !== folder.parentId) {
            await browser.bookmarks.move(folder.id, { index, parentId: parentFolderId })
          }
        }
        // Create folder
        else {
          const createConf = { title: item.title, index, parentId: parentFolderId }
          folder = (await browser.bookmarks.create(createConf)) as Bookmark
        }

        indexes[folder.id] = 0
        idsMap[item.id] = folder.id

        if (progress) Notifications.updateProgress(progress, n++, items.length)

        // Bookmark of the parent item
        if (item.url && !GROUP_RE.test(item.url)) {
          attachTabInfoToTitle(item)
          const bookmarkIndex = bookmarksList.findIndex(n => {
            return n.type === 'bookmark' && n.title === item.title && n.url === item.url
          })
          let bookmark = bookmarksList[bookmarkIndex]
          // Bookmark exists
          if (bookmark) {
            bookmarksList.splice(bookmarkIndex, 1)
            if (bookmark.index !== 0 || folder.id !== bookmark.parentId) {
              await browser.bookmarks.move(bookmark.id, { index: 0, parentId: folder.id })
            }
          }
          // Create bookmark
          else {
            const url = Utils.denormalizeUrl(item.url)
            const createConf = { title: item.title, url, index: 0, parentId: folder.id }
            bookmark = (await browser.bookmarks.create(createConf)) as Bookmark
          }
          indexes[folder.id]++
        }
        continue
      }

      // Bookmark
      attachTabInfoToTitle(item)
      const bookmarkIndex = bookmarksList.findIndex(n => {
        return n.type === 'bookmark' && n.title === item.title && n.url === item.url
      })
      let bookmark = bookmarksList[bookmarkIndex]
      // Bookmark exists
      if (bookmark) {
        bookmarksList.splice(bookmarkIndex, 1)
        if (bookmark.index !== index || parentFolderId !== bookmark.parentId) {
          await browser.bookmarks.move(bookmark.id, { index, parentId: parentFolderId })
        }
      }
      // Create bookmark
      else {
        const url = Utils.denormalizeUrl(item.url)
        const createConf = { title: item.title, url, index, parentId: parentFolderId }
        bookmark = (await browser.bookmarks.create(createConf)) as Bookmark
      }

      if (progress) Notifications.updateProgress(progress, n++, items.length)
    }
  }

  // Plain list
  else {
    let index = 0

    for (const item of items) {
      if (item.url && GROUP_RE.test(item.url)) continue

      attachTabInfoToTitle(item)
      const bookmarkIndex = bookmarksList.findIndex(n => {
        return n.type === 'bookmark' && n.title === item.title && n.url === item.url
      })
      let bookmark = bookmarksList[bookmarkIndex]
      // Bookmark exists
      if (bookmark) {
        bookmarksList.splice(bookmarkIndex, 1)
        if (bookmark.index !== index || panelFolderId !== bookmark.parentId) {
          await browser.bookmarks.move(bookmark.id, { index, parentId: panelFolderId })
        }
      }
      // Create bookmark
      else {
        const url = Utils.denormalizeUrl(item.url)
        const createConf = { title: item.title, url, index, parentId: panelFolderId }
        bookmark = (await browser.bookmarks.create(createConf)) as Bookmark
      }

      if (progress) Notifications.updateProgress(progress, n++, items.length)

      index++
    }
  }

  if (bookmarksList.length > 0 && !removeOld && Settings.state.oldBookmarksAfterSave === 'ask') {
    const answer = await askWhatToDoWithOldUnusedBookmarks(dstFolder.title)
    if (answer === 'delete') removeOld = true
  }
  if (Settings.state.oldBookmarksAfterSave === 'del') removeOld = true

  // Cleaning up
  for (const node of bookmarksList) {
    // Remove empty folders
    if (node.type === 'folder' && node.children && !node.children.length) {
      await browser.bookmarks.removeTree(node.id)
    }

    // Remove remained bookmarks
    else if (removeOld) {
      if (bookmarksList.find(n => n.id === node.parentId)) continue
      else if (node.type === 'folder') await browser.bookmarks.removeTree(node.id)
      else await browser.bookmarks.remove(node.id)
    }
  }
}

async function askWhatToDoWithOldUnusedBookmarks(folderName: string): Promise<string | null> {
  let remember = false

  // Shrink folder name
  if (folderName.length > 16) {
    const index = folderName.indexOf(' [')
    if (index > 0) folderName = folderName.slice(0, index)
  }

  const conf: DialogConfig = {
    title: translate('popup.wtdwOldBookmarks.title', folderName),
    note: translate('popup.wtdwOldBookmarks.note'),
    checkbox: {
      label: translate('popup.wtdwOldBookmarks.checkbox_label'),
      value: remember,
      update: value => (remember = value),
    },
    buttons: [
      {
        value: 'delete',
        label: translate('popup.wtdwOldBookmarks.delete'),
      },
      {
        value: 'keep',
        label: translate('popup.wtdwOldBookmarks.keep'),
      },
    ],
    buttonsCentered: true,
  }

  const result = await Popups.ask(conf)

  if (remember) {
    if (result === 'delete') Settings.state.oldBookmarksAfterSave = 'del'
    if (result === 'keep') Settings.state.oldBookmarksAfterSave = 'keep'
    Settings.saveDebounced(150)
  }

  return result
}

export function scrollBookmarksToEdge(panel?: Panel): void {
  if (!panel) panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isBookmarksPanel(panel)) return
  if (!panel.scrollComponent || !panel.scrollEl) return

  const scrollableBoxEl = panel.scrollComponent.getScrollableBox()
  if (!scrollableBoxEl) return

  if (panel.scrollEl.scrollTop === 0) {
    scrollableBoxEl.scrollIntoView({ behavior: 'smooth', block: 'end' })
  } else {
    scrollableBoxEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function getPath(bookmark: Bookmark): ID[] {
  let parent = Bookmarks.reactive.byId[bookmark.parentId]
  const path: ID[] = []

  while (parent) {
    path.unshift(parent.id)
    parent = Bookmarks.reactive.byId[parent.parentId]
  }

  return path
}

export function findBookmarkPanelOf(bookmark: Bookmark): ID | void {
  const path = Bookmarks.getPath(bookmark)

  for (const panel of Sidebar.panels) {
    if (!Utils.isBookmarksPanel(panel)) continue
    if (panel.rootId === NOID || panel.rootId === BKM_ROOT_ID) return panel.id
    if (path.includes(panel.rootId)) return panel.id
  }
}

let scrollToBookmarkTimeout: number | undefined
export function scrollToBookmarkDebounced(id: ID, forced?: boolean, delay = 120): void {
  clearTimeout(scrollToBookmarkTimeout)
  scrollToBookmarkTimeout = setTimeout(() => scrollToBookmark(id, forced), delay)
}

const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
export function scrollToBookmark(id: ID, forced?: boolean): void {
  let panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (
    Utils.isTabsPanel(panel) &&
    Sidebar.subPanelActive &&
    Sidebar.subPanelType === SubPanelType.Bookmarks &&
    Sidebar.subPanels.bookmarks
  ) {
    panel = Sidebar.subPanels.bookmarks
  }
  if (!Utils.isBookmarksPanel(panel) || !panel.scrollEl) return

  const elId = 'bookmark' + id.toString()
  const el = document.getElementById(elId)
  const bodyEl = el?.firstElementChild as HTMLElement | null | undefined
  if (!el || !bodyEl) return

  const sR = panel.scrollEl.getBoundingClientRect()
  const bR = el.getBoundingClientRect()
  const pH = panel.scrollEl.offsetHeight
  const pS = panel.scrollEl.scrollTop
  const bH = bodyEl.offsetHeight
  const bY = bR.top - sR.top + pS

  if (forced) {
    let y = bY - PRE_SCROLL
    if (y < 0) y = 0
    scrollConf.top = y
    panel.scrollEl.scroll(scrollConf)
    return
  }

  if (bY < pS + PRE_SCROLL) {
    if (pS > 0) {
      let y = bY - PRE_SCROLL
      if (y < 0) y = 0
      scrollConf.top = y
      panel.scrollEl.scroll(scrollConf)
    }
  } else if (bY + bH > pS + pH - PRE_SCROLL) {
    scrollConf.top = bY + bH - pH + PRE_SCROLL
    panel.scrollEl.scroll(scrollConf)
  }
}

export function* listBookmarks(nodes?: Bookmark[]): IterableIterator<Bookmark> {
  if (!nodes) nodes = Bookmarks.reactive.tree

  for (const n of nodes) {
    yield n
    if (n.children) yield* listBookmarks(n.children)
  }
}

export function openAsBookmarksPanel(node: Bookmark) {
  if (node.type !== 'folder') return

  const index = Sidebar.reactive.nav.indexOf(Sidebar.reactive.activePanelId)
  if (index === -1) return

  // Get name for new panel
  let panelName: string | undefined
  const titleExec = FOLDER_NAME_DATA_RE.exec(node.title)
  if (titleExec) panelName = titleExec[1]
  else panelName = node.title

  // Start bookmarks panel creation
  Popups.openPanelPopup({
    type: PanelType.bookmarks,
    name: panelName,
    rootId: node.id,
  })
}

export async function openAsTabsPanel(folder: Bookmark, showConfigPopup: boolean): Promise<void> {
  if (folder.type !== 'folder') return

  const noTabsPanels = !Sidebar.hasTabs
  const index = Sidebar.getIndexForNewTabsPanel()
  let tabsPanel: Panel | undefined

  if (showConfigPopup) {
    // Use folder name as default panel name and open panel popup
    const result = await Popups.openPanelPopup(
      { type: PanelType.tabs, name: folder.title, bookmarksFolderId: folder.id },
      index
    )
    if (!result) return Logs.warn('Bookmarks.openAsTabsPanel: No result')

    tabsPanel = Sidebar.panelsById[result]
  } else {
    // Create panel
    tabsPanel = Sidebar.createTabsPanel()
    tabsPanel.ready = true
    tabsPanel.reactive.ready = true
    Sidebar.addPanel(index, tabsPanel)
    Sidebar.recalcPanels()
    Sidebar.recalcTabsPanels()
    Sidebar.saveSidebar(300)
  }

  if (!Utils.isTabsPanel(tabsPanel)) return Logs.warn('Bookmarks.openAsTabsPanel: No tabsPanel')

  if (noTabsPanels) await Tabs.load()

  // Get top-lvl ids for opening
  const ids = folder.children?.map(n => n.id) ?? []

  // Preserve tree structure if title of target folder and first child are the same
  if (folder.children?.length) {
    const includeParent = folder.title === folder.children[0]?.title
    if (includeParent) ids.unshift(folder.id)
  }

  // Open tabs
  if (ids.length) await Bookmarks.open(ids, { panelId: tabsPanel.id })
}

export async function copyUrls(ids: ID[]): Promise<void> {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  let urls = ''
  for (const id of ids) {
    const bookmark = Bookmarks.reactive.byId[id]
    if (bookmark && bookmark.url) urls += '\n' + bookmark.url
  }

  const resultString = urls.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export async function copyTitles(ids: ID[]): Promise<void> {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  let titles = ''
  for (const id of ids) {
    const bookmark = Bookmarks.reactive.byId[id]
    if (bookmark && bookmark.title) titles += '\n' + bookmark.title
  }

  const resultString = titles.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export function getTargetTabsPanelId(): ID {
  let panelId = Sidebar.reactive.activePanelId
  if (!Utils.isTabsPanel(Sidebar.panelsById[panelId])) {
    panelId = Sidebar.lastTabsPanelId
  }
  return panelId
}

export function isFolderWithURL(folder: Bookmark): boolean {
  if (!folder.children) return false

  const firstChild = folder.children[0]
  if (!firstChild?.url) return false

  const title = folder.title
  const childTitle = firstChild.title

  if (childTitle === title) return true

  return childTitle.startsWith(title) && childTitle[title.length + 1] === '['
}

function bookmarkIsParentTab(node: Bookmark, parentTitle?: string): boolean {
  if (!node.url || !parentTitle) return false

  const childTitle = node.title

  if (childTitle === parentTitle) return true

  return childTitle.startsWith(parentTitle) && childTitle[parentTitle.length + 1] === '['
}

/**
 * Check permission and load bookmarks
 */
export async function prepareBookmarks() {
  if (!Permissions.reactive.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return false
  }
  if (!Bookmarks.reactive.tree.length) await Bookmarks.load()
  return true
}
