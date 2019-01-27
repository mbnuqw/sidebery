import Utils from '../../libs/utils'
import EventBus from '../event-bus'

export default {
  /**
   * Load all tabs for current window
   */
  async loadTabs({ state, getters }) {
    const windowId = browser.windows.WINDOW_ID_CURRENT
    const tabs = await browser.tabs.query({ windowId })

    // Check order of tabs and get moves for normalizing
    const ctxs = [getters.defaultCtxId].concat(state.ctxs.map(ctx => ctx.cookieStoreId))
    const moves = []
    let index = tabs.filter(t => t.pinned).length
    let offset = 0
    for (let i = 0; i < ctxs.length; i++) {
      const ctx = ctxs[i]
      for (let j = 0; j < tabs.length; j++) {
        const tab = tabs[j]
        if (tab.pinned) continue
        if (tab.cookieStoreId !== ctx) continue

        if (index !== tab.index + offset) {
          moves.push([tab.id, index])
          offset++
        }
        index++
      }
    }

    state.tabs = tabs

    // Normalize order
    moves.map(async move => {
      await browser.tabs.move(move[0], { index: move[1] })
    })

    // Calc tree levels
    if (state.tabsTree) Utils.CalcTabsTreeLevels(state.tabs)
  },

  /**
   * Create new tab in current window
   */
  createTab({ state, getters }, ctxId) {
    if (!ctxId) return
    let p = getters.panels.find(p => p.cookieStoreId === ctxId)
    if (!p || !p.tabs) return
    let index = p.tabs.length ? p.endIndex + 1 : p.startIndex
    browser.tabs.create({ index, cookieStoreId: ctxId, windowId: state.windowId })
  },

  /**
   * Remove tab.
   */
  async removeTab({ state, getters }, tab) {
    let p = Utils.GetPanelOf(getters.panels, tab)
    if (!p || !p.tabs) return
    if (state.lockedTabs[state.panelIndex] && tab.url.indexOf('about')) {
      return
    }

    if (
      state.noEmptyDefault
      && !tab.pinned
      && tab.cookieStoreId === getters.defaultCtxId
    ) {
      const panelIndex = Utils.GetPanelIndex(getters.panels, tab.id)
      const panelTabs = getters.panels[panelIndex].tabs
      if (panelTabs && panelTabs.length === 1) {
        await browser.tabs.create({ active: true })
      }
    }

    if (tab.index === p.endIndex && p.tabs.length > 1 && tab.active) {
      let prevTab = state.tabs[p.endIndex - 1]
      await browser.tabs.update(prevTab.id, { active: true })
    }
    browser.tabs.remove(tab.id)
  },

  /**
   * Remove tabs
   */
  async removeTabs({ state, getters }, tabIds) {
    const tabs = []
    const toRemove = []
    let panelId = undefined
    let firstIndex, lastIndex

    // Find tabs to remove
    for (let id of tabIds) {
      const tab = state.tabs.find(t => t.id === id)
      if (!tab) continue
      if (state.lockedTabs[state.panelIndex] && tab.url.indexOf('about')) continue
      if (panelId === undefined) panelId = tab.cookieStoreId
      if (panelId && panelId !== tab.cookieStoreId) panelId = null
      if (firstIndex === undefined) firstIndex = tab.index
      else if (firstIndex > tab.index) firstIndex = tab.index
      if (lastIndex === undefined) lastIndex = tab.index
      else if (lastIndex < tab.index) lastIndex = tab.index
      tabs.push(tab)
      toRemove.push(tab.id)
    }

    // Check if all tabs from the same panel
    // and find that panel
    let panel
    if (panelId) {
      panel = getters.panels.find(p => p.cookieStoreId === panelId)
    }

    // If there are not tabs on this panel
    // create new one (if that option accepted)
    if (
      panel
      && toRemove.length === panel.tabs.length
      && panelId === getters.defaultCtxId
      && state.noEmptyDefault
    ) {
      await browser.tabs.create({ active: true })
    }

    // Try to activate prev or next tab on this panel
    // if there are some other tabs and if
    // all removed tabs from the same panel
    if (panel && toRemove.length < panel.tabs.length) {
      const activeTab = tabs.find(t => t.active)

      if (activeTab && activeTab.cookieStoreId === panelId) {
        let toActivate = panel.tabs.find(t => t.index === firstIndex - 1)
        if (!toActivate) toActivate = panel.tabs.find(t => t.index === lastIndex + 1)
        if (toActivate) await browser.tabs.update(toActivate.id, { active: true })
      }
    }

    browser.tabs.remove(toRemove)
  },

  /**
   * Activate tab relatively current active tab.
   */
  switchTab({ state, getters }, { globaly, cycle, step }) {
    if (state.switchTabPause) return
    state.switchTabPause = setTimeout(() => {
      clearTimeout(state.switchTabPause)
      state.switchTabPause = null
    }, 50)

    let tabs = globaly ? state.tabs : getters.panels[state.panelIndex].tabs
    if (!tabs || !tabs.length) return

    let index = tabs.findIndex(t => t.active)
    if (step > 0) {
      index = index + step
      if (index >= tabs.length) {
        if (cycle) index = 0
        else return
      }
    }
    if (step < 0) {
      if (index < 0) index = tabs.length
      index = index + step
      if (index < 0) {
        if (cycle) index = tabs.length - 1
        else return
      }
    }

    browser.tabs.update(tabs[index].id, { active: true })
  },

  /**
   * Reload tabs
   */
  reloadTabs({ state }, tabIds = []) {
    for (let tabId of tabIds) {
      const tab = state.tabs.find(t => t.id === tabId)
      if (!tab) continue
      if (tab.url === 'about:blank' && tab.status === 'loading') continue
      browser.tabs.reload(tabId)
    }
  },

  /**
   * Discard tabs
   */
  discardTabs(_, tabIds = []) {
    browser.tabs.discard(tabIds)
  },

  /**
   * Activate last active tab on the panel
   */
  activateLastActiveTabOf({ state, getters }, panelIndex) {
    const tabId = state.activeTabs[panelIndex]
    const p = getters.panels[panelIndex]
    if (!p || !p.tabs) return

    // Last active tab
    if (typeof tabId === 'number' && p.tabs.find(t => t.id === tabId)) {
      browser.tabs.update(tabId, { active: true })
      return
    }

    // Or just last
    const lastTab = p.tabs[p.tabs.length - 1]
    if (lastTab) browser.tabs.update(lastTab.id, { active: true })
  },

  /**
   * (un)Pin tabs
   */
  pinTabs(_, tabIds) {
    for (let tabId of tabIds) browser.tabs.update(tabId, { pinned: true })
  },
  unpinTabs(_, tabIds) {
    for (let tabId of tabIds) browser.tabs.update(tabId, { pinned: false })
  },
  repinTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabs.find(t => t.id === tabId)
      if (!tab) continue
      browser.tabs.update(tabId, { pinned: !tab.pinned })
    }
  },

  /**
   * (un)Mute tabs
   */
  muteTabs(_, tabIds) {
    for (let tabId of tabIds) browser.tabs.update(tabId, { muted: true })
  },
  unmuteTabs(_, tabIds) {
    for (let tabId of tabIds) browser.tabs.update(tabId, { muted: false })
  },
  remuteTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabs.find(t => t.id === tabId)
      if (!tab) continue
      browser.tabs.update(tabId, { muted: !tab.mutedInfo.muted })
    }
  },

  /**
   * Duplicate tabs
   */
  duplicateTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabs.find(t => t.id === tabId)
      if (!tab) continue
      if (state.lockedPanels.includes(tab.cookieStoreId)) continue
      browser.tabs.duplicate(tabId)
    }
  },

  /**
   * Create bookmarks from tabs
   */
  bookmarkTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabs.find(t => t.id === tabId)
      if (!tab) continue
      browser.bookmarks.create({ title: tab.title, url: tab.url })
    }
  },

  /**
   * Clear all cookies of tab urls
   */
  async clearTabsCookies({ state }, tabIds) {
    try {
      const permitted = await browser.permissions.contains({ origins: ['<all_urls>'] })
      if (!permitted) {
        const url = browser.runtime.getURL('permissions/all-urls.html')
        browser.tabs.create({ url })
        return
      }
    } catch (err) {
      return
    }

    for (let tabId of tabIds) {
      let tab = state.tabs.find(t => t.id === tabId)
      if (!tab) continue

      EventBus.$emit('tabLoadingStart', tab.id)

      let url = new URL(tab.url)
      let domain = url.hostname
        .split('.')
        .slice(-2)
        .join('.')

      if (!domain) {
        EventBus.$emit('tabLoadingErr', tab.id)
        break
      }

      let cookies = await browser.cookies.getAll({
        domain: domain,
        storeId: tab.cookieStoreId,
      })
      let fpcookies = await browser.cookies.getAll({
        firstPartyDomain: domain,
        storeId: tab.cookieStoreId,
      })

      const clearing = cookies.concat(fpcookies).map(c => {
        return browser.cookies.remove({
          storeId: tab.cookieStoreId,
          url: tab.url,
          name: c.name,
        })
      })

      Promise.all(clearing)
        .then(() => setTimeout(() => EventBus.$emit('tabLoadingOk', tab.id), 250))
        .catch(() => setTimeout(() => EventBus.$emit('tabLoadingErr', tab.id), 250))
    }
  },

  /**
   * Create new window with first tab
   * and then move other tabs.
   */
  async moveTabsToNewWin({ state }, { tabIds, incognito }) {
    const first = tabIds.shift()
    const firstTab = state.tabs.find(t => t.id === first)
    if (!firstTab) return
    const rest = [...tabIds]

    if (state.private === incognito) {
      const win = await browser.windows.create({ tabId: first, incognito })
      browser.tabs.move(rest, { windowId: win.id, index: -1 })
    } else {
      const win = await browser.windows.create({ url: firstTab.url, incognito })
      browser.tabs.remove(first)
      for (let tabId of rest) {
        let tab = state.tabs.find(t => t.id === tabId)
        if (!tab) continue
        browser.tabs.create({ windowId: win.id, url: tab.url })
        browser.tabs.remove(tabId)
      }
    }
  },

  /**
   *  Move tabs to window if provided,
   * otherwise show window-choosing menu.
   */
  async moveTabsToWin({ state, dispatch }, { tabIds, window }) {
    const ids = [...tabIds]
    const windowId = window ? window.id : await dispatch('chooseWin')
    const win = (await Utils.GetAllWindows()).find(w => w.id === windowId)

    if (state.private === win.incognito) {
      browser.tabs.move(ids, { windowId, index: -1 })
    } else {
      for (let id of ids) {
        let tab = state.tabs.find(t => t.id === id)
        if (!tab) continue
        browser.tabs.create({ url: tab.url, windowId })
        browser.tabs.remove(id)
      }
    }
  },

  /**
   * Move tabs (reopen url) in provided context.
   */
  async moveTabsToCtx({ state }, { tabIds, ctxId }) {
    const ids = [...tabIds]
    for (let tabId of ids) {
      let tab = state.tabs.find(t => t.id === tabId)
      if (!tab) return

      await browser.tabs.create({
        cookieStoreId: ctxId,
        url: tab.url.indexOf('http') ? null : tab.url
      })
      await browser.tabs.remove(tab.id)
    }
  },

  /**
   * Show all tabs
   */
  async showAllTabs({ state }) {
    const tabsToShow = state.tabs.filter(t => t.hidden).map(t => t.id)
    if (!tabsToShow.length) return null
    return browser.tabs.show(tabsToShow)
  },

  /**
   * (re)Hide inactive panels tabs
   */
  async hideInactPanelsTabs({ state, getters }) {
    const actPI = state.panelIndex < 0 ? state.lastPanelIndex : state.panelIndex
    const actP = getters.panels[actPI]
    if (!actP || !actP.tabs || actP.pinned) return
    const toShow = actP.tabs.filter(t => t.hidden).map(t => t.id)
    const toHide = getters.panels.reduce((acc, p, i) => {
      if (!p.tabs || p.tabs.length === 0) return acc
      if (i === actPI) return acc
      return acc.concat(p.tabs.filter(t => !t.hidden).map(t => t.id))
    }, [])

    if (toShow.length) browser.tabs.show(toShow)
    if (toHide.length) browser.tabs.hide(toHide)
  },
}
