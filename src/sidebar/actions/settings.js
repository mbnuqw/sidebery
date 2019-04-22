import { DEFAULT_SETTINGS } from '../settings'
import Utils from '../../libs/utils'

export default {
  /**
   * Try to load settings from local storage.
   */
  async loadSettings({ state }) {
    let ans = await browser.storage.local.get('settings')
    let settings = ans.settings
    if (!settings) {
      state.settingsLoaded = true
      return
    }

    for (const key in settings) {
      if (!settings.hasOwnProperty(key)) continue
      if (settings[key] === undefined) continue
      state[key] = settings[key]
    }

    state.settingsLoaded = true
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
    const updateInvisTabs =  state.hideFoldedTabs !== settings.hideFoldedTabs
    const toggleBookmarks = state.bookmarksPanel !== settings.bookmarksPanel

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
   * Provide debug data
   */
  getDbgInfo({ state, getters }) {
    const settings = {}
    for (let sKey in DEFAULT_SETTINGS) {
      if (!DEFAULT_SETTINGS.hasOwnProperty(sKey)) continue
      settings[sKey] = state[sKey]
    }

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

    return { settings, panels, tabs }
  },
}
