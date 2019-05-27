import Utils from '../../libs/utils'
import Logs from '../../libs/logs'
import CommonActions from '../../actions/settings'
import Actions from './index'
import { DEFAULT_SETTINGS } from '../../settings'

// /**
//  * Update theme
//  */
// function updateTheme(state) {
//   let themeLinkEl = document.getElementById('theme_link')
//   if (!themeLinkEl) {
//     themeLinkEl = document.createElement('link')
//     themeLinkEl.id = 'theme_link'
//     themeLinkEl.type = 'text/css'
//     themeLinkEl.rel = 'stylesheet'
//   }

//   themeLinkEl.href = `../themes/${state.look}.css`
//   document.head.appendChild(themeLinkEl)
// }

/**
 * Update settings
 */
function updateSettings(state, settings) {
  if (!settings) return

  // Check what values was updated
  const hideInactTabs = state.hideInact !== settings.hideInact
  const updateSuccessions =
    state.activateAfterClosing !== settings.activateAfterClosing ||
    state.activateAfterClosingPrevRule !== settings.activateAfterClosingPrevRule ||
    state.activateAfterClosingNextRule !== settings.activateAfterClosingNextRule
  const resetTree = state.tabsTree !== settings.tabsTree && state.tabsTree
  const updateTree = state.tabsTreeLimit !== settings.tabsTreeLimit
  const updateInvisTabs = state.hideFoldedTabs !== settings.hideFoldedTabs
  const toggleBookmarks = state.bookmarksPanel !== settings.bookmarksPanel
  const look = state.look !== settings.look

  // Update settings
  for (let k in settings) {
    if (!settings.hasOwnProperty(k)) continue
    if (settings[k] !== undefined) state[k] = settings[k]
  }

  if (updateSuccessions) {
    const activeTab = state.tabs.find(t => t.active)
    if (state.activateAfterClosing !== 'none' && activeTab) {
      const target = Utils.FindSuccessorTab(state, activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  if (resetTree) {
    for (let tab of state.tabs) {
      tab.isParent = false
      tab.folded = false
      tab.invisible = false
      tab.parentId = -1
      tab.lvl = 0
    }
  }

  if (updateTree) {
    Utils.UpdateTabsTree(state)
  }

  if (hideInactTabs || updateInvisTabs) {
    Actions.updateTabsVisability(state)
  }

  if (toggleBookmarks) {
    if (state.bookmarksPanel) Actions.loadBookmarks(state)
    else state.bookmarks = []
  }

  if (look) {
    Actions.updateTheme(state)
  }
}

/**
 * Provide window-wise debug data
 */
async function getWindowDbgInfo(state) {
  const tabs = []

  for (let tab of state.tabs) {
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
async function getCommonDbgInfo(state, panels) {
  // Settings
  const settings = {}
  for (let sKey in DEFAULT_SETTINGS) {
    if (!DEFAULT_SETTINGS.hasOwnProperty(sKey)) continue
    settings[sKey] = state[sKey]
  }

  // Panels
  const panelsInfo = []
  for (let panel of panels) {
    // Get sanitized clone
    const panelClone = JSON.parse(JSON.stringify(panel))

    if (panelClone.tabs) panelClone.tabs = panelClone.tabs.length
    delete panelClone.name
    delete panelClone.iconUrl
    delete panelClone.includeHosts
    delete panelClone.excludeHosts
    delete panelClone.proxy
    panelsInfo.push(panelClone)
  }

  // Storage
  const stored = await browser.storage.local.get()
  const storage = {}
  try {
    storage.overal = Utils.StrSize(JSON.stringify(stored))
    storage.favicons = Utils.StrSize(JSON.stringify(stored.favicons))
    storage.faviconsCount = Object.keys(stored.favicons).length
    storage.tabs = Utils.StrSize(JSON.stringify(stored.tabsTreeState))
    storage.snapshots = Utils.StrSize(JSON.stringify(stored.snapshots))
    storage.containers = Utils.StrSize(JSON.stringify(stored.containers))
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
  walker(state.bookmarks)
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
  getWindowDbgInfo,
  getCommonDbgInfo,
  getCssSelectors,
}