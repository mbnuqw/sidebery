import Utils from '../../utils'
import Logs from '../../logs'
import CommonActions from '../../actions/settings'
import { DEFAULT_SETTINGS } from '../../defaults'
import Actions from '../actions'

/**
 * Update settings
 */
function updateSettings(settings) {
  if (!settings) return

  // Check what values was updated
  const hideInactTabs = this.state.hideInact !== settings.hideInact
  const updateSuccessions =
    this.state.activateAfterClosing !== settings.activateAfterClosing ||
    this.state.activateAfterClosingPrevRule !== settings.activateAfterClosingPrevRule ||
    this.state.activateAfterClosingNextRule !== settings.activateAfterClosingNextRule
  const resetTree = this.state.tabsTree !== settings.tabsTree && this.state.tabsTree
  const updateTree = this.state.tabsTreeLimit !== settings.tabsTreeLimit
  const updateInvisTabs = this.state.hideFoldedTabs !== settings.hideFoldedTabs
  const toggleBookmarks = this.state.bookmarksPanel !== settings.bookmarksPanel
  const theme = this.state.theme !== settings.theme
  const highlightOpenBookmarks = this.state.highlightOpenBookmarks !== settings.highlightOpenBookmarks

  // Update settings of this instance
  for (let k in settings) {
    if (!settings.hasOwnProperty(k)) continue
    if (settings[k] !== undefined) this.state[k] = settings[k]
  }

  if (updateSuccessions) {
    const activeTab = this.state.tabs.find(t => t.active)
    if (this.state.activateAfterClosing !== 'none' && activeTab) {
      const target = Utils.findSuccessorTab(this.state, activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  if (resetTree) {
    for (let tab of this.state.tabs) {
      tab.isParent = false
      tab.folded = false
      tab.invisible = false
      tab.parentId = -1
      tab.lvl = 0
    }
  }

  if (updateTree) {
    Actions.updateTabsTree()
  }

  if (hideInactTabs || updateInvisTabs) {
    Actions.updateTabsVisability()
  }

  if (toggleBookmarks) {
    if (this.state.bookmarksPanel) Actions.loadBookmarks()
    else this.state.bookmarks = []
  }

  if (highlightOpenBookmarks && this.state.bookmarksUrlMap) {
    for (let tab of this.state.tabs) {
      let bookmarks = this.state.bookmarksUrlMap[tab.url]
      if (!bookmarks) continue
      for (let bookmark of bookmarks) {
        bookmark.isOpen = this.state.highlightOpenBookmarks
      }
    }
  }

  if (theme) {
    Actions.initTheme()
  }
}

/**
 * Open/activate settings page.
 * 
 * @param {string} [section] - url-encoded string
 */
function openSettings(section) {
  let url = browser.runtime.getURL('settings/settings.html')
  let existedTab = this.state.tabs.find(t => t.url.startsWith(url))
  let activePanel = this.state.panels[this.state.panelIndex]

  if (section) url += '#' + section
  if (existedTab) {
    if (existedTab.url === url) {
      browser.tabs.update(existedTab.id, { active: true })
    } else {
      browser.tabs.update(existedTab.id, { url, active: true })
    }
  } else {
    const conf = { url, windowId: this.state.windowId }
    if (activePanel.tabs) conf.cookieStoreId = activePanel.cookieStoreId
    browser.tabs.create(conf)
  }
}

/**
 * Provide window-wise debug data
 */
async function getWindowDbgInfo() {
  const tabs = []

  for (let tab of this.state.tabs) {
    // Get sanitized clone
    const tabClone = JSON.parse(JSON.stringify(tab))

    delete tabClone.title
    delete tabClone.host
    delete tabClone.width
    delete tabClone.height
    delete tabClone.lastAccessed
    tabClone.muted = tabClone.mutedInfo.muted
    delete tabClone.mutedInfo
    tabClone.url = tabClone.url.slice(0, 5) + '...'
    if (tabClone.favIconUrl && tabClone.favIconUrl.length > 5) {
      tabClone.favIconUrl = tabClone.favIconUrl.slice(0, 5) + '...'
    }
    tabs.push(tabClone)
  }

  return { logs: Logs, tabs }
}

/**
 * Provide common debug data
 */
async function getCommonDbgInfo() {
  // Settings
  const settings = {}
  for (let sKey in DEFAULT_SETTINGS) {
    if (!DEFAULT_SETTINGS.hasOwnProperty(sKey)) continue
    settings[sKey] = this.state[sKey]
  }

  // Panels
  const panelsInfo = []
  for (let panel of this.state.panels) {
    // Get sanitized clone
    const panelClone = JSON.parse(JSON.stringify(panel))

    if (panelClone.tabs) delete panelClone.tabs
    delete panelClone.name
    delete panelClone.includeHosts
    delete panelClone.excludeHosts
    delete panelClone.proxy
    panelsInfo.push(panelClone)
  }

  // Storage
  const stored = await browser.storage.local.get()
  const storage = {}
  try {
    storage.overal = Utils.strSize(JSON.stringify(stored))
    storage.props = []
    for (let prop in stored) {
      if (!stored.hasOwnProperty(prop)) continue
      let size = new Blob([JSON.stringify(stored[prop])]).size
      storage.props.push({
        name: prop,
        size: size,
        sizeStr: Utils.bytesToStr(size),
      })
    }
  } catch (err) {
    // nothing to do...
  }

  // Bookmarks
  let bookmarksCount = 0
  let foldersCount = 0
  let separatorsCount = 0
  let lvl = 0, maxDepth = 0
  const walker = nodes => {
    if (lvl > maxDepth) maxDepth = lvl
    for (let node of nodes) {
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
  walker(this.state.bookmarks)
  const bookmarks = {
    bookmarksCount,
    foldersCount,
    separatorsCount,
    maxDepth,
  }

  return { settings, panels: panelsInfo, storage, bookmarks }
}

/**
 * Get sidebar css selectors
 */
function getCssSelectors() {
  const selectors = [
    { id: 'root', classList: ['root'], lvl: 0, children: [] }
  ]
  const rootEl = document.getElementById('root')

  const walker = (nodes, selectors) => {
    for (let node of nodes) {
      if (node.nodeType !== 1) continue
      if (node.tagName === 'use') continue

      const sel = { id: node.id, tag: node.tagName.toLowerCase() }

      const attrs = []
      for (let attr of node.attributes) {
        if (attr.name === 'class') continue
        if (attr.name === 'title') continue
        if (attr.name === 'tabindex') continue

        attrs.push([attr.name, attr.value])
      }

      if (attrs.length) sel.attrs = attrs

      if (typeof node.className === 'string') {
        sel.classList = node.className.split(' ')
      }

      selectors.push(sel)

      if (node.childNodes && node.childNodes.length) {
        sel.children = []
        walker(node.childNodes, sel.children)
      }
    }
  }
  walker(rootEl.childNodes, selectors[0].children)

  return selectors
}

export default {
  ...CommonActions,

  updateSettings,
  openSettings,
  getWindowDbgInfo,
  getCommonDbgInfo,
  getCssSelectors,
}