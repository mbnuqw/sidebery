import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import * as T from 'src/types'
import * as D from 'src/defaults'
import * as E from 'src/enums'
import * as Logs from 'src/services/logs'
import * as Popups from 'src/services/popups.fg'
import * as Settings from 'src/services/settings.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Windows from 'src/services/windows.fg'
import * as Selection from 'src/services/selection.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Store from 'src/services/storage.fg'
import * as Notifications from 'src/services/notifications.fg'
import * as IPC from 'src/services/ipc'
import * as Permissions from 'src/services/permissions.fg'
import * as Containers from 'src/services/containers'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Search from 'src/services/search.fg'
import * as Links from 'src/services/links'

import * as Bookmarks from './bookmarks.fg'

export interface BookmarksReactiveState {
  root: ID[]
  popup: BookmarksPopupState | null
  expanded: T.ExpandedBookmarks
}

export interface BookmarksPopupControlConfig {
  label: string
  inactive?: boolean
}

export interface BookmarksPopupConfig {
  title: string
  name?: string
  nameField?: boolean
  url?: string
  urlField?: boolean
  locationField?: boolean
  locationTree?: boolean
  location?: ID
  recentLocations?: boolean
  recentLocationAsDefault?: boolean
  newFolderPosition?: [parentId: ID, index: number]
  target?: BkmNode
  controls?: BookmarksPopupControlConfig[]
  validate?: (popupState: BookmarksPopupState) => void
}

export interface BookmarksPopupState extends BookmarksPopupConfig {
  name: string
  nameValid: boolean
  url: string
  urlValid: boolean
  close: (result?: BookmarksPopupResult) => void
}

export interface BookmarksPopupResult {
  name?: string
  url?: string
  location?: ID
  controlIndex: number
}

export type { BkmNode }

class BkmNode {
  id: ID
  type: E.BkmType
  index: number
  parentId: ID
  children?: BkmNode[]
  dateAdded?: number
  dateModified?: number
  unmodifiable?: 'managed'

  title: string
  url?: string

  len: number
  sel: boolean
  selLock: boolean
  hasOpenTabs: boolean

  // Parsed from title
  parsedTitle?: string
  customColor?: string
  containerColor?: string

  reactive: T.ReactiveBkmProps

  constructor(nativeBkm: T.NativeBkmNode) {
    this.id = nativeBkm.id ?? D.NOID
    if (nativeBkm.type === 'bookmark') this.type = E.BkmType.Bookmark
    else if (nativeBkm.type === 'folder') this.type = E.BkmType.Folder
    else this.type = E.BkmType.Separator
    this.index = nativeBkm.index ?? -1
    this.parentId = nativeBkm.parentId ?? D.NOID
    this.dateAdded = nativeBkm.dateAdded
    this.dateModified = nativeBkm.dateGroupModified
    this.unmodifiable = nativeBkm.unmodifiable
    this.len = 0

    this.title = nativeBkm.title
    if (this.type === E.BkmType.Bookmark) {
      this.len = 1
      this.url = nativeBkm.url
    }

    this.sel = false
    this.selLock = false
    this.hasOpenTabs = false

    const link = this.url ? Links.addBkm(this) : undefined

    if (Settings.state.highlightOpenBookmarks && link) {
      this.hasOpenTabs = !!link.tabs.size
    } else {
      this.hasOpenTabs = false
    }

    if (this.type === E.BkmType.Folder) {
      this.children = nativeBkm.children?.map(nbn => new BkmNode(nbn)) ?? []

      for (const childNode of this.children) {
        if (childNode.type === E.BkmType.Bookmark) this.len++
        else if (childNode.type === E.BkmType.Folder) this.len += childNode.len

        if (!this.hasOpenTabs && childNode.hasOpenTabs) this.hasOpenTabs = true
      }
    }

    this.reactive = {
      title: this.title,
      url: this.url,
      len: this.len,
      sel: this.sel,
      selLock: this.selLock,
      hasOpenTabs: this.hasOpenTabs,
      children: this.children?.map(n => n.id),
    }

    this.#parseTitle()

    if (reactFn) this.reactive = reactFn(this.reactive)

    byId.set(this.id, this)
  }

  #parseTitle() {
    let parsedTitle = this.title

    const pinIndex = parsedTitle.indexOf(' ' + D.PIN_MARK)
    if (pinIndex !== -1) {
      parsedTitle =
        parsedTitle.slice(0, pinIndex) + parsedTitle.slice(pinIndex + 1 + D.PIN_MARK.length)
    }

    delete this.containerColor
    delete this.reactive.containerColor
    parsedTitle = parsedTitle.replace(D.CONTAINER_IN_BOOKMARK_RE, (match, cpid) => {
      if (typeof cpid !== 'string') return match
      const info = Containers.parseCPID(cpid)
      const container = Containers.findUnique(info)
      if (!container) return match
      this.reactive.containerColor = this.containerColor = container.color
      return ''
    })

    delete this.customColor
    delete this.reactive.customColor
    parsedTitle = parsedTitle.replace(D.COLOR_IN_BOOKMARK_RE, (match, colorId) => {
      const color = D.BOOKMARK_TAB_COLOR[colorId as string]
      if (!color) return match
      this.reactive.customColor = this.customColor = color
      return ''
    })

    parsedTitle = parsedTitle.replace(D.TITLE_IN_BOOKMARK_RE, '')

    this.reactive.title = this.parsedTitle = parsedTitle
  }

  forEachAncestor(cb: (n: BkmNode, i: number) => void) {
    let parent = Bookmarks.byId.get(this.parentId)
    let i = 0
    while (parent) {
      cb(parent, i++)
      parent = Bookmarks.byId.get(parent.parentId)
    }
  }

  *descendants(): IterableIterator<BkmNode> {
    if (!this.children) return

    for (const n of this.children) {
      yield n
      if (n.children) yield* n.descendants()
    }
  }

  setTitle(t: string) {
    this.title = t
    this.#parseTitle()
  }

  setUrl(u: string) {
    if (this.url === undefined) return

    const link = Links.updBkm(this, u)

    this.url = u
    this.recalcOpenTabs(link)
  }

  recalcOpenTabs(link?: Links.Link) {
    const hadOpenTabs = this.hasOpenTabs

    if (!link) link = Links.byBkm.get(this)

    if (Settings.state.highlightOpenBookmarks && link) {
      this.hasOpenTabs = !!link.tabs.size
    } else {
      this.hasOpenTabs = false
    }

    if (hadOpenTabs !== this.hasOpenTabs) {
      ancestorsUpdBuffer.add(this)
      this.reactive.hasOpenTabs = this.hasOpenTabs
    }
  }

  addBkm(bkm: BkmNode, index?: number) {
    if (!this.children) return

    if (index === undefined || index < 0 || index > this.children.length) {
      index = this.children.length
    }

    bkm.parentId = this.id
    bkm.index = index

    this.children.splice(index, 0, bkm)
    this.reactive.children?.splice(index, 0, bkm.id)

    const chLen = this.children.length
    for (let i = index + 1; i < chLen; i++) {
      this.children[i].index = i
    }
  }

  rmChildByIndex(index: number): BkmNode | undefined {
    if (!this.children) {
      Logs.warn('BkmNode.rmChildByIndex: childfree:', this.id)
      return
    }
    if (index < 0 || index > this.children.length) {
      Logs.warn('BkmNode.rmChildByIndex: incorrect index:', index)
      return
    }
    const removed = this.children.splice(index, 1)[0]
    const chLen = this.children.length
    for (let i = index; i < chLen; i++) {
      this.children[i].index = i
    }
    this.reactive.children?.splice(index, 1)
    return removed
  }

  /**
   * Update len and hasOpenTabs
   */
  updFolderInfo() {
    if (!this.children) {
      Logs.warn('BkmNode.updFolderInfo: childfree:', this.id)
      return
    }
    const prevLen = this.len
    const prevHasOpenTabs = !!this.hasOpenTabs
    this.len = 0
    this.hasOpenTabs = false
    for (const childNode of this.children) {
      // Calc len
      this.len += childNode.len
      // Set hasOpenTabs
      if (!this.hasOpenTabs && childNode.hasOpenTabs) this.hasOpenTabs = true
    }
    if (prevLen !== this.len) this.reactive.len = this.len
    if (prevHasOpenTabs !== !!this.hasOpenTabs) this.reactive.hasOpenTabs = !!this.hasOpenTabs
  }

  getChildrenIds() {
    if (!this.children) return
    return this.children.map(n => n.id)
  }
}

class ancestorsUpdBuffer {
  static #delay = 100
  static #timeout: number | undefined
  static #byTreeLvl: Partial<Set<BkmNode>[]> = []

  static add(node: BkmNode) {
    const path: BkmNode[] = []
    node.forEachAncestor(n => path.push(n))

    for (let lvl = 0, i = path.length; i--; lvl++) {
      let foldersOfLvl = this.#byTreeLvl[lvl]
      if (!foldersOfLvl) this.#byTreeLvl[lvl] = foldersOfLvl = new Set()
      foldersOfLvl.add(path[i])
    }

    clearTimeout(this.#timeout)
    this.#timeout = setTimeout(() => {
      for (let i = this.#byTreeLvl.length; i--; ) {
        const foldersOfLvl = this.#byTreeLvl[i]
        if (!foldersOfLvl || !foldersOfLvl.size) continue

        for (const f of foldersOfLvl) {
          f.updFolderInfo()
        }

        foldersOfLvl.clear()
      }
      overallCount = tree.reduce((a, v) => a + v.len, 0)
      Sidebar.recalcBookmarksPanels()
    }, this.#delay)
  }
}

export const typeName = {
  [E.BkmType.Bookmark]: 'bookmark',
  [E.BkmType.Folder]: 'folder',
  [E.BkmType.Separator]: 'separator',
} as const

export const byId = new Map<ID, BkmNode>()
export let tree: BkmNode[] = []
export let overallCount = 0
export let reactive: BookmarksReactiveState = {
  root: [],
  popup: null,
  expanded: {},
}

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function reactivate(r: T.Reactivator<any>) {
  reactive = r(reactive)
  reactFn = r
}

let loading = false
let onLoaded: (() => void)[] = []
function finishLoading() {
  loading = false
  onLoaded.forEach(fn => fn())
  onLoaded = []
}

export async function load(): Promise<void> {
  if (!browser.bookmarks) return

  // Check if the process is already started
  if (loading) return new Promise(ok => onLoaded.push(ok))

  loading = true

  let nativeBookmarks
  try {
    nativeBookmarks = await browser.bookmarks.getTree()
  } catch {
    finishLoading()
    return
  }
  if (!nativeBookmarks[0].children) {
    finishLoading()
    return
  }

  byId.clear()

  tree = nativeBookmarks[0].children.map(nb => new BkmNode(nb))
  overallCount = tree.reduce((a, v) => a + v.len, 0)
  Bookmarks.reactive.root = tree.map(n => n.id)

  Sidebar.recalcBookmarksPanels()

  Bookmarks.setupBookmarksListeners()

  if (!Windows.incognito) await restoreTree()

  for (const panel of Sidebar.panels) {
    if (Utils.isBookmarksPanel(panel)) panel.reactive.ready = panel.ready = true
  }

  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (DnD.reactive.isStarted && Utils.isBookmarksPanel(activePanel)) {
    Sidebar.updateBounds()
  }

  finishLoading()
}

export function getIds(nodes: BkmNode[]) {
  if (!nodes) nodes = tree
  return nodes.map(n => n.id)
}

export function get(ids: ID[]) {
  const bookmarks = []
  for (const id of ids) {
    const b = byId.get(id)
    if (b) bookmarks.push(b)
  }
  return bookmarks
}

export async function restoreTree(): Promise<void> {
  const stored = await browser.storage.local.get<T.Stored>('expandedBookmarkFolders')
  const expandedBookmarkFolders = stored.expandedBookmarkFolders

  if (expandedBookmarkFolders) {
    for (const panelId of Object.keys(expandedBookmarkFolders)) {
      if (!Sidebar.panelsById[panelId]) delete expandedBookmarkFolders[panelId]
    }
  }

  Bookmarks.reactive.expanded = expandedBookmarkFolders ?? {}
}

export function unload(): void {
  Bookmarks.resetBookmarksListeners()

  tree = []
  byId.clear()
  Links.rmAllBkms()

  reactive.root = []
  reactive.popup = null
  reactive.expanded = {}

  for (const panel of Sidebar.panels) {
    if (Utils.isBookmarksPanel(panel)) {
      panel.ready = false
      panel.reactive.ready = false
      panel.reactive.len = 0
    }
  }
}

let saveBookmarksTreeTimeout: number | undefined
/**
 * Save tree state
 */
export function saveBookmarksTree(delay = 128): void {
  if (!Windows.focused) return
  if (Bookmarks.reactive.popup) return
  if (Search.active) return

  clearTimeout(saveBookmarksTreeTimeout)
  saveBookmarksTreeTimeout = setTimeout(() => {
    const expandedBookmarkFolders = Utils.cloneObject(Bookmarks.reactive.expanded)
    Store.set({ expandedBookmarkFolders }, 500)
  }, delay)
}

/**
 * Expand bookmark folder
 */
export function expandBookmark(
  nodeId: ID,
  panelId: ID,
  noRecursive?: boolean,
  noAutoClose?: boolean
): void {
  const node = Bookmarks.byId.get(nodeId)
  if (!node) return

  const isEmpty = !node.children?.length
  if (Settings.state.autoCloseBookmarks && !noAutoClose && !isEmpty && !Selection.isBookmarks()) {
    Bookmarks.reactive.expanded[panelId] = {}
  }

  if (!Bookmarks.reactive.expanded[panelId]) Bookmarks.reactive.expanded[panelId] = {}
  const expandedInPanel = Bookmarks.reactive.expanded[panelId]

  if (noRecursive) {
    expandedInPanel[nodeId] = true
  } else {
    const expandPath: ID[] = [nodeId]
    let parent = Bookmarks.byId.get(node.parentId)
    while (parent) {
      expandPath.push(parent.id)
      parent = Bookmarks.byId.get(parent.parentId)
    }

    for (const id of expandPath) {
      expandedInPanel[id] = true
    }
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
  const node = Bookmarks.byId.get(nodeId)
  if (!node) return

  const isExpanded = Bookmarks.reactive.expanded[panelId]?.[nodeId]
  if (isExpanded) foldBookmark(nodeId, panelId)
  else expandBookmark(nodeId, panelId)
}

export function openInNewWindow(ids: ID[], incognito?: boolean): void {
  const toOpen: BkmNode[] = []

  // Get ordered list of nodes
  const walker = (nodes: BkmNode[]) => {
    for (const node of nodes) {
      if (node.type === E.BkmType.Separator) continue
      if (ids.includes(node.parentId)) {
        toOpen.push(node)
        ids.push(node.id)
      } else if (ids.includes(node.id)) {
        toOpen.push(node)
      }
      if (node.children) walker(node.children)
    }
  }
  walker(Bookmarks.tree)

  // Create items info
  const itemsInfo: T.ItemInfo[] = []
  for (const bookmark of toOpen) {
    const info: T.ItemInfo = { id: bookmark.id, title: bookmark.title }

    if (itemsInfo.find(i => i.id === bookmark.parentId)) info.parentId = bookmark.parentId

    if (bookmark.type === E.BkmType.Bookmark) info.url = bookmark.url
    if (bookmark.type === E.BkmType.Folder && Settings.state.tabsTree) {
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
  dst: T.DstPlaceInfo
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
    const panelId = Sidebar.getRecentTabsPanelId()
    const panel = Sidebar.panelsById[panelId]
    conf.useActiveTab = Settings.state.bookmarksLeftClickAction === 'open_in_act'
    conf.activateFirstTab = Settings.state.bookmarksLeftClickActivate
    conf.dst.panelId = panelId
    if (!conf.useActiveTab && Settings.state.bookmarksLeftClickPos === 'after') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === panelId) {
        conf.dst.index = activeTab.index + 1
        conf.dst.parentId = activeTab.parentId
      }
    } else if (Utils.isTabsPanel(panel)) {
      conf.dst.index = Tabs.getIndexForNewTab(panel)
      conf.dst.parentId = Tabs.getParentForNewTab(panel, { index: conf.dst.index })
    }
  }

  // Middle click
  else if (button === 1) {
    const panelId = Sidebar.getRecentTabsPanelId()
    const panel = Sidebar.panelsById[panelId]
    conf.activateFirstTab = Settings.state.bookmarksMidClickActivate
    conf.removeBookmark = Settings.state.bookmarksMidClickRemove
    conf.dst.panelId = panelId
    if (Settings.state.bookmarksMidClickPos === 'after') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === panelId) {
        conf.dst.index = activeTab.index + 1
        conf.dst.parentId = activeTab.parentId
      }
    } else if (Utils.isTabsPanel(panel)) {
      conf.dst.index = Tabs.getIndexForNewTab(panel)
      conf.dst.parentId = Tabs.getParentForNewTab(panel, { index: conf.dst.index })
    }
  }

  return conf
}

export async function open(
  ids: ID[],
  dst: T.DstPlaceInfo,
  useActiveTab?: boolean,
  activateFirstTab?: boolean
): Promise<void> {
  const firstBookmark = Bookmarks.byId.get(ids[0])
  if (ids.length === 1 && firstBookmark?.type === E.BkmType.Separator) return

  const dstContainerId = dst.containerId ?? D.CONTAINER_ID
  let dstPanel: T.Panel | undefined

  // Use defined panel
  if (dst.panelId !== undefined) dstPanel = Sidebar.panelsById[dst.panelId]

  // Or check move rules by container to get the dst panel
  if (!Utils.isTabsPanel(dstPanel)) {
    let dstCtxTabsPanel: T.TabsPanel | undefined
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

  // Or use the last active tabs panel
  if (!Utils.isTabsPanel(dstPanel)) {
    dstPanel = Sidebar.panelsById[Sidebar.getRecentTabsPanelId()]
  }

  if (Utils.isTabsPanel(dstPanel)) {
    if (dstPanel.newTabCtx && dstPanel.newTabCtx !== 'none' && !dst.containerId) {
      dst.containerId = dstPanel.newTabCtx
    }
    if (dst.index === undefined) {
      dst.index = dstPanel.nextTabIndex ?? Tabs.list.length
    }
    dst.panelId = dstPanel.id
  }

  const toOpen: T.ItemInfo[] = []
  const toRemove: ID[] = []
  const walker = (nodes: BkmNode[]) => {
    for (const node of nodes) {
      if (node.type === E.BkmType.Separator) continue

      const isDirectTarget = ids.includes(node.id)
      const isIndirectTarget = ids.includes(node.parentId)

      if (isDirectTarget || isIndirectTarget) {
        const info: T.ItemInfo = { id: node.id, title: node.title }
        if (node.url) info.url = node.url
        if (isIndirectTarget) info.parentId = node.parentId
        Bookmarks.extractTabInfoFromTitle(info)

        // Set url for parent node
        const prev = toOpen[toOpen.length - 1]
        if (prev && prev.id === info.parentId && bookmarkIsParentTab(node, prev.title)) {
          prev.url = info.url
          continue
        }

        if (isIndirectTarget && node.type === E.BkmType.Folder) ids.push(node.id)

        if (
          Settings.state.autoRemoveOther &&
          node.parentId === D.BKM_OTHER_ID &&
          node.type === E.BkmType.Bookmark
        ) {
          toRemove.push(info.id)
        }

        toOpen.push(info)
      }

      if (node.children) walker(node.children)
    }
  }

  if (ids.length === 1 && firstBookmark?.type === E.BkmType.Bookmark) {
    const info: T.ItemInfo = {
      id: firstBookmark.id,
      url: firstBookmark.url,
      title: firstBookmark.title,
    }
    Bookmarks.extractTabInfoFromTitle(info)

    if (useActiveTab) {
      // TODO: undo
      browser.tabs.update({ url: Utils.sanitizeUrl(info.url, info.title) })
      const activeTab = Tabs.byId[Tabs.activeId]
      if (info.customColor) Tabs.setCustomColor([Tabs.activeId], info.customColor)
      else if (activeTab && activeTab.customColor) Tabs.setCustomColor([Tabs.activeId], 'toolbar')
      if (Settings.state.autoRemoveOther && firstBookmark.parentId === D.BKM_OTHER_ID) {
        Bookmarks.removeBookmarks([firstBookmark.id])
      }
      return
    }

    if (Settings.state.autoRemoveOther && firstBookmark.parentId === D.BKM_OTHER_ID) {
      toRemove.push(firstBookmark.id)
    }

    toOpen.push(info)
  } else {
    walker(Bookmarks.tree)
  }

  if (!toOpen.length) return

  if (activateFirstTab) toOpen[0].active = true

  await Tabs.open(toOpen, dst)

  if (toRemove.length) {
    Bookmarks.removeBookmarks(toRemove)
  }
}

export async function createBookmarkNode(
  type: browser.bookmarks.TreeNodeType,
  target: BkmNode
): Promise<void> {
  const expandedBookmarks = Bookmarks.reactive.expanded[Sidebar.activePanelId]
  let parentId: ID | undefined
  let index = 0

  // Create bookmark node inside the target folder only if it's open
  if (target.type === E.BkmType.Folder && (!expandedBookmarks || expandedBookmarks[target.id])) {
    parentId = target.id
    if (type === 'folder') {
      // New folder - after the last one or at the start of the list
      const lastFolderIndex = (target.children ?? []).findLastIndex(
        n => n.type === E.BkmType.Folder
      )
      if (lastFolderIndex !== -1) index = lastFolderIndex + 1
      else index = 0
    } else {
      // Other types - append to the end
      index = target.children?.length ?? 0
    }
  }
  // Otherwise, create bookmark node after the target
  else {
    parentId = target.parentId
    index = target.index + 1
  }

  if (!parentId) parentId = D.BKM_OTHER_ID

  if (type === 'separator') {
    await browser.bookmarks.create({ parentId, type: 'separator', index })
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
        popupState.nameValid = true
        popupState.urlValid = !!popupState.url
      },
    })

    if (result) {
      if (parentId !== result.location) index = 0

      parentId = result.location ?? D.BKM_OTHER_ID
      if (parentId === D.NOID) parentId = D.BKM_OTHER_ID

      try {
        await browser.bookmarks.create({
          parentId,
          title: result.name,
          type,
          url: result.url,
          index,
        })
      } catch (err) {
        Logs.err('Bookmarks.createBookmarkNode: Cannot create bookmark', err)
        Notifications.err(translate('notif.bookmarks_create_err'))
      }
    }
  }
}

export async function editBookmarkNode(target: BkmNode): Promise<void> {
  if (target.type === E.BkmType.Separator) return

  const isBookmark = target.type === E.BkmType.Bookmark
  const result = await openBookmarksPopup({
    target,
    title: translate(isBookmark ? 'popup.bookmarks.edit_bookmark' : 'popup.bookmarks.edit_folder'),
    nameField: true,
    urlField: isBookmark,
    controls: [{ label: 'btn.save' }],
    validate: popupState => {
      popupState.nameValid = true
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

interface RemovingBookmarksConf {
  noNotif?: boolean
  noWarn?: boolean
}

/**
 * Remove bookmarks
 */
export async function removeBookmarks(ids: ID[], conf?: RemovingBookmarksConf): Promise<void> {
  if (!conf) conf = {}

  let count = 0
  let hasCollapsed = false

  const expandedBookmarks = Bookmarks.reactive.expanded[Sidebar.activePanelId]
  const deleted: BkmNode[] = []
  const idsToRemove = []

  const walker = (nodes: BkmNode[]) => {
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
    const n = Bookmarks.byId.get(id)
    if (!n) continue
    if (ids.includes(n.parentId)) continue
    count++
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
  if (warn && !conf.noWarn && count > 1) {
    const ok = await Popups.confirm(translate('confirm.bookmarks_delete'))
    if (!ok) return
  }

  for (const id of idsToRemove) {
    await browser.bookmarks.removeTree(id)
  }

  if (count > 0 && Settings.state.bookmarksRmUndoNote && !warn && !conf.noNotif) {
    Notifications.notify({
      icon: '#icon_trash',
      title: String(count) + translate('notif.bookmarks_rm_post', count),
      ctrl: translate('notif.undo_ctrl'),
      callback: () => undoRemove(deleted),
    })
  }
}

async function undoRemove(deleted: BkmNode[]): Promise<void> {
  const oldNewIds: Record<ID, ID> = {}
  let offset = 0
  let prevParent
  for (const n of deleted) {
    if (prevParent !== n.parentId) offset = 0
    const conf: browser.bookmarks.CreateDetails = {
      type: typeName[n.type],
      index: n.index + offset,
    }
    if (Bookmarks.byId.has(n.parentId)) conf.parentId = n.parentId
    if (oldNewIds[n.parentId]) conf.parentId = oldNewIds[n.parentId]
    if (n.type !== E.BkmType.Separator) conf.title = n.title
    if (n.type === E.BkmType.Bookmark) conf.url = n.url
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
  type: T.BookmarksSortType,
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

  const expandedBookmarks = Bookmarks.reactive.expanded[Sidebar.activePanelId]

  // Separate nodes by groups (bookmarks with the same parentId)
  const groups: Record<string, BkmNode[]> = {}
  let count = 0
  const walker = (nodes: BkmNode[]) => {
    for (const node of nodes) {
      if (node.type === E.BkmType.Separator) continue
      if (type !== 'link' || node.url) {
        if (!groups[node.parentId]) groups[node.parentId] = []
        groups[node.parentId].push(node)
        count++
      }
      if (node.children && expandedBookmarks?.[node.id]) walker(node.children)
    }
  }
  for (const nodeId of nodeIds) {
    const node = Bookmarks.byId.get(nodeId)
    if (!node) continue
    if (node.type === E.BkmType.Separator) continue
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
        if (aa.type === E.BkmType.Folder) return -1
        if (aa.type === E.BkmType.Bookmark) return 1
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

export function recalcOpenTabs() {
  for (const [_, link] of Links.byUrl) {
    if (link.bkms.size) link.bkms.forEach(b => b.recalcOpenTabs(link))
  }
}

export async function createFromDragEvent(e: DragEvent, dst: T.DstPlaceInfo): Promise<void> {
  if (!dst.parentId || !Bookmarks.byId.has(dst.parentId)) return

  // Handle sidebery dnd info from another firefox profile
  const dndInfo = e.dataTransfer?.getData('application/x-sidebery-dnd')
  if (dndInfo) {
    let info: T.DragInfo
    try {
      info = JSON.parse(dndInfo) as T.DragInfo
    } catch (err) {
      return
    }

    if (info?.items) {
      const groupUrlStartRe = /^moz-extension:\/\/.{36}\/(page.)?group\/group\.html(.+)$/
      for (const item of info.items) {
        // Remove containers info b/c it's a different profile, hence containerId
        // refers to a different container.
        // TODO: tell user about this
        delete item.container

        // Update sidebery internal urls
        if (item.url && groupUrlStartRe.test(item.url)) {
          item.url = item.url.replace(groupUrlStartRe, (_, _1, $2: string) => D.GROUP_URL + $2)
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

export async function move(ids: ID[], dst: T.DstPlaceInfo): Promise<void> {
  if (!dst.parentId) {
    const firstNode = Bookmarks.byId.get(ids[0])
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
  if (dstIndex === undefined || dstIndex < 0) {
    const parent = Bookmarks.byId.get(dst.parentId)
    dstIndex = parent?.children?.length ?? 0
  }

  for (const id of ids) {
    const bookmark = Bookmarks.byId.get(id)
    if (!bookmark) continue
    if (ids.includes(bookmark.parentId)) continue
    if (bookmark.parentId === dst.parentId && bookmark.index < dstIndex) dstIndex--
    await browser.bookmarks.move(id, { parentId: dst.parentId, index: dstIndex++ })
  }
}

export function attachTabInfoToTitle(item: T.ItemInfo) {
  if (item.pinned) item.title += ' ' + D.PIN_MARK
  if (item.container && item.container !== D.CONTAINER_ID) {
    const container = Containers.reactive.byId[item.container]
    if (container) item.title += ` [${Containers.getCPID(container)}]`
  }
  if (item.customColor) {
    item.title += ` [${D.TAB_BOOKMARK_COLOR[item.customColor]}]`
  }
  if (item.customTitle) {
    item.title += ' [*]'
  }
}

export function extractTabInfoFromTitle(item: T.ItemInfo, updateTitleOnly?: boolean) {
  if (!item.title) return

  const pinIndex = item.title.indexOf(' ' + D.PIN_MARK)
  if (pinIndex !== -1) {
    item.title = item.title.slice(0, pinIndex) + item.title.slice(pinIndex + 1 + D.PIN_MARK.length)
    if (!updateTitleOnly) item.pinned = true
  }

  item.title = item.title.replace(D.CONTAINER_IN_BOOKMARK_RE, (match, cpid) => {
    if (typeof cpid !== 'string') return match
    const info = Containers.parseCPID(cpid)
    const container = Containers.findUnique(info)
    if (!container) return match
    if (!updateTitleOnly) item.container = container.id
    return ''
  })

  item.title = item.title.replace(D.COLOR_IN_BOOKMARK_RE, (match, colorId) => {
    const color = D.BOOKMARK_TAB_COLOR[colorId as string]
    if (!color) return match
    if (!updateTitleOnly) item.customColor = color
    return ''
  })

  let isCustomTitle = false
  item.title = item.title.replace(D.TITLE_IN_BOOKMARK_RE, () => {
    isCustomTitle = true
    return ''
  })
  if (isCustomTitle && !updateTitleOnly) item.customTitle = item.title
}

/**
 * Creates bookmarks in destination folder
 */
export async function createFrom(
  items: T.ItemInfo[],
  dst: T.DstPlaceInfo,
  progress?: T.Notification
): Promise<void> {
  if (!dst.parentId) return Logs.warn('Bookmarks: Cannot create bookmarks: No parentId')
  let dstIndex = dst.index
  let n = 0

  if (dstIndex === undefined || dstIndex < 0) {
    const parent = Bookmarks.byId.get(dst.parentId)
    dstIndex = parent?.children?.length ?? 0
  }

  if (Settings.state.tabsTreeBookmarks) {
    const idsMap: Partial<Record<ID, ID>> = {}

    for (const item of items) {
      const parent = items.find(t => t.id === item.parentId)
      const children = items.filter(t => t.parentId === item.id)
      const parentId = idsMap[item.parentId ?? D.NOID] ?? dst.parentId
      const index = !parent ? dstIndex++ : undefined

      attachTabInfoToTitle(item)

      // Create folder
      if (children.length) {
        const folderConf = { title: item.title, parentId, index }
        const folder = await browser.bookmarks.create(folderConf)
        idsMap[item.id] = folder.id

        if (progress) Notifications.updateProgress(progress, n++, items.length)

        // Create bookmark of parent item
        if (item.url && !D.GROUP_RE.test(item.url)) {
          const url = Utils.restoreUrl(item.url)
          await browser.bookmarks.create({ title: item.title, url, parentId: folder.id })
        }

        continue
      }

      const url = Utils.restoreUrl(item.url)
      await browser.bookmarks.create({ title: item.title, url, parentId, index })

      if (progress) Notifications.updateProgress(progress, n++, items.length)
    }
  } else {
    for (const t of items) {
      attachTabInfoToTitle(t)
      await browser.bookmarks.create({
        url: Utils.restoreUrl(t.url),
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
  items: T.ItemInfo[],
  dst: T.DstPlaceInfo,
  removeOld: boolean,
  progress?: T.Notification,
  idsMap?: Partial<Record<ID, ID>>
): Promise<BkmNode[] | void> {
  if (!dst.parentId) return Logs.warn('Bookmarks.saveToFolder: No dst parentId')

  const dstFolder = Bookmarks.byId.get(dst.parentId)
  if (!dstFolder) return Logs.warn('Bookmarks.saveToFolder: No dst parent folder')

  const panelFolderId = dstFolder.id
  const bookmarksList = Array.from(listBookmarks(dstFolder.children))
  let n = 0

  // Tree
  if (Settings.state.tabsTreeBookmarks) {
    if (!idsMap) idsMap = { [D.NOID]: panelFolderId }
    else idsMap[D.NOID] = panelFolderId
    const indexes: Record<ID, number> = { [panelFolderId]: 0 }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const nextItem = items[i + 1]
      const parentFolderId = idsMap[item.parentId ?? D.NOID]
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
        const sepIndex = bookmarksList.findIndex(n => n.type === E.BkmType.Separator)
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
        attachTabInfoToTitle(item)
        const folderIndex = bookmarksList.findIndex(n => {
          return n.type === E.BkmType.Folder && n.title === item.title
        })
        let folder: BkmNode | undefined = bookmarksList[folderIndex]
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
          const nFolder = await browser.bookmarks.create(createConf)
          folder = byId.get(nFolder.id)
        }
        if (!folder) throw 'Bookmarks.saveToFolder: No folder'

        indexes[folder.id] = 0
        idsMap[item.id] = folder.id

        if (progress) Notifications.updateProgress(progress, n++, items.length)

        // Bookmark of the parent item
        if (item.url && !D.GROUP_RE.test(item.url)) {
          const bookmarkIndex = bookmarksList.findIndex(n => {
            return n.type === E.BkmType.Bookmark && n.title === item.title && n.url === item.url
          })
          let bookmark: BkmNode | undefined = bookmarksList[bookmarkIndex]
          // Bookmark exists
          if (bookmark) {
            bookmarksList.splice(bookmarkIndex, 1)
            if (bookmark.index !== 0 || folder.id !== bookmark.parentId) {
              await browser.bookmarks.move(bookmark.id, { index: 0, parentId: folder.id })
            }
          }
          // Create bookmark
          else {
            const url = Utils.restoreUrl(item.url)
            const createConf = { title: item.title, url, index: 0, parentId: folder.id }
            const nBookmark = await browser.bookmarks.create(createConf)
            bookmark = byId.get(nBookmark.id)
          }
          indexes[folder.id]++
        }
        continue
      }

      // Bookmark
      attachTabInfoToTitle(item)
      const url = Utils.restoreUrl(item.url)
      const bookmarkIndex = bookmarksList.findIndex(n => {
        return n.type === E.BkmType.Bookmark && n.title === item.title && n.url === url
      })
      let bookmark: BkmNode | undefined = bookmarksList[bookmarkIndex]
      // Bookmark exists
      if (bookmark) {
        bookmarksList.splice(bookmarkIndex, 1)
        if (bookmark.index !== index || parentFolderId !== bookmark.parentId) {
          await browser.bookmarks.move(bookmark.id, { index, parentId: parentFolderId })
        }
      }
      // Create bookmark
      else {
        const createConf = { title: item.title, url, index, parentId: parentFolderId }
        const nBookmark = await browser.bookmarks.create(createConf)
        bookmark = byId.get(nBookmark.id)
      }

      if (progress) Notifications.updateProgress(progress, n++, items.length)
    }
  }

  // Plain list
  else {
    let index = 0

    for (const item of items) {
      if (item.url && D.GROUP_RE.test(item.url)) continue

      attachTabInfoToTitle(item)
      const bookmarkIndex = bookmarksList.findIndex(n => {
        return n.type === E.BkmType.Bookmark && n.title === item.title && n.url === item.url
      })
      let bookmark: BkmNode | undefined = bookmarksList[bookmarkIndex]
      // Bookmark exists
      if (bookmark) {
        bookmarksList.splice(bookmarkIndex, 1)
        if (bookmark.index !== index || panelFolderId !== bookmark.parentId) {
          await browser.bookmarks.move(bookmark.id, { index, parentId: panelFolderId })
        }
      }
      // Create bookmark
      else {
        const url = Utils.restoreUrl(item.url)
        const createConf = { title: item.title, url, index, parentId: panelFolderId }
        const nBookmark = await browser.bookmarks.create(createConf)
        bookmark = byId.get(nBookmark.id)
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
    if (node.type === E.BkmType.Folder && node.children && !node.children.length) {
      await browser.bookmarks.removeTree(node.id)
    }

    // Remove remained bookmarks
    else if (removeOld) {
      if (bookmarksList.find(n => n.id === node.parentId)) continue
      else if (node.type === E.BkmType.Folder) await browser.bookmarks.removeTree(node.id)
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

  const conf: T.DialogConfig = {
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

export function getPath(bookmark: BkmNode): ID[] {
  let parent = Bookmarks.byId.get(bookmark.parentId)
  const path: ID[] = []

  while (parent) {
    path.unshift(parent.id)
    parent = Bookmarks.byId.get(parent.parentId)
  }

  return path
}

export function findBookmarkPanelOf(bookmark: BkmNode): ID | void {
  const path = Bookmarks.getPath(bookmark)

  for (const panel of Sidebar.panels) {
    if (!Utils.isBookmarksPanel(panel)) continue
    if (panel.rootId === D.NOID || panel.rootId === D.BKM_ROOT_ID) return panel.id
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
  const actPanelId = Sidebar.activePanelId
  let panel = Sidebar.panelsById[actPanelId]
  if (
    Utils.isTabsPanel(panel) &&
    Sidebar.subPanelActive &&
    Sidebar.subPanelType === E.SubPanelType.Bookmarks &&
    Sidebar.subPanels.bookmarks
  ) {
    panel = Sidebar.subPanels.bookmarks
  }
  if (!Utils.isBookmarksPanel(panel) || !panel.scrollEl) return

  const elId = `bookmark${actPanelId}${id}`
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
    let y = bY - D.PRE_SCROLL
    if (y < 0) y = 0
    scrollConf.top = y
    panel.scrollEl.scroll(scrollConf)
    return
  }

  if (bY < pS + D.PRE_SCROLL) {
    if (pS > 0) {
      let y = bY - D.PRE_SCROLL
      if (y < 0) y = 0
      scrollConf.top = y
      panel.scrollEl.scroll(scrollConf)
    }
  } else if (bY + bH > pS + pH - D.PRE_SCROLL) {
    scrollConf.top = bY + bH - pH + D.PRE_SCROLL
    panel.scrollEl.scroll(scrollConf)
  }
}

export function* listBookmarks(nodes?: BkmNode[]): IterableIterator<BkmNode> {
  if (!nodes) nodes = Bookmarks.tree

  for (const n of nodes) {
    yield n
    if (n.children) yield* listBookmarks(n.children)
  }
}

export function openAsBookmarksPanel(node: BkmNode) {
  if (node.type !== E.BkmType.Folder) return

  const index = Sidebar.reactive.nav.indexOf(Sidebar.activePanelId)
  if (index === -1) return

  // Get name for new panel
  let panelName: string | undefined
  const titleExec = D.FOLDER_NAME_DATA_RE.exec(node.title)
  if (titleExec) panelName = titleExec[1]
  else panelName = node.title

  // Start bookmarks panel creation
  Popups.openPanelPopup({
    type: E.PanelType.bookmarks,
    name: panelName,
    rootId: node.id,
  })
}

export async function openAsTabsPanel(folder: BkmNode, showConfigPopup: boolean): Promise<void> {
  if (folder.type !== E.BkmType.Folder) return

  const noTabsPanels = !Sidebar.hasTabs
  const index = Sidebar.getIndexForNewTabsPanel()
  let tabsPanel: T.Panel | undefined

  if (showConfigPopup) {
    // Use folder name as default panel name and open panel popup
    const result = await Popups.openPanelPopup(
      { type: E.PanelType.tabs, name: folder.title, bookmarksFolderId: folder.id },
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

export async function copy(ids: ID[], template: T.CopyTemplate) {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  const nodes = getNodesWithChildren(ids, node => {
    if (template.hasU && !node.url) return false
    if ((template.hasT || template.hasCT) && !(node.parsedTitle ?? node.title)) return false
    return true
  })
  const strings = formatCopyTemplate(ids, nodes, template)
  const resultString = strings.join('\n')
  if (resultString) navigator.clipboard.writeText(resultString)
}

function getNodesWithChildren(ids: ID[], pred: (node: BkmNode) => any): BkmNode[] {
  const nodes: BkmNode[] = []
  for (const node of Bookmarks.listBookmarks()) {
    const includedItself = ids.includes(node.id)
    if (includedItself || ids.includes(node.parentId)) {
      if (!includedItself && node.children?.length) ids.push(node.id)
      if (pred(node)) nodes.push(node)
    }
  }
  return nodes
}

function formatCopyTemplate(ids: ID[], nodes: BkmNode[], template: T.CopyTemplate): string[] {
  const isDBG = template.str === '%DBG'
  const lines: string[] = []
  const bullet = nodes.length > 1 ? Settings.state.copyMultiBullet : ''
  const indent = Settings.state.copyTreeIndent
  const indentLevelsById = new Map<ID, number>()
  for (const node of nodes) {
    if (isDBG) {
      lines.push(JSON.stringify(node, null, 2))
      continue
    }

    // Get indent lvl
    const path = Bookmarks.getPath(node)
    const pNodeId = path.findLast(id => ids.includes(id))
    const pLvl = pNodeId ? indentLevelsById.get(pNodeId) : undefined
    const indentLvl = pLvl !== undefined ? pLvl + 1 : 0

    indentLevelsById.set(node.id, indentLvl)

    let result = template.str
    if (template.hasB) result = result.replaceAll('%B', bullet)
    if (template.hasCT) result = result.replaceAll('%CT', node.parsedTitle ?? node.title)
    if (template.hasT) result = result.replaceAll('%T', node.parsedTitle ?? node.title)
    if (template.hasU) result = result.replaceAll('%U', node.url ?? '')
    lines.push(indent.repeat(indentLvl) + result)
  }
  return lines
}

export async function pasteInOrAfter(id: ID) {
  const panel = Sidebar.panelsById[id]
  if (Utils.isBookmarksPanel(panel)) {
    id = panel.rootId
    if (id === D.BKM_ROOT_ID || id === D.NOID) {
      id = D.BKM_OTHER_ID
    }
  }

  await Bookmarks.prepareBookmarks()

  const target = Bookmarks.byId.get(id)
  if (!target) return Logs.warn('Bookmarks.pasteInOrAfter: No target')

  if (target.type === E.BkmType.Folder) Bookmarks.pasteIn(id)
  else Bookmarks.pasteAfter(id)
}

export async function pasteIn(id: ID) {
  if (id === D.BKM_ROOT_ID || id === D.NOID) {
    id = D.BKM_OTHER_ID
  }

  const bkmNode = Bookmarks.byId.get(id)
  if (!bkmNode || bkmNode.type !== E.BkmType.Folder || !bkmNode.children) {
    return Logs.warn('Bookmarks.pasteIn: No target folder')
  }

  const dst: T.DstPlaceInfo = {
    parentId: bkmNode.id,
    index: bkmNode.children.length,
  }

  return paste(dst)
}

export async function pasteAfter(id: ID) {
  const bkmNode = Bookmarks.byId.get(id)
  if (!bkmNode) return Logs.warn('Bookmarks.pasteAfter: No target bookmark')

  const parentNode = Bookmarks.byId.get(bkmNode.parentId)
  if (!parentNode) return Logs.warn('Bookmarks.pasteAfter: No target folder')

  const dst: T.DstPlaceInfo = {
    parentId: parentNode.id,
    index: bkmNode.index + 1,
  }

  return paste(dst)
}

export async function paste(dst: T.DstPlaceInfo) {
  // Check permission
  if (!Permissions.reactive.clipboardRead) {
    const result = await Permissions.request('clipboardRead')
    if (!result) return Logs.warn('Bookmarks.paste: No permission')
  }

  // Load bookmarks
  await Bookmarks.prepareBookmarks()

  // Get and parse text from clipboard
  const rawText = await navigator.clipboard.readText()
  const items = Utils.withoutEmptyFolders(Utils.parseTextForItems(rawText))
  if (!items.length) return Logs.warn('Bookmarks.paste: No parsed items')

  // Check/Normalize dst info
  // - Parent tab
  if (dst.parentId === undefined) {
    dst.parentId = D.BKM_OTHER_ID
    dst.index = undefined
  }
  const dstParent = Bookmarks.byId.get(dst.parentId)
  if (!dstParent || !dstParent.children) return Logs.warn('Bookmarks.paste: No parent folder')
  // - Index
  if (dst.index === undefined) {
    dst.index = dstParent.children.length
  }

  // Create bookmarks
  await createFrom(items, dst)

  // Scroll to the first node
  const bkmNode = dstParent.children[dst.index]
  if (bkmNode) Bookmarks.scrollToBookmark(bkmNode.id)
}

export function isFolderWithURL(folder: BkmNode): boolean {
  if (!folder.children) return false

  const firstChild = folder.children[0]
  if (!firstChild?.url) return false

  const title = folder.title
  const childTitle = firstChild.title

  if (childTitle === title) return true

  return childTitle.startsWith(title) && childTitle[title.length + 1] === '['
}

function bookmarkIsParentTab(node: BkmNode, parentTitle?: string): boolean {
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
  if (!Bookmarks.tree.length) await Bookmarks.load()
  return true
}

const flashAnimationTimeouts = new Map<ID, number>()

export function triggerFlashAnimation(panelId: ID, bookmarkId: ID) {
  const elId = 'bookmark' + panelId + bookmarkId
  const el = document.getElementById(elId)
  if (!el) return

  el.classList.add('-middle-click')
  clearTimeout(flashAnimationTimeouts.get(bookmarkId))
  flashAnimationTimeouts.set(
    bookmarkId,
    setTimeout(() => {
      el?.classList.remove('-middle-click')
      flashAnimationTimeouts.delete(bookmarkId)
    }, 300)
  )
}

export function convertTreeToDragItems(rootId: ID): T.DragItem[] {
  const targetIds = [rootId]
  const dragItems: T.DragItem[] = []
  const walker = (nodes: BkmNode[]) => {
    for (const node of nodes) {
      const incl = node.parentId && targetIds.includes(node.parentId)
      if (incl || Selection.includes(node.id)) {
        targetIds.push(node.id)
        dragItems.push({
          id: node.id,
          url: node.url,
          title: node.title,
          parentId: node.parentId,
        })
      }
      if (node.children) walker(node.children)
    }
  }
  walker(Bookmarks.tree)

  return dragItems
}

export function setupBookmarksListeners(): void {
  if (!browser.bookmarks) return
  browser.bookmarks.onCreated.addListener(onBookmarkCreated)
  browser.bookmarks.onChanged.addListener(onBookmarkChanged)
  browser.bookmarks.onMoved.addListener(onBookmarkMoved)
  browser.bookmarks.onRemoved.addListener(onBookmarkRemoved)
}

export function resetBookmarksListeners(): void {
  if (!browser.bookmarks) return
  browser.bookmarks.onCreated.removeListener(onBookmarkCreated)
  browser.bookmarks.onChanged.removeListener(onBookmarkChanged)
  browser.bookmarks.onMoved.removeListener(onBookmarkMoved)
  browser.bookmarks.onRemoved.removeListener(onBookmarkRemoved)
}

function onBookmarkCreated(id: ID, nativeBkmNode: T.NativeBkmNode): void {
  if (!Bookmarks.tree.length) return

  const bookmark = new BkmNode(nativeBkmNode)
  const parent = byId.get(bookmark.parentId)
  parent?.addBkm(bookmark, bookmark.index)
  ancestorsUpdBuffer.add(bookmark)
}

function onBookmarkChanged(id: ID, info: browser.bookmarks.UpdateChanges): void {
  if (!Bookmarks.tree.length) return

  const bookmark = Bookmarks.byId.get(id)
  if (!bookmark) return

  if (info.title !== undefined && bookmark.title !== info.title) {
    bookmark.setTitle(info.title)
  }

  if (info.url !== undefined && bookmark.url !== info.url) {
    bookmark.setUrl(info.url)
  }
}

function onBookmarkMoved(id: ID, info: browser.bookmarks.MoveInfo): void {
  if (!Bookmarks.tree.length) return

  const oldParent = Bookmarks.byId.get(info.oldParentId)
  const newParent = Bookmarks.byId.get(info.parentId)

  const rmNode = oldParent?.rmChildByIndex(info.oldIndex)
  if (rmNode) newParent?.addBkm(rmNode, info.index)

  oldParent?.updFolderInfo()
  if (oldParent) ancestorsUpdBuffer.add(oldParent)
  if (newParent !== oldParent) {
    newParent?.updFolderInfo()
    if (newParent) ancestorsUpdBuffer.add(newParent)
  }

  Bookmarks.saveBookmarksTree()
}

function onBookmarkRemoved(id: ID, info: browser.bookmarks.RemoveInfo): void {
  if (!Bookmarks.tree.length) return

  const parent = Bookmarks.byId.get(info.parentId)
  parent?.rmChildByIndex(info.index)

  const node = Bookmarks.byId.get(id)
  if (node) {
    byId.delete(node.id)
    if (node.url) Links.rmBkm(node)
    ancestorsUpdBuffer.add(node)
  }
}

export const TESTING = {
  BkmNode,
}
