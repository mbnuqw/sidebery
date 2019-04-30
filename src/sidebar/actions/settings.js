import { DEFAULT_SETTINGS } from '../settings'
import Utils from '../../libs/utils'
import Logs from '../../libs/logs'

export default {
  /**
   * Try to load settings from local storage.
   */
  async loadSettings({ state }) {
    let ans = await browser.storage.local.get('settings')
    if (!ans || !ans.settings) {
      Logs.push('[WARN] Cannot load settings')
      state.settingsLoaded = true
      return
    }

    let settings = ans.settings
    for (const key in settings) {
      if (!settings.hasOwnProperty(key)) continue
      if (settings[key] === undefined) continue
      state[key] = settings[key]
    }

    state.settingsLoaded = true
    Logs.push('[INFO] Settings loaded')
  },

  /**
   * Save settings to local storage
   */
  async saveSettings({ state }) {
    if (!state.settingsLoaded || !state.windowFocused) return
    let settings = {}
    for (const key in DEFAULT_SETTINGS) {
      if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
      if (state[key] == null || state[key] == undefined) continue
      if (state[key] instanceof Object) settings[key] = JSON.parse(JSON.stringify(state[key]))
      else settings[key] = state[key]
    }
    await browser.storage.local.set({ settings })
  },

  /**
   * Update settings
   */
  updateSettings({ state, dispatch }, settings) {
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
      dispatch('updateTabsVisability')
    }

    if (toggleBookmarks) {
      if (state.bookmarksPanel) dispatch('loadBookmarks')
      else state.bookmarks = []
    }

    if (look) {
      dispatch('updateTheme')
    }
  },

  /**
   * Update theme
   */
  updateTheme({ state }) {
    let themeLinkEl = document.getElementById('theme_link')
    if (!themeLinkEl) {
      themeLinkEl = document.createElement('link')
      themeLinkEl.id = 'theme_link'
      themeLinkEl.type = 'text/css'
      themeLinkEl.rel = 'stylesheet'
    }

    themeLinkEl.href = `../themes/${state.look}.css`
    document.head.appendChild(themeLinkEl)
  },

  /**
   * Update font size for 'html' tag.
   */
  updateFontSize({ state }) {
    const htmlEl = document.documentElement
    if (state.fontSize === 'xs') htmlEl.style.fontSize = '13.5px'
    else if (state.fontSize === 's') htmlEl.style.fontSize = '14px'
    else if (state.fontSize === 'm') htmlEl.style.fontSize = '14.5px'
    else if (state.fontSize === 'l') htmlEl.style.fontSize = '15px'
    else if (state.fontSize === 'xl') htmlEl.style.fontSize = '15.5px'
    else if (state.fontSize === 'xxl') htmlEl.style.fontSize = '16px'
    else htmlEl.style.fontSize = '14.5px'
  },

  /**
   * Provide window-wise debug data
   */
  async getWindowDbgInfo({ state }) {
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
  },

  /**
   * Provide common debug data
   */
  async getCommonDbgInfo({ state, getters }) {
    // Settings
    const settings = {}
    for (let sKey in DEFAULT_SETTINGS) {
      if (!DEFAULT_SETTINGS.hasOwnProperty(sKey)) continue
      settings[sKey] = state[sKey]
    }

    // Panels
    const panels = []
    for (let panel of getters.panels) {
      // Get sanitized clone
      const panelClone = JSON.parse(JSON.stringify(panel))

      if (panelClone.tabs) panelClone.tabs = panelClone.tabs.length
      delete panelClone.name
      delete panelClone.iconUrl
      delete panelClone.includeHosts
      delete panelClone.excludeHosts
      delete panelClone.proxy
      panels.push(panelClone)
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

    return { settings, panels, storage, bookmarks }
  },

  /**
   * Get sidebar css selectors
   */
  getCssSelectors() {
    const selectors = [
      { id: 'root', lvl: 0, classList: ['root'] }
    ]
    const rootEl = document.getElementById('root')

    let lvl = 1
    const walker = nodes => {
      for (let node of nodes) {
        if (node.nodeType !== 1) continue
        if (node.tagName === 'use') continue

        const sel = {
          id: node.id,
          tag: node.tagName.toLowerCase(),
          lvl,
        }

        if (typeof node.className === 'string') {
          sel.classList = node.className.split(' ')
        }

        selectors.push(sel)

        if (node.childNodes && node.childNodes.length) {
          lvl++
          walker(node.childNodes)
          lvl--
        }
      }
    }
    walker(rootEl.childNodes)

    return selectors
  },
}
