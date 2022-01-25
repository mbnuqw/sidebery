import Utils from 'src/utils'
import { NOID, BKM_OTHER_ID, BKM_MENU_ID, BKM_TLBR_ID, BKM_MOBILE_ID, NEWID } from 'src/defaults'
import { Stored, ItemInfo } from 'src/types'
import { RemovedBookmark, RemovedTab, RemovedWindow } from 'src/types'
import { StoredRemovedBookmark, StoredRemovedBookmarkChild } from 'src/types'
import { StoredRemovedTab, StoredRemovedWindow } from 'src/types'
import { Store } from 'src/services/storage'
import { Sidebar } from 'src/services/sidebar'
import { Bookmarks } from 'src/services/bookmarks'
import { Windows } from 'src/services/windows'
import { Tabs as TabsFG } from 'src/services/tabs.fg'
import { Tabs as TabsBG } from 'src/services/tabs.bg'
import { Info } from 'src/services/info'
import { CONTAINER_ID } from 'src/defaults/containers'
import { Trash } from 'src/services/trash'
import { Logs } from './logs'
import { Tab, TabCache } from 'src/types/tabs'
import { Bookmark } from 'src/types/bookmarks'
import { Window } from 'src/types/windows'
import { RemovedItem, RemovedItemType } from 'src/types/trash'
import { Msg } from './msg'
import { InstanceType } from 'src/types/msg'
import { translate } from 'src/dict'

const TABS_LIMIT = 640
const TABS_LIMIT_STEP = 50
const WINDOWS_LIMIT = 25
const WINDOWS_LIMIT_STEP = 5
const BOOKMARKS_LIMIT = 250
const BOOKMARKS_LIMIT_STEP = 50
const SAVE_DELAY = 1000
const NOW = Date.now()

export async function load(): Promise<void> {
  const keys: (keyof Stored)[] = ['removedTabs', 'removedBookmarks', 'removedWindows']
  if (Info.isSidebar) keys.push('prevTabsDataCache')
  const storage = await browser.storage.local.get<Stored>(keys)
  const storedTabs = storage?.removedTabs ?? []
  const storedBookmarks = storage?.removedBookmarks ?? []
  const storedWindows = storage?.removedWindows ?? []

  if (Info.isBg) {
    Trash.storedTabs = storedTabs
    Trash.storedBookmarks = storedBookmarks
    Trash.storedWindows = storedWindows
  }

  if (Info.isSidebar) {
    const prevTabsCache = storage?.prevTabsDataCache ?? []
    const tabs: RemovedTab[] = []
    const bookmarks: RemovedBookmark[] = []
    const windows: RemovedWindow[] = []

    for (let i = storedTabs.length; i--; ) {
      const tab = storedTabs[i]
      convertStoredTabToState(tab)
      tabs.push(tab as RemovedTab)
    }
    for (let i = storedBookmarks.length; i--; ) {
      const bookmark = storedBookmarks[i]
      convertStoredBookmarkToState(bookmark)
      bookmarks.push(bookmark as RemovedBookmark)
    }
    for (let i = storedWindows.length; i--; ) {
      const window = storedWindows[i]
      convertStoredWindowToState(window)
      windows.push(window as RemovedWindow)
    }

    Trash.reactive.tabs = tabs
    Trash.reactive.bookmarks = bookmarks
    Trash.reactive.windows = windows
    Trash.reactive.prevCache = tabsCacheToRemovedWindows(prevTabsCache)

    setupListeners()

    if (Sidebar.reactive.panelsById.trash) Sidebar.reactive.panelsById.trash.ready = true
  }
}

function tabsCacheToRemovedWindows(cache: TabCache[][]): RemovedWindow[] {
  const result: RemovedWindow[] = []
  for (const tabsCache of cache) {
    const storedBase = { title: tabsCache[0].url, time: NOW, tabsCache }
    convertStoredWindowToState(storedBase)
    result.push(storedBase as RemovedWindow)
  }
  return result
}

/**
 * Mutate StoredRemovedTab to RemovedTab and returns it
 */
function convertStoredTabToState(storedTab: StoredRemovedTab): RemovedTab {
  const tab = storedTab as RemovedTab
  tab.type = RemovedItemType.Tab
  tab.id = Utils.uid()
  tab.sel = false
  tab.tooltip = tab.title + '\n' + tab.url
  tab.rmTimeStr = Utils.getTimeHHMM(tab.time)
  return tab
}

/**
 * Mutate StoredRemovedBookmark to RemovedBookmark and returns it
 */
function convertStoredBookmarkToState(storedBookmark: StoredRemovedBookmark): RemovedBookmark {
  const bookmark = storedBookmark as RemovedBookmark
  bookmark.type = RemovedItemType.Bookmark
  bookmark.id = Utils.uid()
  bookmark.sel = false
  bookmark.tooltip = bookmark.title + '\n' + (bookmark.url ?? '')
  bookmark.len = getBookmarkLen(bookmark)
  bookmark.rmTimeStr = Utils.getTimeHHMM(bookmark.time)
  return bookmark
}

function getBookmarkLen(bookmark: RemovedBookmark): number {
  if (!bookmark.subItems) return 0

  let count = 0
  const walker = (nodes: StoredRemovedBookmarkChild[]): void => {
    for (const node of nodes) {
      if (node.url) count++
      if (node.subItems) walker(node.subItems)
    }
  }
  walker(bookmark.subItems)

  return count
}

/**
 * Mutate StoredRemovedWindow to RemovedWindow and returns it
 */
function convertStoredWindowToState(storedWindow: StoredRemovedWindow): RemovedWindow {
  const window = storedWindow as RemovedWindow
  window.type = RemovedItemType.Window
  window.id = Utils.uid()
  window.sel = false
  window.tooltip = window.title
  window.len = window.tabsCache.length
  window.rmTimeStr = Utils.getTimeHHMM(window.time)

  // Append tab urls to tooltip
  const count = 5
  for (let i = 0; i < count; i++) {
    const tab = window.tabsCache[i]
    if (!tab) break
    if (window.tooltip) window.tooltip += '\n'
    const url = tab.url.length > 64 ? tab.url.slice(0, 64) + '...' : tab.url
    window.tooltip += `  - ${url}`
  }
  if (window.tabsCache.length > count) window.tooltip += '\n  ...'

  return window
}

export function unload(): void {
  resetListeners()
  Trash.reactive.tabs = []
  Trash.reactive.bookmarks = []
  Trash.reactive.windows = []
  if (Sidebar.reactive.panelsById.trash) Sidebar.reactive.panelsById.trash.ready = false
}

export function saveTabs(delay = SAVE_DELAY): void {
  if (!Info.isBg) return
  Store.set({ removedTabs: Trash.storedTabs }, delay)
}

export function saveBookmarks(delay = SAVE_DELAY): void {
  if (!Info.isBg) return
  Store.set({ removedBookmarks: Trash.storedBookmarks }, delay)
}

export function saveWindows(delay = SAVE_DELAY): void {
  if (!Info.isBg) return
  Store.set({ removedWindows: Trash.storedWindows }, delay)
}

export function putTab(tab: Tab): void {
  if (tab.incognito) return

  Logs.info(`Trash.putTab id: ${tab.id}`)

  if (Trash.storedTabs.length > TABS_LIMIT) {
    Trash.storedTabs = Trash.storedTabs.slice(TABS_LIMIT_STEP)
  }

  Trash.storedTabs.push({ url: decodeURI(tab.url), title: tab.title, time: Date.now() })
  saveTabs()
}

export function putBookmark(bookmark: Bookmark): void {
  Logs.info(`Trash.putBookmark id: ${bookmark.id}`)

  if (Trash.storedBookmarks.length > BOOKMARKS_LIMIT) {
    Trash.storedBookmarks = Trash.storedBookmarks.slice(BOOKMARKS_LIMIT_STEP)
  }

  const item: StoredRemovedBookmark = {
    title: bookmark.title,
    time: Date.now(),
    parentId: bookmark.parentId,
  }
  if (bookmark.url) item.url = decodeURI(bookmark.url)

  if (bookmark.type === 'folder' && bookmark.children?.length) {
    const walker = (nodes: Bookmark[], parent: StoredRemovedBookmarkChild) => {
      parent.subItems = []
      for (const n of nodes) {
        if (n.type === 'separator') continue
        const subItem: StoredRemovedBookmarkChild = { title: n.title }
        if (n.url) subItem.url = n.url

        parent.subItems.push(subItem)

        if (n.children) walker(n.children, subItem)
      }
    }
    walker(bookmark.children, item)
  }

  Trash.storedBookmarks.push(item)
  saveBookmarks()
}

export function putWindow(window: Window): void {
  if (window.incognito) return

  Logs.info('Trash.putWindow', window.title)

  const title = window.tabs?.find(t => t.active)?.title ?? ''
  let tabsCache = TabsBG.cacheByWin[window.id ?? NOID]
  if (!tabsCache || tabsCache.length !== window.tabs?.length) {
    if (!window.tabs) tabsCache = []
    else {
      tabsCache = window.tabs.map(t => {
        const data: TabCache = { id: t.id, url: t.url }
        if (t.cookieStoreId !== CONTAINER_ID) data.ctx = t.cookieStoreId
        return data
      })
    }
  }

  if (!tabsCache.length) return

  if (Trash.storedWindows.length > WINDOWS_LIMIT) {
    Trash.storedWindows = Trash.storedWindows.slice(WINDOWS_LIMIT_STEP)
  }

  const item: StoredRemovedWindow = { title, tabsCache, time: Date.now() }

  Trash.storedWindows.push(item)
  saveWindows()
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export function isRemovedTab(item?: RemovedItem): item is RemovedTab {
  if (!item) return false
  return item.type === RemovedItemType.Tab
}

export function isRemovedBookmark(item?: RemovedItem): item is RemovedBookmark {
  if (!item) return false
  return item.type === RemovedItemType.Bookmark
}

export function isRemovedWindow(item?: RemovedItem): item is RemovedWindow {
  if (!item) return false
  return item.type === RemovedItemType.Window
}

export function openTab(tab: RemovedTab): void {
  if (!tab.url) return

  const conf: browser.tabs.CreateProperties = {
    windowId: Windows.id,
    url: Utils.normalizeUrl(tab.url, tab.title),
    active: true,
  }

  const panelId = Sidebar.findTabsPanelForUrl(tab.url)
  const panel = Sidebar.reactive.panelsById[panelId ?? NOID]
  if (Utils.isTabsPanel(panel)) {
    conf.index = panel.nextTabIndex ?? TabsFG.list.length
    if (panel.newTabCtx !== 'none') conf.cookieStoreId = panel.newTabCtx

    TabsFG.setNewTabPosition(conf.index, -1, panel.id)
  }

  browser.tabs.create(conf)
}

function* subItemsWalk(
  nodes: StoredRemovedBookmarkChild[],
  parentId: ID,
  fromIndex = 0
): IterableIterator<ItemInfo> {
  for (let i = fromIndex; i < nodes.length; i++) {
    let subIndex = 0
    const node = nodes[i]
    const sub = node.subItems?.[0]
    if (sub && sub.url && node.title === sub.title) {
      node.url = sub.url
      subIndex = 1
    }
    const item = { id: Utils.uid() as ID, url: node.url, title: node.title, parentId }
    yield item
    if (node.subItems) yield* subItemsWalk(node.subItems, item.id, subIndex)
  }
}

export async function openTabsFromBookmark(node: RemovedBookmark): Promise<void> {
  const items = Array.from(subItemsWalk([node], NOID))
  await TabsFG.open(items, { panelId: Sidebar.lastTabsPanelId })
}

async function checkBookmarkExistance(id: ID): Promise<boolean> {
  if (!id) return false
  if (id === BKM_OTHER_ID) return true
  if (id === BKM_MENU_ID) return true
  if (id === BKM_TLBR_ID) return true
  if (id === BKM_MOBILE_ID) return true
  try {
    const nodes = await browser.bookmarks.get(id)
    return !!nodes[0]
  } catch (err) {
    return false
  }
}

export async function createBookmark(item: RemovedBookmark): Promise<void> {
  let parentId: ID | null = null

  if (item.parentId && (await checkBookmarkExistance(item.parentId))) parentId = item.parentId
  else parentId = BKM_OTHER_ID

  const result = await Bookmarks.openBookmarksPopup({
    title: translate('popup.bookmarks.create_bookmarks'),
    location: BKM_OTHER_ID,
    locationField: true,
    locationTree: true,
    controls: [{ label: 'btn.create' }],
  })
  if (!result) return

  parentId = result.location ?? BKM_OTHER_ID

  // Create bookmark
  if (item.url) {
    await browser.bookmarks.create({
      parentId,
      type: 'bookmark',
      title: item.title,
      url: item.url,
    })
  }

  // Create folder
  else if (item.subItems && item.id) {
    const createQueue: ItemInfo[] = [{ id: item.id, title: item.title }]
    const walk = (items: StoredRemovedBookmarkChild[], parentId: ID) => {
      for (const info of items) {
        const item: ItemInfo = { id: Utils.uid(), title: info.title, parentId }
        if (info.url) item.url = info.url
        createQueue.push(item)
        if (info.subItems && info.subItems.length) walk(info.subItems, item.id)
      }
    }
    walk(item.subItems, item.id)
    Bookmarks.createFrom(createQueue, { index: 0, parentId })
  }
}

export function openWindow(item: RemovedWindow): void {
  if (!item.tabsCache.length) return

  // Create tabs info
  const info: ItemInfo[] = []
  for (const cacheItem of item.tabsCache) {
    info.push({
      id: cacheItem.id,
      url: cacheItem.url,
      title: cacheItem.url,
      pinned: !!cacheItem.pin,
      parentId: cacheItem.parentId ?? NOID,
      panelId: cacheItem.panelId ?? NOID,
      container: cacheItem.ctx ?? CONTAINER_ID,
    })
  }

  TabsFG.open(info, { windowId: NEWID })
}

type StoredRemovedItem = StoredRemovedTab | StoredRemovedBookmark | StoredRemovedWindow
function findRmItemIndex(list: RemovedItem[], target: StoredRemovedItem, from = 0): number {
  if (from < 0) from = 0

  for (let i = from; i < list.length; i++) {
    const item = list[i]
    if (!item) continue
    if (item.time === target.time && item.title === target.title) return i
  }

  return -1
}

function updateTabs(removedTabs?: StoredRemovedTab[]): void {
  if (!removedTabs) return

  let index = 0
  const tabs: RemovedTab[] = []
  for (let i = removedTabs.length; i--; ) {
    const tab = removedTabs[i]
    index = findRmItemIndex(Trash.reactive.tabs, tab, index)

    if (index !== -1) tabs.push(Trash.reactive.tabs[index])
    else tabs.push(convertStoredTabToState(tab))
  }

  Trash.reactive.tabs = tabs
}

function updateBookmarks(removedBookmarks?: StoredRemovedBookmark[]): void {
  if (!removedBookmarks) return

  let index = 0
  const bookmarks: RemovedBookmark[] = []
  for (let i = removedBookmarks.length; i--; ) {
    const bookmark = removedBookmarks[i]
    index = findRmItemIndex(Trash.reactive.bookmarks, bookmark, index)

    if (index !== -1) bookmarks.push(Trash.reactive.bookmarks[index])
    else bookmarks.push(convertStoredBookmarkToState(bookmark))
  }

  Trash.reactive.bookmarks = bookmarks
}

function updateWindows(removedWindows?: StoredRemovedWindow[]): void {
  if (!removedWindows) return

  let index = 0
  const windows: RemovedWindow[] = []
  for (let i = removedWindows.length; i--; ) {
    const window = removedWindows[i]
    index = findRmItemIndex(Trash.reactive.windows, window, index)

    if (index !== -1) windows.push(Trash.reactive.windows[index])
    else windows.push(convertStoredWindowToState(window))
  }

  Trash.reactive.windows = windows
}

function updatePrevCache(cache?: TabCache[][]): void {
  Trash.reactive.prevCache = tabsCacheToRemovedWindows(cache ?? [])
}

export function setupListeners(): void {
  Store.onKeyChange('removedTabs', updateTabs)
  Store.onKeyChange('removedBookmarks', updateBookmarks)
  Store.onKeyChange('removedWindows', updateWindows)
  Store.onKeyChange('prevTabsDataCache', updatePrevCache)
}

export function resetListeners(): void {
  Store.offKeyChange('removedTabs', updateTabs)
  Store.offKeyChange('removedBookmarks', updateBookmarks)
  Store.offKeyChange('removedWindows', updateWindows)
  Store.offKeyChange('prevTabsDataCache', updatePrevCache)
}

export function removeItem(item?: RemovedItem): void {
  if (!item) return

  if (Info.isSidebar) {
    return Msg.call(InstanceType.bg, 'removeTrashItem', Utils.cloneObject(item))
  }

  if (Info.isBg) {
    const predicate = (t: StoredRemovedItem) => item.time === t.time && item.title === t.title

    if (Trash.isRemovedTab(item)) {
      const index = Trash.storedTabs.findIndex(predicate)
      if (index) Trash.storedTabs.splice(index, 1)
      Trash.saveTabs(0)
    }

    if (Trash.isRemovedBookmark(item)) {
      const index = Trash.storedBookmarks.findIndex(predicate)
      if (index) Trash.storedBookmarks.splice(index, 1)
      Trash.saveBookmarks(0)
    }

    if (Trash.isRemovedWindow(item)) {
      const index = Trash.storedWindows.findIndex(predicate)
      if (index) Trash.storedWindows.splice(index, 1)
      Trash.saveWindows(0)
    }
  }
}

export function scrollToTrashItem(id: ID): void {
  if (!Info.isSidebar) return

  const elId = 'trash' + id.toString()
  const el = document.getElementById(elId)

  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}
