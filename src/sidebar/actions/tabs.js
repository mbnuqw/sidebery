import Utils from '../../libs/utils'
import EventBus from '../event-bus'

let TabsTreeSaveTimeout, UpdateTabsSuccessorsTimeout

export default {
  /**
   * Load all tabs for current window
   */
  async loadTabs({ state, getters }) {
    const windowId = browser.windows.WINDOW_ID_CURRENT
    const tabs = await browser.tabs.query({ windowId })

    // Check order of tabs and get moves for normalizing
    const ctxs = [getters.defaultCtxId].concat(
      state.containers.filter(c => c.type === 'ctx').map(c => c.cookieStoreId)
    )
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

    // Set tabs initial props and update state
    state.tabsMap = []
    tabs.forEach(t => {
      t.isParent = false
      t.folded = false
      t.parentId = -1
      t.invisible = false
      t.lvl = 0
      t.host = t.url.split('/')[2] || ''
      state.tabsMap[t.id] = t
      if (!t.favIconUrl || t.favIconUrl.startsWith('chrome:')) t.favIconUrl = ''
    })
    state.tabs = tabs

    // Normalize order
    moves.map(async move => {
      await browser.tabs.move(move[0], { index: move[1] })
    })

    // Restore tree levels
    if (state.tabsTree) {
      const ans = await browser.storage.local.get('tabsTreeState')
      if (ans.tabsTreeState) {
        const parents = []
        let offset = 0
        for (let i = 0; i < ans.tabsTreeState.length; i++) {
          // Saved nodes
          const savedTab = ans.tabsTreeState[i]

          // Current tab
          let tab = state.tabs[savedTab.index - offset]
          if (!tab) break

          const sameUrl = savedTab.url === tab.url
          const isGroup = Utils.IsGroupUrl(savedTab.url)
          if (isGroup) {
            let nextUrlOk = true

            // Check if next non-group tab is ok
            for (let j = i + 1; j < ans.tabsTreeState.length; j++) {
              const nextTab = ans.tabsTreeState[j]
              if (!nextTab) break
              nextUrlOk = nextTab.url === tab.url
              if (!Utils.IsGroupUrl(nextTab.url)) break
            }

            // Removed group
            if (!sameUrl && nextUrlOk) {
              const groupId = Utils.GetGroupId(savedTab.url)
              const parent = parents[savedTab.parentId]
              const rTab = await browser.tabs.create({
                windowId: state.windowId,
                index: savedTab.index,
                url: browser.runtime.getURL('group/group.html') + `#${groupId}`,
                cookieStoreId: savedTab.ctx,
                active: false,
              })

              tab = state.tabsMap[rTab.id]
              tab.isParent = savedTab.isParent
              tab.folded = savedTab.folded
              if (savedTab.isParent) parents[savedTab.id] = tab
              if (parent) {
                tab.invisible = parent.folded || parent.invisible
                tab.parentId = parent.id
              }
              continue
            }
          }

          // Check if this is actual target tab
          if (!sameUrl && tab.status === 'complete') break
          if (tab.cookieStoreId !== savedTab.ctx) break

          tab.isParent = savedTab.isParent
          tab.folded = savedTab.folded
          if (savedTab.isParent) parents[savedTab.id] = tab
          if (parents[savedTab.parentId]) {
            const parentTab = parents[savedTab.parentId]
            tab.invisible = parentTab.folded || parentTab.invisible
            tab.parentId = parentTab.id
          }
        }
      }

      state.tabs = Utils.CalcTabsTreeLevels(state.tabs)
    }
  },

  /**
   * Save tabs tree
   */
  saveTabsTree({ state }, delay = 1000) {
    if (TabsTreeSaveTimeout) clearTimeout(TabsTreeSaveTimeout)
    TabsTreeSaveTimeout = setTimeout(() => {
      const tabsTreeState = []
      for (let t of state.tabs) {
        if (t.isParent || t.parentId > -1) {
          tabsTreeState.push({
            id: t.id,
            index: t.index,
            url: t.url,
            ctx: t.cookieStoreId,
            isParent: t.isParent,
            folded: t.folded,
            parentId: t.parentId,
          })
        }
      }
      browser.storage.local.set({ tabsTreeState })
      TabsTreeSaveTimeout = null
    }, delay)
  },

  /**
   * Scroll to active tab
   */
  scrollToActiveTab({ state, getters }) {
    const activePanel = getters.panels[state.panelIndex]
    if (activePanel && activePanel.tabs) {
      const activeTab = activePanel.tabs.find(t => t.active)
      if (activeTab) {
        EventBus.$emit('scrollToActiveTab', state.panelIndex, activeTab.id)
      }
    }
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
   * Remove tabs
   */
  async removeTabs({ state, getters }, tabIds) {
    let tabs = tabIds.map(id => state.tabsMap[id])
    const ctxId = tabs[0].cookieStoreId
    const panel = getters.panels.find(p => p.cookieStoreId === ctxId)
    if (!panel) return

    tabs = tabs.filter(tab => {
      if (!tab) return false
      if (tab.cookieStoreId !== ctxId) return false
      if (panel.lockedTabs && !tab.url.startsWith('about')) return false
      tab.invisible = true
      return true
    })

    // Remove folded tabs
    if (state.rmFoldedTabs) {
      for (let tab of tabs) {
        if (tab.isParent && tab.folded) {
          for (let i = tab.index + 1; i < state.tabs.length; i++) {
            if (state.tabs[i].lvl <= tab.lvl) break
            tabs.push(state.tabs[i])
          }
        }
      }
    }

    // Sort by index
    tabs = tabs.sort((a, b) => a.index - b.index)

    // Set tabs to be removed
    const toRemove = tabs.map(t => t.id)
    if (state.removingTabs && state.removingTabs.length) {
      state.removingTabs = [...state.removingTabs, ...toRemove]
    } else {
      state.removingTabs = [...toRemove]
    }

    // If there are no tabs on this panel
    // create new one (if that option accepted)
    if (tabs.length === panel.tabs.length && panel.noEmpty) {
      await browser.tabs.create({
        index: panel.startIndex,
        cookieStoreId: ctxId,
        active: true,
      })
    }

    // Try to activate prev or next tab on this panel
    if (tabs.length < panel.tabs.length) {
      const activeTab = tabs.find(t => t.active)

      if (activeTab && activeTab.cookieStoreId === panel.cookieStoreId) {
        const prevIndex = tabs[0].index - 1
        const nextIndex = tabs[tabs.length - 1].index + 1

        let target
        if (nextIndex <= panel.endIndex) target = state.tabs[nextIndex]
        else if (prevIndex >= panel.startIndex) target = state.tabs[prevIndex]

        if (target) await browser.tabs.update(target.id, { active: true })
      }
    }

    browser.tabs.remove(toRemove)
  },

  /**
   * Activate tab relatively current active tab.
   */
  switchTab({ state, getters }, { globaly, cycle, step, pinned }) {
    if (state.switchTabPause) return
    state.switchTabPause = setTimeout(() => {
      clearTimeout(state.switchTabPause)
      state.switchTabPause = null
    }, 50)

    const panel = getters.panels[state.panelIndex]
    let tabs
    if (state.pinnedTabsPosition === 'panel') {
      if (globaly) {
        tabs = []
        for (let p of getters.panels) {
          if (!p.cookieStoreId) continue
          for (let t of state.tabs) {
            if (t.cookieStoreId === p.cookieStoreId) tabs.push(t)
          }
        }
      } else {
        tabs = state.tabs.filter(t => t.cookieStoreId === panel.cookieStoreId)
      }
    } else {
      if (pinned) tabs = getters.pinnedTabs
      else tabs = globaly ? state.tabs : panel.tabs
    }
    if (!tabs || !tabs.length) return
    if (state.scrollThroughVisibleTabs) tabs = tabs.filter(t => !t.invisible)

    let index = tabs.findIndex(t => t.active)
    if (step > 0) {
      index += step
      if (index >= tabs.length) {
        if (cycle) index = 0
        else return
      }
    }
    if (step < 0) {
      if (index < 0) index = tabs.length
      index += step
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
      const tab = state.tabsMap[tabId]
      if (!tab) continue
      // if tab loading and haven't yet url
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
   * Set related with tabs tree values
   * for new child tab.
   */
  newTreeTab({ state, getters, dispatch }, tabId ) {
    const tab = state.tabsMap[tabId]
    if (!tab) return

    const panel = getters.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
    if (!panel) return

    let parent = state.tabsMap[tab.openerTabId]
    if (!parent) parent = { lvl: 0 }
    if (parent.pinned) return
    if (parent.cookieStoreId !== tab.cookieStoreId) return
    let lvlOk = !parent.lvl || !(parent.lvl >= state.tabsTreeLimit)

    if ((state.groupOnOpen || parent.isParent) && lvlOk) {
      // Child
      tab.parentId = tab.openerTabId
      for (let i = tab.index; i--; ) {
        if (tab.parentId !== state.tabs[i].id) continue
        if (state.tabs[i].lvl) tab.lvl = state.tabs[i].lvl + 1
        else tab.lvl = 1
        state.tabs[i].isParent = true
        if (state.tabs[i].folded) {
          tab.invisible = true
          if (state.hideFoldedTabs) browser.tabs.hide(tab.id)
        }
        break
      }

      // Auto fold sibling sub-trees
      if (state.autoFoldTabs) {
        for (let t of state.tabs) {
          const sameLvl = t.lvl === parent.lvl
          const notParent = t.id !== tab.openerTabId
          if (t.isParent && !t.folded && sameLvl && notParent && !tab.invisible) {
            dispatch('foldTabsBranch', t.id)
          }
        }
      }

    } else {
      // Sibling
      for (let i = tab.index; i--; ) {
        if (tab.openerTabId === state.tabs[i].id) {
          tab.parentId = state.tabs[i].parentId
          tab.lvl = state.tabs[i].lvl
          break
        }
      }
    }
  },

  /**
   * Try to activate last active tab on the panel
   */
  activateLastActiveTabOf({ state, getters }, panelIndex) {
    const p = getters.panels[panelIndex]
    if (!p || !p.tabs || !p.tabs.length) return
    const tab = state.tabsMap[p.lastActiveTab]
    if (tab) {
      browser.tabs.update(tab.id, { active: true })
    } else {
      let lastTab = p.tabs[p.tabs.length - 1]
      for (let i = p.tabs.length; i-- && lastTab.invisible; ) {
        lastTab = p.tabs[i]
      }
      if (lastTab) browser.tabs.update(lastTab.id, { active: true })
    }
  },

  /**
   * (un)Pin tabs
   */
  pinTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabsMap[tabId]
      if (!tab) continue
      for (let i = tab.index + 1; i < state.tabs.length; i++) {
        const child = state.tabs[i]
        if (child.lvl <= tab.lvl) break
        if (child.parentId === tab.id) child.parentId = tab.parentId
      }
      browser.tabs.update(tabId, { pinned: true })
    }
  },
  unpinTabs(_, tabIds) {
    for (let tabId of tabIds) browser.tabs.update(tabId, { pinned: false })
  },
  repinTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabsMap[tabId]
      if (!tab) continue
      for (let i = tab.index + 1; i < state.tabs.length; i++) {
        const child = state.tabs[i]
        if (child.lvl <= tab.lvl) break
        if (child.parentId === tab.id) child.parentId = tab.parentId
      }
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
      let tab = state.tabsMap[tabId]
      if (!tab) continue
      browser.tabs.update(tabId, { muted: !tab.mutedInfo.muted })
    }
  },

  /**
   * Duplicate tabs
   */
  async duplicateTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabsMap[tabId]
      if (!tab) continue
      await browser.tabs.create({
        index: tab.index + 1,
        cookieStoreId: tab.cookieStoreId,
        url: tab.url,
        openerTabId: tabId
      })
    }
  },

  /**
   * Create bookmarks from tabs
   */
  bookmarkTabs({ state }, tabIds) {
    for (let tabId of tabIds) {
      let tab = state.tabsMap[tabId]
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
      let tab = state.tabsMap[tabId]
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
    const firstTab = state.tabsMap[first]
    if (!firstTab) return
    const rest = [...tabIds]

    if (state.private === incognito) {
      const win = await browser.windows.create({ tabId: first, incognito })
      browser.tabs.move(rest, { windowId: win.id, index: -1 })
    } else {
      const win = await browser.windows.create({ url: firstTab.url, incognito })
      browser.tabs.remove(first)
      for (let tabId of rest) {
        let tab = state.tabsMap[tabId]
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
    const win = (await dispatch('getAllWindows')).find(w => w.id === windowId)

    if (state.private === win.incognito) {
      browser.tabs.move(ids, { windowId, index: -1 })
    } else {
      for (let id of ids) {
        let tab = state.tabsMap[id]
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
      let tab = state.tabsMap[tabId]
      if (!tab) return

      await browser.tabs.create({
        cookieStoreId: ctxId,
        url: tab.url.indexOf('http') ? null : tab.url,
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
    const toShow = actP.tabs.filter(t => t.hidden && !t.invisible).map(t => t.id)
    const toHide = getters.panels.reduce((acc, p, i) => {
      if (!p.tabs || p.tabs.length === 0) return acc
      if (i === actPI) return acc
      return acc.concat(p.tabs.filter(t => !t.hidden && !t.invisible).map(t => t.id))
    }, [])

    if (toShow.length) browser.tabs.show(toShow)
    if (toHide.length) browser.tabs.hide(toHide)
  },

  /**
   * Hide children of tab
   */
  foldTabsBranch({ state, dispatch }, tabId) {
    const toHide = []
    const tab = state.tabsMap[tabId]
    if (!tab) return
    tab.folded = true
    for (let i = tab.index + 1; i < state.tabs.length; i++) {
      const t = state.tabs[i]
      if (t.lvl <= tab.lvl) break
      if (t.active) browser.tabs.update(tabId, { active: true })
      if (!t.invisible) {
        t.invisible = true
        toHide.push(t.id)
      }
    }

    if (state.hideFoldedTabs && toHide.length && state.ffVer >= 61) {
      browser.tabs.hide(toHide)
    }
    dispatch('saveTabsTree')
  },

  /**
   * Show children of tab
   */
  expTabsBranch({ state, dispatch }, tabId) {
    const toShow = []
    const preserve = []
    const tab = state.tabsMap[tabId]
    if (!tab) return
    if (tab.invisible) dispatch('expTabsBranch', tab.parentId)
    for (let t of state.tabs) {
      if (state.autoFoldTabs && t.id !== tabId && t.isParent && !t.folded && tab.lvl === t.lvl) {
        dispatch('foldTabsBranch', t.id)
      }
      if (t.id === tabId) t.folded = false
      if (t.id !== tabId && t.folded) preserve.push(t.id)
      if (t.parentId === tabId || toShow.includes(t.parentId)) {
        if (t.invisible && (t.parentId === tabId || !preserve.includes(t.parentId))) {
          toShow.push(t.id)
          t.invisible = false
        }
      }
    }

    if (state.hideFoldedTabs && toShow.length && state.ffVer >= 61) {
      browser.tabs.show(toShow)
    }
    dispatch('saveTabsTree')
  },

  /**
   * Toggle tabs branch visability (fold/expand)
   */
  async toggleBranch({ state, dispatch }, tabId) {
    const rootTab = state.tabsMap[tabId]
    if (!rootTab) return
    if (rootTab.folded) dispatch('expTabsBranch', tabId)
    else dispatch('foldTabsBranch', tabId)
  },

  /**
   * Drop to tabs panel
   */
  async dropToTabs(
    { state, getters, dispatch },
    { event, dropIndex, dropParent, nodes, pin } = {}
  ) {
    const currentPanel = getters.panels[state.panelIndex]
    const destCtx = currentPanel.cookieStoreId
    const parent = state.tabsMap[dropParent]
    const toHide = []
    const toShow = []
    if (dropIndex === -1) dropIndex = currentPanel.endIndex + 1

    // Tabs or Bookmarks
    if (nodes && nodes.length) {
      let samePanel = nodes[0].ctx === currentPanel.id
      if (pin && currentPanel.panel !== 'TabsPanel') samePanel = true

      // Move tabs
      if (nodes[0].type === 'tab' && samePanel && !event.ctrlKey) {
        // Check if tabs was dropped to same place
        const inside = dropIndex > nodes[0].index && dropIndex <= nodes[nodes.length - 1].index
        const inFirst = nodes[0].id === dropParent
        const inLast = nodes[nodes.length - 1].id === dropParent
        if (inside || inFirst || inLast) return

        // Normalize dropIndex for tabs droped to the same panel
        // If dropIndex is greater that first tab index - decrease it by 1
        dropIndex = dropIndex <= nodes[0].index ? dropIndex : dropIndex - 1

        // Get dragged tabs
        const tabs = []
        for (let n of nodes) {
          let tab = state.tabsMap[n.id]
          if (!tab) return
          tabs.push(tab)
        }

        let pinTab = pin && !tabs[0].pinned
        let unpinTab = !pin && tabs[0].pinned

        // Unpin tab
        if (unpinTab) {
          for (let t of tabs) {
            await browser.tabs.update(t.id, { pinned: false })
          }
        }

        // Pin tab
        if (pinTab) {
          for (let t of tabs) {
            // Skip group tab
            if (t.url.startsWith('moz-extension')) continue
            // Flatten
            t.lvl = 0
            t.parentId = -1
            // Pin tab
            await browser.tabs.update(t.id, { pinned: true })
          }
        }

        // Move if target index is different or pinned state changed
        const moveIndexOk = tabs[0].index !== dropIndex && tabs[tabs.length - 1].index !== dropIndex
        if (moveIndexOk || pinTab || unpinTab) {
          state.movingTabs = tabs.map(t => t.id)
          browser.tabs.move([...state.movingTabs], { windowId: state.windowId, index: dropIndex })
        }

        // Update tabs tree
        if (state.tabsTree) {
          // Get parent tab parameters
          let parentId = parent ? parent.id : -1
          let parentLvl = parent ? parent.lvl : -1
          if (parentLvl === state.tabsTreeLimit) parentId = parent.parentId

          // Set first tab parentId and other parameters
          tabs[0].parentId = parentId
          if (parent && parent.folded) tabs[0].invisible = true
          else tabs[0].invisible = false

          // Get level offset for gragged branch
          let lvlOffset = tabs[0].lvl

          for (let i = 1; i < tabs.length; i++) {
            const prevTab = tabs[i - 1]
            const tab = tabs[i]

            // Above the limit
            if (parentLvl + tab.lvl - lvlOffset >= state.tabsTreeLimit) {
              tab.parentId = prevTab.parentId
              if (parent && parent.folded) tab.invisible = true
              else tab.invisible = false
              tab.folded = false
              continue
            }

            // Flat nodes below first node's level
            if (tabs[i].lvl <= lvlOffset) {
              tab.parentId = parentId
              tab.invisible = false
              tab.folded = false
            }

            // Update invisibility of tabs
            if (parent && parent.folded) {
              tab.invisible = true
              if (state.hideFoldedTabs && !tab.hidden) toHide.push(tab.id)
            } else if (tab.parentId === parentId) {
              tab.invisible = false
              if (state.hideFoldedTabs && tab.hidden) toShow.push(tab.id)
            }
          }

          // If there are no moving, just update tabs tree
          if (!moveIndexOk) {
            state.tabs = Utils.CalcTabsTreeLevels(state.tabs)
          }
        }

        // If first tab is not invisible, activate it
        if (!tabs[0].invisible) browser.tabs.update(tabs[0].id, { active: true })

        // Hide/Show tabs
        if (toHide.length) browser.tabs.hide(toHide)
        if (toShow.length) browser.tabs.show(toShow)
      } else {
        // Create new tabs
        const oldNewMap = []
        let opener = dropParent < 0 ? undefined : dropParent
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (node.type === 'separator') continue
          if (!state.tabsTree && node.type === 'folder') continue
          if (state.tabsTreeLimit > 0 && node.type === 'folder') continue

          const groupPageUrl = browser.runtime.getURL('group/group.html')
          if (oldNewMap[node.parentId] >= 0) opener = oldNewMap[node.parentId]
          const info = await browser.tabs.create({
            active: !(parent && parent.folded),
            cookieStoreId: destCtx,
            index: dropIndex + i,
            openerTabId: opener,
            url: node.url ? node.url : groupPageUrl + `#${encodeURI(node.title)}`,
            windowId: state.windowId,
            pinned: pin,
          })
          oldNewMap[node.id] = info.id
          if (state.tabsMap[info.id] && opener) {
            state.tabsMap[info.id].parentId = opener
          }
        }

        // Remove source tabs
        if (nodes[0].type === 'tab' && !event.ctrlKey) {
          const toRemove = nodes.map(n => n.id)
          state.removingTabs = [...toRemove]
          await browser.tabs.remove(toRemove)
        }

        // Update tabs tree if there are no tabs was deleted
        if (nodes[0].type !== 'tab' || event.ctrlKey) {
          state.tabs = Utils.CalcTabsTreeLevels(state.tabs)
        }
      }
    }

    // Native event
    if (!nodes) {
      const url = await Utils.GetUrlFromDragEvent(event)

      if (url && destCtx) {
        browser.tabs.create({
          active: true,
          url,
          index: dropIndex,
          openerTabId: dropParent < 0 ? undefined : dropParent,
          cookieStoreId: destCtx,
          windowId: state.windowId,
        })
      }
    }

    dispatch('saveTabsTree')
  },

  /**
   * Flatten tabs tree
   *
   * TODO: to mutations
   */
  flattenTabs({ state, dispatch }, tabIds) {
    // Gather children
    let minLvlTab = { lvl: 999 }
    const toFlat = [...tabIds]
    const ttf = tabIds.map(id => state.tabsMap[id])
    for (let tab of state.tabs) {
      if (tab.hidden) continue
      if (toFlat.includes(tab.id) && tab.lvl < minLvlTab.lvl) minLvlTab = tab
      if (toFlat.includes(tab.parentId)) {
        if (!toFlat.includes(tab.id)) {
          toFlat.push(tab.id)
          ttf.push(tab)
        }
        if (tab.lvl < minLvlTab.lvl) minLvlTab = tab
      }
    }

    if (!minLvlTab.parentId) return
    for (let tab of ttf) {
      tab.lvl = minLvlTab.lvl
      tab.parentId = minLvlTab.parentId
      tab.invisible = false
    }

    state.tabs = Utils.CalcTabsTreeLevels(state.tabs)
    dispatch('saveTabsTree', 250)
  },

  /**
   * Group tabs
   */
  async groupTabs({ state, dispatch }, tabIds) {
    // Check permissions
    const permitted = await browser.permissions.contains({ origins: ['<all_urls>'] })
    if (!permitted) {
      const url = browser.runtime.getURL('permissions/all-urls.html')
      browser.tabs.create({ url })
      return
    }

    // Get tabs
    const tabs = []
    for (let t of state.tabs) {
      if (tabIds.includes(t.id)) tabs.push(t)
      else if (tabIds.includes(t.parentId)) {
        tabIds.push(t.id)
        tabs.push(t)
      }
    }

    if (!tabs.length) return
    if (tabs[0].lvl >= state.tabsTreeLimit) return

    // Find title for group tab
    const titles = tabs.map(t => t.title)
    let commonPart = Utils.CommonSubStr(titles)
    let isOk = commonPart ? commonPart[0] === commonPart[0].toUpperCase() : false
    let groupTitle = commonPart
      .replace(/^(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+/g, ' ')
      .replace(/(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+$/g, ' ')
      .trim()

    if (!isOk || groupTitle.length < 4) {
      const hosts = tabs
        .filter(t => !t.url.startsWith('about:'))
        .map(t => t.url.split('/')[2])
      groupTitle = Utils.CommonSubStr(hosts)
      if (groupTitle.startsWith('.')) groupTitle = groupTitle.slice(1)
      groupTitle = groupTitle.replace(/^www\./, '')
    }

    if (!isOk || groupTitle.length < 4) {
      groupTitle = tabs[0].title
    }

    // Create hash id
    const hashId = `${groupTitle}:id:${Utils.Uid()}`

    // Find index and create group tab
    const groupTab = await browser.tabs.create({
      active: !(parent && parent.folded),
      cookieStoreId: tabs[0].cookieStoreId,
      index: tabs[0].index,
      openerTabId: tabs[0].parentId < 0 ? undefined : tabs[0].parentId,
      url: browser.runtime.getURL('group/group.html') + `#${encodeURI(hashId)}`,
      windowId: state.windowId,
    })

    // Update parent of selected tabs
    tabs[0].parentId = groupTab.id
    if (tabs[0].lvl + 1 === state.tabsTreeLimit) tabs[0].folded = false
    for (let i = 1; i < tabs.length; i++) {
      let prev = tabs[i - 1]
      let tab = tabs[i]

      if (state.tabsTreeLimit > 0 && tab.lvl + 1 > state.tabsTreeLimit) {
        tab.parentId = prev.parentId
        tab.folded = false
        tab.invisible = false
        continue
      }

      if (tab.lvl <= tabs[0].lvl) {
        tab.parentId = groupTab.id
        tab.folded = false
        tab.invisible = false
      }
    }
    state.tabs = Utils.CalcTabsTreeLevels(state.tabs)
    dispatch('saveTabsTree', 250)
  },

  /**
   * Get grouped tabs (for group page)
   */
  async getGroupInfo({ state }, groupId) {
    await Utils.Sleep(128)

    const idData = groupId.split(':id:')
    const title = idData[0]
    const id = idData[1]
    const groupTab = state.tabs.find(t => {
      if (id) return t.url.endsWith(id)
      else return t.title === title && t.url.startsWith('moz')
    })
    if (!groupTab) return {}

    const out = {
      id: groupTab.id,
      tabs: [],
    }

    for (let i = groupTab.index + 1; i < state.tabs.length; i++) {
      const tab = state.tabs[i]
      if (tab.lvl <= groupTab.lvl) break
      out.tabs.push({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        discarded: tab.discarded,
        favIconUrl: tab.favIconUrl,
      })
    }

    return out
  },

  /**
   * Update successorTabId of tabs
   */
  updateTabsSuccessors({ state, getters }) {
    if (state.ffVer < 65) return
    const toReset = []
    for (let panel of getters.panels) {
      // No tabs
      if (!panel.tabs || panel.tabs.length === 0) continue

      // Panel have 1 tab
      if (panel.tabs.length === 1) {
        if (panel.tabs[0].successorTabId >= 0) {
          panel.tabs[0].successorTabId = -1
          toReset.push(panel.tabs[0].id)
        }
        continue
      }

      // Check tabs above the last one
      for (let i = panel.tabs.length - 1; i--;) {
        if (panel.tabs[i].successorTabId >= 0) {
          panel.tabs[i].successorTabId = -1
          toReset.push(panel.tabs[i].id)
        }
      }

      // Update successor of last tab
      const penultTab = panel.tabs[panel.tabs.length - 2]
      const lastTab = panel.tabs[panel.tabs.length - 1]
      if (lastTab.successorTabId !== penultTab.id) {
        lastTab.successorTabId = penultTab.id
        browser.tabs.update(lastTab.id, { successorTabId: penultTab.id })
      }
    }

    for (let id of toReset) {
      browser.tabs.update(id, { successorTabId: -1 })
    }
  },
  updateTabsSuccessorsDebounced({ dispatch }, { timeout } = {}) {
    if (UpdateTabsSuccessorsTimeout) clearTimeout(UpdateTabsSuccessorsTimeout)
    UpdateTabsSuccessorsTimeout = setTimeout(() => dispatch('updateTabsSuccessors'), timeout)
  },

  /**
   * Create tab after another tab
   */
  createTabAfter({ state }, tabId) {
    // Get target tab
    const targetTab = state.tabsMap[tabId]
    if (!targetTab) return

    // Get index and parentId for new tab
    let parentId
    let index = targetTab.index + 1
    if (targetTab.isParent && !targetTab.folded) {
      parentId = targetTab.id
    } else {
      parentId = targetTab.parentId
      while (state.tabs[index] && state.tabs[index].lvl > targetTab.lvl) {
        index++
      }
    }
    if (parentId < 0) parentId = undefined

    browser.tabs.create({
      index,
      cookieStoreId: targetTab.cookieStoreId,
      windowId: state.windowId,
      openerTabId: parentId,
    })
  },
}
