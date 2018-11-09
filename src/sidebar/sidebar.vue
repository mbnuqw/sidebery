<template lang="pug">
.Sidebar(
  :data-menu="navMenuOpened"
  @wheel="onWH"
  @contextmenu.prevent.stop=""
  @dragover.prevent=""
  @dragenter="onDragEnter"
  @dragleave="onDragLeave"
  @drop="onDrop"
  @mouseenter="onME"
  @mouseleave="onML"
  @mousedown="onMD")
  ctx-menu
  window-input(:is-active="!!winChoosing")
  .bg(v-noise:300.g:12:af.a:0:42.s:0:9="", :style="bgPosStyle")
  .dimmer(@mousedown="closeMenu")
  .nav(ref="nav")
    keep-alive
      component.panel-menu(
        v-if="navMenu" 
        ref="menu"
        :is="navMenu.menu" 
        :conf="navMenu"
        @close="closeMenu"
        @height="recalcMenuHeight"
        @panel-cmd="panelCmd")

    .nav-strip(@wheel="onNavWheel")
      .panel-btn(
        v-for="(btn, i) in nav"
        :key="btn.cookieStoreId || btn.name"
        :title="btn.name"
        :loading="btn.loading"
        :data-active="panelIs(i)"
        :data-hidden="btn.hidden"
        @click="onNavClick(i)"
        @mousedown.right="openMenu(i)")
        svg(:style="{fill: btn.colorCode}")
          use(:xlink:href="'#' + btn.icon")
        .ok-badge
          svg: use(xlink:href="#icon_ok")
        .err-badge
          svg: use(xlink:href="#icon_err")
        .loading-spinner
          each n in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .spinner-stick(class='spinner-stick-' + n)

    //- Add new container
    .add-btn(v-if="!isPrivate", :title="t('sidebar.nav_add_ctx_title')", @click="openMenu(-1)")
      svg: use(xlink:href="#icon_plus_v2")

    //- Settings
    .settings-btn(:data-active="settingsOpened", :title="t('sidebar.nav_settings_title')", @click="toggleSettings")
      svg: use(xlink:href="#icon_settings")

  //- Panels
  .panel-box
    component.panel(
      v-for="(c, i) in panels"
      ref="panels"
      :key="c.cookieStoreId || c.name"
      :is="c.panel"
      :tabs="c.tabs"
      :store-id="c.cookieStoreId"
      :pos="getPanelPos(i)"
      :active="panelIs(i)"
      @create-tab="createTab"
      @ready="onPanelReady(i)"
      @panel-loading-start="onPanelLoadingStart(i)"
      @panel-loading-end="onPanelLoadingEnd(i)"
      @panel-loading-ok="onPanelLoadingOk(i)"
      @panel-loading-err="onPanelLoadingErr(i)"
      @closedown="closeTabsDown(i, $event)")
    settings-panel.panel(:pos="settingsPanelPos")
</template>


<script>
import Vue from 'vue'
import { mapGetters } from 'vuex'
import NoiseBg from '../directives/noise-bg.js'
import Utils from '../libs/utils.js'
import Logs from '../libs/logs.js'
import Store from './store'
import State from './store.state.js'
import { DEFAULT_PANELS } from './store.state'
import CtxMenu from './context-menu.vue'
import BookmarksPanel from './bookmarks.vue'
import TabsPanel from './tabs.vue'
import TabsDefaultMenu from './tabs.default.menu.vue'
import TabsMenu from './tabs.menu.vue'
import SettingsPanel from './settings.vue'
import WindowInput from './input.window.vue'

Vue.directive('noise', NoiseBg)

// --- Vue Component ---
export default {
  components: {
    CtxMenu,
    BookmarksPanel,
    TabsDefaultMenu,
    TabsPanel,
    SettingsPanel,
    WindowInput,
  },

  data() {
    return {
      width: 250,
      navMenuOpened: false,
      navMenu: null,
      settingsOpened: false,
      loading: [true],
      loadingTimers: [],
    }
  },

  /**
   * --- Computed ---
   */
  computed: {
    ...mapGetters(['winChoosing', 'isPrivate', 'defaultCtxId', 'panels']),

    /**
     * Background tranform style for parallax fx
     */
    bgPosStyle() {
      return { transform: `translateX(-${State.panelIndex * 5}%)` }
    },

    /**
     * Get settings-panel position
     */
    settingsPanelPos() {
      return this.settingsOpened ? 'center' : 'right'
    },

    /**
     * Get list of navigational buttons
     */
    nav() {
      let noPinned = !this.pinnedTabs.length
      let cap = ~~((this.width - 56) / 34)
      let halfCap = cap >> 1
      let invModCap = (cap % halfCap) ^ 1

      let i
      let k = 0
      let out = []
      let hideOffset = 0
      for (i = 0; i < DEFAULT_PANELS.length; i++, k++) {
        const btn = DEFAULT_PANELS[i]
        btn.loading = this.loading[i]
        btn.hidden = false
        if (noPinned && btn.pinned) {
          btn.hidden = true
          if (State.panelIndex > k) hideOffset++
        }
        if (!State.private && btn.private) {
          btn.hidden = true
          if (State.panelIndex > k) hideOffset++
        }
        if (State.private && btn.cookieStoreId === 'firefox-default') {
          btn.hidden = true
          if (State.panelIndex > k) hideOffset++
        }
        out.push(btn)
      }
      for (i = 0; i < State.ctxs.length; i++, k++) {
        const btn = State.ctxs[i]
        btn.loading = this.loading[k]
        if (State.private) {
          btn.hidden = true
          continue
        }
        if (!btn.menu) btn.menu = TabsMenu
        btn.hidden = false
        out.push(btn)
      }

      let p = State.panelIndex - hideOffset
      let vis = out.length - hideOffset
      for (i = 0, k = 0; i < out.length; i++) {
        if (out[i].hidden) continue
        if (p - k > halfCap && vis - k > cap) out[i].hidden = true
        if (p - k < invModCap - halfCap && k > cap - 1) out[i].hidden = true
        k++
      }

      return out
    },

    /**
     * Pinned tabs
     */
    pinnedTabs() {
      return State.tabs.filter(t => t.pinned)
    },
  },

  // watch: {
  //   panels(p) {
  //     console.log('[DEBUG] getter panels', p);
  //   }
  // },

  // --- Created Hook ---
  async created() {
    // --- Setup Hooks
    // Contextual Identities
    browser.contextualIdentities.onCreated.addListener(this.onCreatedContainer)
    browser.contextualIdentities.onRemoved.addListener(this.onRemovedContainer)
    browser.contextualIdentities.onUpdated.addListener(this.onUpdatedContainer)

    // Tabs
    browser.tabs.onCreated.addListener(this.onCreatedTab)
    browser.tabs.onUpdated.addListener(this.onUpdatedTab)
    browser.tabs.onRemoved.addListener(this.onRemovedTab)
    browser.tabs.onMoved.addListener(this.onMovedTab)
    browser.tabs.onDetached.addListener(this.onDetachedTab)
    browser.tabs.onAttached.addListener(this.onAttachedTab)
    browser.tabs.onActivated.addListener(this.onActivatedTab)

    // --- Retrieve initial state
    await this.loadContexts()
    await this.loadTabs()

    // --- Handle resizing of sidebar
    const onresize = Utils.Asap(() => this.updateNavSize(), 120)
    window.addEventListener('resize', onresize.func)
  },

  // --- Mounted Hook ---
  mounted() {
    this.updateNavSize()
  },

  beforeDestroy() {
    // Contextual Identities
    browser.contextualIdentities.onCreated.removeListener(this.onCreatedContainer)
    browser.contextualIdentities.onRemoved.removeListener(this.onRemovedContainer)
    browser.contextualIdentities.onUpdated.removeListener(this.onUpdatedContainer)

    // Tabs
    browser.tabs.onCreated.removeListener(this.onCreatedTab)
    browser.tabs.onUpdated.removeListener(this.onUpdatedTab)
    browser.tabs.onRemoved.removeListener(this.onRemovedTab)
    browser.tabs.onMoved.removeListener(this.onMovedTab)
    browser.tabs.onDetached.removeListener(this.onDetachedTab)
    browser.tabs.onAttached.removeListener(this.onAttachedTab)
    browser.tabs.onActivated.removeListener(this.onActivatedTab)
  },

  /**
   * --- Methods ---
   */
  methods: {
    /**
     * Sidebar wheel event handler
     */
    onWH(e) {
      if (State.scrollThroughTabs !== 'none' && State.panelIndex > 0) {
        const globaly = State.scrollThroughTabs === 'global'
        if (e.deltaY > 0) {
          if (this.wheelBlockTimeout) return
          this.activateNextTab({ globaly, cycle: false })
        }
        if (e.deltaY < 0) {
          if (this.wheelBlockTimeout) return
          this.activatePrevTab({ globaly, cycle: false })
        }
      }

      if (State.hScrollThroughPanels) {
        if (e.deltaX > 0) return this.switchToNextPanel()
        if (e.deltaX < 0) return this.switchToPrevPanel()
      }
    },

    /**
     * Navigation wheel event handler
     */
    onNavWheel(e) {
      if (e.deltaY > 0) return this.switchToNextPanel()
      if (e.deltaY < 0) return this.switchToPrevPanel()
    },

    /**
     * Mouse enter event handler
     */
    onME() {
      if (this.leaveTimeout) {
        clearTimeout(this.leaveTimeout)
        this.leaveTimeout = null
      }
    },

    /**
     * Mouse leave event handler
     */
    onML() {
      this.leaveTimeout = setTimeout(() => {
        Store.commit('closeCtxMenu')
      }, 500)
    },

    /**
     * Mouse down event handler
     */
    onMD(e) {
      if (e.button === 1) {
        if (this.wheelBlockTimeout) {
          clearTimeout(this.wheelBlockTimeout)
          this.wheelBlockTimeout = null
        }
        this.wheelBlockTimeout = setTimeout(() => {
          this.wheelBlockTimeout = null
        }, 500)
      }
      if (e.button < 2) Store.commit('closeCtxMenu')
    },

    /**
     * Drag enter event handler
     */
    onDragEnter() {
      // console.log('[DEBUG] DRAG ENTER', e.dataTransfer);
    },

    /**
     * Drag leave event handler
     */
    onDragLeave() {
      // console.log('[DEBUG] DRAG LEAVE', e.dataTransfer);
    },

    /**
     * Drop event handler
     */
    onDrop(e) {
      if (!e.dataTransfer) return

      for (let item of e.dataTransfer.items) {
        if (item.kind !== 'string') return
        
        if (item.type === 'text/uri-list') {
          item.getAsString(s => {
            if (s.indexOf('http') === -1) return
            const panel = this.panels[State.panelIndex]
            if (panel && panel.cookieStoreId) {
              browser.tabs.create({
                url: s,
                cookieStoreId: panel.cookieStoreId,
                windowId: State.windowId,
              })
            } else {
              browser.tabs.create({ url: s, windowId: State.windowId })
            }
          })
        }

        if (item.type === 'text/x-moz-text-internal') {
          item.getAsString(async s => {
            if (e.dataTransfer.dropEffect === 'move') {
              const tabs = await browser.tabs.query({
                url: s,
                currentWindow: false,
                lastFocusedWindow: true,
              })
              if (tabs.length === 0) return
              if (tabs[0].url.indexOf('http') === -1) return
              browser.tabs.move(tabs[0].id, { windowId: State.windowId, index: -1 })
            }
            if (e.dataTransfer.dropEffect === 'copy') {
              if (s.indexOf('http') === -1) return
              browser.tabs.create({ windowId: State.windowId, url: s })
            }
          })
          break
        }
      }
    },

    /**
     * Navigation button click hadler
     */
    onNavClick(i) {
      if (State.panelIndex !== i) {
        this.switchToPanel(i)
      } else if (this.panels[i].cookieStoreId) {
        browser.tabs.create({ cookieStoreId: this.panels[i].cookieStoreId })
      }
    },

    // --- Contextual Identities Hooks ---
    /**
     * contextualIdentities.onCreated
     */
    onCreatedContainer({ contextualIdentity }) {
      Logs.D(`New container created '${contextualIdentity.cookieStoreId}'`)
      let i = State.ctxs.push(contextualIdentity)
      State.panelIndex = i + 3
      State.lastPanelIndex = State.panelIndex

      // Check if we have some updates
      // for container with this name
      this.$root.resyncPanels()
    },

    /**
     * contextualIdentities.onRemoved
     */
    async onRemovedContainer({ contextualIdentity }) {
      Logs.D(`Container removed '${contextualIdentity.cookieStoreId}'`)
      let id = contextualIdentity.cookieStoreId
      let i = State.ctxs.findIndex(c => c.cookieStoreId === id)
      if (i === -1) return
      State.ctxs.splice(i, 1)

      // Turn off sync
      let pi = State.syncPanels.findIndex(p => p === id)
      if (pi !== -1) State.syncPanels.splice(pi, 1)

      // Close tabs
      let orphanTabs = await browser.tabs.query({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        cookieStoreId: id,
      })
      if (orphanTabs.length > 0) {
        await browser.tabs.remove(orphanTabs.map(t => t.id))
      } else {
        Store.commit('setPanel', i + 3)
      }
    },

    /**
     * contextualIdentities.onUpdated
     */
    onUpdatedContainer({ contextualIdentity }) {
      Logs.D(`Container updated '${contextualIdentity.cookieStoreId}'`)
      let id = contextualIdentity.cookieStoreId
      let i = State.ctxs.findIndex(c => c.cookieStoreId === id)
      if (i === -1) return
      State.ctxs.splice(i, 1, contextualIdentity)
      this.$root.savePanels()
    },
    // ---

    // --- Tabs Handlers ---
    /**
     * tabs.onCreated
     */
    onCreatedTab(tab) {
      if (tab.windowId !== State.windowId) return
      Logs.D(`Tab created, id: '${tab.id}', index: '${tab.index}', ctx: '${tab.cookieStoreId}'`)
      Store.commit('closeCtxMenu')

      // If new tab is out of panel, move it to the end of
      // this panel
      let panel = this.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
      if (panel && panel.tabs) {
        let endIndex = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex
        if (tab.index > endIndex || tab.index < panel.startIndex) {
          browser.tabs.move(tab.id, { index: endIndex })
        }
      }

      // Shift tabs after inserted one. (NOT detected by vue)
      for (let i = tab.index; i < State.tabs.length; i++) {
        State.tabs[i].index++
      }
      State.tabs.splice(tab.index, 0, tab)
      this.recalcPanelScroll()
      this.$root.savePanels()
    },

    /**
     * tabs.onUpdated
     */
    onUpdatedTab(tabId, change, tab) {
      if (tab.windowId !== State.windowId) return
      let upIndex = State.tabs.findIndex(t => t.id === tabId)
      if (upIndex === -1) return

      // Handle favicon change
      // If favicon is not external link - store it in cache
      if (change.favIconUrl && change.favIconUrl.indexOf('http') !== 0) {
        const hostname = tab.url.split('/')[2]
        Store.dispatch('setFavicon', { hostname, icon: change.favIconUrl })
      }

      // Handle unpinned tab
      if (change.hasOwnProperty('pinned') && !change.pinned) {
        let pi = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
        if (pi === -1) return
        let p = this.panels[pi]
        if (p && p.tabs) browser.tabs.move(tabId, { index: p.endIndex })
        if (tab.active) Store.commit('setPanel', pi)
      }

      State.tabs.splice(upIndex, 1, tab)

      if (change.hasOwnProperty('pinned') && change.pinned) {
        if (tab.active) Store.commit('setPanel', 1)
      }

      if (change.hasOwnProperty('url') || change.hasOwnProperty('pinned')) {
        this.$root.savePanels()
      }
    },

    /**
     * tabs.onRemoved
     */
    onRemovedTab(tabId, info) {
      if (info.windowId !== State.windowId) return
      Logs.D(`Tab removed, id: '${tabId}'`)
      Store.commit('closeCtxMenu')
      let rmIndex = State.tabs.findIndex(t => t.id === tabId)
      if (rmIndex === -1) return

      // Shift tabs after removed one. (NOT detected by vue)
      for (let i = rmIndex + 1; i < State.tabs.length; i++) {
        State.tabs[i].index--
      }
      State.tabs.splice(rmIndex, 1)
      // ......
      const panelIndex = State.activeTabs.findIndex(id => id === tabId)
      if (panelIndex >= 0) State.activeTabs[panelIndex] = null
      // ........
      this.recalcPanelScroll()
      this.$root.savePanels()
    },

    /**
     * tabs.onMoved
     */
    onMovedTab(id, info) {
      if (info.windowId !== State.windowId) return
      Logs.D(`Tab moved, id: '${id}', from: '${info.fromIndex}', to: '${info.toIndex}'`)
      Store.commit('closeCtxMenu')

      // If moved tab active, cut it out
      let pIndex = this.getPanelIndex(id)
      let isActive = State.activeTabs[pIndex] === id

      // Reset drag status
      let panelVM = this.$refs.panels[State.panelIndex]
      if (panelVM && panelVM.drag) {
        panelVM.drag = null
        setTimeout(() => {
          panelVM.dragTabs = null
          panelVM.dragEnd = false
        }, 128)
      }

      // Move tab in tabs array
      let movedTab = State.tabs.splice(info.fromIndex, 1)[0]
      if (!movedTab) return
      movedTab.index = info.toIndex
      // Shift tabs after moved one. (NOT detected by vue)
      for (let i = 0; i < State.tabs.length; i++) {
        if (i < info.toIndex) State.tabs[i].index = i
        else State.tabs[i].index = i + 1
      }
      State.tabs.splice(info.toIndex, 0, movedTab)

      // Update active tab position
      pIndex = this.getPanelIndex(id)
      if (isActive) Store.commit('setPanel', pIndex)
      this.recalcPanelScroll()
    },

    /**
     * tabs.onDetached
     */
    onDetachedTab(id, info) {
      if (info.oldWindowId !== State.windowId) return
      Logs.D(`Tab detached, id: '${id}'`)
      Store.commit('closeCtxMenu')
      let i = State.tabs.findIndex(t => t.id === id)
      if (i === -1) return
      State.tabs.splice(i, 1)
      this.recalcPanelScroll()
      this.$root.savePanels()
    },

    /**
     * tabs.onAttached
     */
    onAttachedTab(id, info) {
      if (info.newWindowId !== State.windowId) return
      Logs.D(`Tab attached, id: '${id}'`)
      Store.commit('closeCtxMenu')
      this.loadTabs()
      this.$root.savePanels()
    },

    /**
     * tabs.onActivated
     */
    onActivatedTab(info) {
      if (info.windowId !== State.windowId) return
      Logs.D(`Tab activated, id: '${info.tabId}'`)
      for (let i = 0; i < State.tabs.length; i++) {
        State.tabs[i].active = info.tabId === State.tabs[i].id
      }
      // State.tabs = State.tabs.map(t => {
      //   t.active = info.tabId === t.id
      //   return t
      // })

      // Switch to tab's panel
      let tab = State.tabs.find(t => t.id === info.tabId)
      let panelIndex = -1
      if (tab && !tab.pinned) {
        panelIndex = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
        if (panelIndex === -1) return
      }
      if (tab && tab.pinned) panelIndex = 1
      if (panelIndex > 0 && this.panel !== panelIndex) {
        Store.commit('setPanel', panelIndex)
      }

      State.activeTabs[panelIndex] = info.tabId
    },

    onPanelReady(i) {
      this.onPanelLoadingEnd(i)
    },

    onPanelLoadingStart(i) {
      this.loading[i] = true
      this.loading = [...this.loading]
      if (this.loadingTimers[i]) {
        clearTimeout(this.loadingTimers[i])
        this.loadingTimers[i] = null
      }
    },

    onPanelLoadingEnd(i) {
      this.loading[i] = false
      this.loading = [...this.loading]
    },

    onPanelLoadingOk(i) {
      this.loading[i] = 'ok'
      this.loading = [...this.loading]
      this.loadingTimers[i] = setTimeout(() => {
        this.onPanelLoadingEnd(i)
        this.loadingTimers[i] = null
      }, 2000)
    },

    onPanelLoadingErr(i) {
      this.loading[i] = 'err'
      this.loading = [...this.loading]
      this.loadingTimers[i] = setTimeout(() => {
        this.onPanelLoadingEnd(i)
        this.loadingTimers[i] = null
      }, 2000)
    },
    // ---

    /**
     * Check current panel's index
     */
    panelIs(index) {
      return State.panelIndex === index
    },

    /**
     * Try to recalc panel's scroll
     */
    async recalcPanelScroll() {
      const panelVM = this.$refs.panels[this.panel]
      if (panelVM && panelVM.recalcScroll) {
        await this.$nextTick()
        panelVM.recalcScroll()
      }
    },

    /**
     * Update active tab for panel
     */
    updateActiveTab(i, tabs) {
      let active = tabs.find(t => t.active)
      if (active) {
        // Update active tab
        State.activeTabs[i] = active.id
      } else {
        // Remove tab from list of active tabs
        // if it no longer exists
        let lastActive = State.activeTabs[i]
        if (lastActive && !tabs.find(t => t.id === lastActive)) {
          State.activeTabs[i] = null
        }
      }
    },

    /**
     * Get panel index of tab
     */
    getPanelIndex(tabId) {
      if (tabId === null) {
        let t = State.tabs.find(t => t.active)
        if (!t) return
        tabId = t.id
      }
      let panelIndex = this.panels.findIndex(p => {
        if (p.tabs && p.tabs.length) {
          return !!p.tabs.find(t => t.id === tabId)
        }
      })
      return panelIndex
    },

    /**
     * Get range info of panel by cookieStoreId
     * returns: [tab-length, start, end] or null
     */
    getPanelRangeInfo(ctxId) {
      let panel = this.panels.find(p => p.cookieStoreId === ctxId)
      if (!panel) return null
      return [panel.tabs.length, panel.startIndex, panel.endIndex]
    },

    /**
     * Create new tab
     */
    createTab(ctxId) {
      if (!ctxId) return
      let p = this.panels.find(p => p.cookieStoreId === ctxId)
      if (!p || !p.tabs) return
      let index = p.tabs.length ? p.endIndex + 1 : p.startIndex
      browser.tabs.create({ index, cookieStoreId: ctxId })
    },

    removeTab(tab) {
      let p = this.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
      if (!p || !p.tabs) return
      if (tab.index === p.endIndex && p.tabs.length > 1) {
        let prevTab = State.tabs[p.endIndex - 1]
        browser.tabs.update(prevTab.id, { active: true })
        this.$nextTick(() => {
          browser.tabs.remove(tab.id)
        })
      } else {
        browser.tabs.remove(tab.id)
      }
    },

    /**
     * Switch current active panel by index
     */
    switchToPanel(index) {
      if (this.settingsOpened) this.closeSettings()
      Store.commit('closeCtxMenu')
      Store.commit('setPanel', index)
      if (this.navMenuOpened) this.openMenu(State.panelIndex)
      if (State.createNewTabOnEmptyPanel) {
        let panel = this.panels[State.panelIndex]
        if (panel.tabs && panel.tabs.length === 0) this.createTab(panel.cookieStoreId)
      }

      if (State.activateLastTabOnPanelSwitching) {
        this.activateLastActiveTabOf(State.panelIndex)
      }

      this.recalcPanelScroll()
    },

    /**
     * Switch to next panel
     */
    async switchToNextPanel() {
      // Debounce switching
      if (this.switchPanelPause) return
      this.switchPanelPause = setTimeout(() => {
        clearTimeout(this.switchPanelPause)
        this.switchPanelPause = null
      }, 128)

      Logs.D(`Switch to next panel, current: ${State.panelIndex}`)

      Store.commit('closeCtxMenu')
      if (this.settingsOpened) {
        this.closeSettings()
        State.panelIndex = State.lastPanelIndex
        return
      }

      if (State.panelIndex < this.panels.length - 1) State.panelIndex++
      let i = State.panelIndex
      while (this.panels[i].hidden) {
        if (i >= this.panels.length - 1) {
          i = State.panelIndex - 1
          break
        }
        i++
      }
      State.panelIndex = i
      if (State.skipEmptyPanels) {
        for (let i = State.panelIndex; i < this.panels.length; i++) {
          if (this.panels[i].tabs && this.panels[i].tabs.length) {
            State.panelIndex = i
            break
          }
        }
      }
      State.lastPanelIndex = State.panelIndex

      if (State.activateLastTabOnPanelSwitching) {
        this.activateLastActiveTabOf(State.panelIndex)
      }

      if (this.navMenuOpened) this.openMenu(State.panelIndex)
      if (State.createNewTabOnEmptyPanel) {
        let panel = this.panels[State.panelIndex]
        if (panel.tabs && panel.tabs.length === 0) this.createTab(panel.cookieStoreId)
      }

      this.recalcPanelScroll()
    },

    /**
     * Switch to previous panel
     */
    async switchToPrevPanel() {
      // Debounce switching
      if (this.switchPanelPause) return
      this.switchPanelPause = setTimeout(() => {
        clearTimeout(this.switchPanelPause)
        this.switchPanelPause = null
      }, 128)

      Logs.D(`Switch to prev panel, current: ${State.panelIndex}`)

      Store.commit('closeCtxMenu')
      if (this.settingsOpened) {
        this.closeSettings()
        State.panelIndex = State.lastPanelIndex
        return
      }

      if (State.panelIndex < 0) State.panelIndex = 0
      if (State.panelIndex > 0) State.panelIndex--
      while (this.panels[State.panelIndex].hidden) {
        State.panelIndex--
      }
      if (State.skipEmptyPanels) {
        for (let i = State.panelIndex; i--; ) {
          if (this.panels[i].tabs && this.panels[i].tabs.length) {
            State.panelIndex = i
            break
          }
        }
      }
      State.lastPanelIndex = State.panelIndex

      if (State.activateLastTabOnPanelSwitching) {
        this.activateLastActiveTabOf(State.panelIndex)
      }

      if (this.navMenuOpened) this.openMenu(State.panelIndex)
      if (State.createNewTabOnEmptyPanel) {
        let panel = this.panels[State.panelIndex]
        if (panel.tabs && panel.tabs.length === 0) this.createTab(panel.cookieStoreId)
      }

      this.recalcPanelScroll()
    },

    /**
     * Activate last active tab on the panel
     */
    activateLastActiveTabOf(panelIndex) {
      const tabId = State.activeTabs[panelIndex]
      const p = this.panels[panelIndex]
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
     * Get position class for panel by index.
     */
    getPanelPos(i) {
      if (this.settingsOpened) return 'left'
      if (State.panelIndex < i) return 'right'
      if (State.panelIndex === i) return 'center'
      if (State.panelIndex > i) return 'left'
    },

    // --- Menu ---
    /**
     * Open panel menu by nav index.
     */
    async openMenu(i) {
      if (this.settingsOpened) this.closeSettings()
      Store.commit('closeCtxMenu')
      this.navMenuOpened = true
      State.panelIndex = i
      if (i >= 0) State.activePanel = State.panelIndex
      if (i === -1) this.navMenu = { menu: TabsMenu, new: true }
      else if (i >= 0) this.navMenu = { ...this.nav[i] }

      await this.$nextTick()
      if (this.$refs.menu && this.$refs.menu.open) this.$refs.menu.open()
      let h = this.$refs.menu.$el.offsetHeight
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    async recalcMenuHeight() {
      await this.$nextTick()
      if (!this.navMenuOpened) return
      let h = this.$refs.menu ? this.$refs.menu.$el.offsetHeight : 336
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    /**
     * Close panel menu.
     */
    closeMenu() {
      this.navMenuOpened = false
      if (State.panelIndex < 0 && State.lastPanelIndex >= 0) {
        State.panelIndex = State.lastPanelIndex
      }
      this.$refs.nav.style.transform = 'translateY(0px)'
      setTimeout(() => (this.navMenu = null), 120)
    },
    // ---

    // --- Settings ---
    /**
     * Open settings panel.
     */
    openSettings() {
      if (this.navMenuOpened) this.closeMenu()
      Store.commit('closeCtxMenu')
      State.lastPanelIndex = State.panelIndex
      State.panelIndex = -2
      this.settingsOpened = true
    },

    /**
     * Toggle settings
     */
    toggleSettings() {
      if (this.settingsOpened) this.closeSettings()
      else this.openSettings()
    },

    /**
     * Close settings panel and return to last one.
     */
    closeSettings() {
      this.settingsOpened = false
      State.panelIndex = State.lastPanelIndex
    },
    // ---

    /**
     * Run command in panel
     */
    panelCmd(name, func, ...args) {
      let i = this.panels.findIndex(p => p.name === name)
      if (i === -1) return
      if (this.$refs.panels[i][func]) this.$refs.panels[i][func](...args)
    },

    /**
     * Update sidebar width value.
     */
    updateNavSize() {
      if (this.width !== window.innerWidth) this.width = window.innerWidth
    },

    /**
     * Load Contextual Identities
     */
    async loadContexts() {
      State.ctxs = await browser.contextualIdentities.query({})
    },

    /**
     * Load all tabs for current window
     */
    async loadTabs() {
      const windowId = browser.windows.WINDOW_ID_CURRENT
      const tabs = await browser.tabs.query({ windowId })

      // Check order of tabs and get moves for normalizing
      const ctxs = [this.defaultCtxId].concat(State.ctxs.map(ctx => ctx.cookieStoreId))
      const moves = []
      let index = 0
      let offset = 0
      for (let i = 0; i < ctxs.length; i++) {
        const ctx = ctxs[i]
        for (let j = 0; j < tabs.length; j++) {
          const tab = tabs[j]
          if (tab.cookieStoreId !== ctx) continue

          if (tab.pinned) {
            index++
            continue
          }

          if (index !== tab.index + offset) {
            moves.push([tab.id, index])
            offset++
          }
          index++
        }
      }

      // Ask user for normalizing
      // ...

      State.tabs = tabs

      // Normalize order
      moves.map(async move => {
        await browser.tabs.move(move[0], { index: move[1] })
      })
    },

    activateNextTab({ globaly, cycle }) {
      if (this.switchTabPause) return
      this.switchTabPause = setTimeout(() => {
        clearTimeout(this.switchTabPause)
        this.switchTabPause = null
      }, 50)

      let tabs = globaly ? State.tabs : this.panels[State.panelIndex].tabs
      if (!tabs || !tabs.length) return

      let current = tabs.findIndex(t => t.active)

      let next = current + 1
      if (next >= tabs.length) {
        if (cycle) next = 0
        else return
      }

      browser.tabs.update(tabs[next].id, { active: true })
    },

    activatePrevTab({ globaly, cycle }) {
      if (this.switchTabPause) return
      this.switchTabPause = setTimeout(() => {
        clearTimeout(this.switchTabPause)
        this.switchTabPause = null
      }, 50)

      let tabs = globaly ? State.tabs : this.panels[State.panelIndex].tabs
      if (!tabs || !tabs.length) return

      let current = tabs.findIndex(t => t.active)
      if (current < 0) current = tabs.length

      let prev = current - 1
      if (prev < 0) {
        if (cycle) prev = tabs.length - 1
        else return
      }

      browser.tabs.update(tabs[prev].id, { active: true })
    },

    closeTabsDown(panelIndex, tabIndex) {
      const panel = this.panels[panelIndex]
      if (!panel) return

      if (!panel.tabs || !panel.tabs[tabIndex]) return
      const tabs = panel.tabs.slice(tabIndex)
      if (panel.tabs[tabIndex - 1] && tabs.find(t => t.active)) {
        browser.tabs.update(panel.tabs[tabIndex - 1].id, { active: true })
      }

      browser.tabs.remove(tabs.map(t => t.id))
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

NAV_HEIGHT = 32px
NAV_BTN_WIDTH = 34px
NAV_CTRL_WIDTH = 28px
NAV_CONF_HEIGHT = auto

.Sidebar
  box(relative, flex)
  size(100%, same)
  flex-direction: column
  overflow: hidden

  &[data-menu]
    > .dimmer
      z-index: 999
      opacity: 1
    .panel-menu
      opacity: 1
      transition: opacity var(--d-fast), z-index var(--d-fast)
    .panel-btn[data-active="true"]
      flex-grow: 10
      transition: flex var(--d-fast)

// --- Parallaxed background ---
.Sidebar > .bg
  box(absolute)
  size(200%, 100%)
  transition: transform var(--d-fast)

// --- Dimmer layer ---
.Sidebar > .dimmer
  box(absolute)
  pos(0, 0)
  size(100%, same)
  background-color: #24242464
  z-index: -1
  opacity: 0
  transition: z-index var(--d-fast), opacity var(--d-fast)

// --- Nav panel ---
.Sidebar > .nav
  box(relative, flex)
  size(100%, NAV_HEIGHT)
  z-index: 1000
  transform: translateY(0)
  transition: transform var(--d-fast)

.Sidebar .panel-menu
  box(absolute)
  pos(b: 0, l: 0)
  size(100%, NAV_CONF_HEIGHT)
  padding: 300px 0 36px
  background-color: var(--c-bg)
  box-shadow: 0 1px 12px 0 #00000056, 0 1px 0 0 #00000012
  opacity: 0
  z-index: 0
  transition: opacity var(--d-fast) .03s, z-index var(--d-fast)

.Sidebar .nav-strip
  box(relative, flex)
  flex-grow: 1
  overflow: hidden

.Sidebar .panel-btn
  box(relative, flex)
  size(NAV_BTN_WIDTH, NAV_HEIGHT, max-w: 34px)
  justify-content: center
  align-items: center
  flex-shrink: 0
  opacity: var(--nav-btn-opacity)
  z-index: 10
  transition: opacity var(--d-fast), width var(--d-fast), z-index var(--d-fast)
  &[data-active="true"]
    opacity: var(--nav-btn-activated-opacity)
  &:hover
    opacity: var(--nav-btn-opacity-hover)
  &:active
    opacity: var(--nav-btn-opacity-active)
    transition: none
  &[data-hidden="true"]
    size(0)
    opacity: 0
    z-index: -1
  &[loading="true"]
    cursor: progress
    > .loading-spinner
      opacity: 1
  &[loading="ok"]
    > .ok-badge
      opacity: 1
      transform: scale(1, 1)
  &[loading="err"]
    > .err-badge
      opacity: 1
      transform: scale(1, 1)
  &[loading]
    > svg
      mask: radial-gradient(
        circle at calc(100% - 2px) calc(100% - 2px),
        #00000032,
        #00000032 7px,
        #000000 8px,
        #000000
      )

.Sidebar .panel-btn > svg
  box(absolute)
  size(16px, same)
  fill: var(--nav-btn-fg)
  transform: translateZ(0)
  transition: opacity var(--d-fast)

.Sidebar .panel-btn > .loading-spinner
  box(absolute)
  size(11px, same)
  pos(b: 5px, r: 6px)
  border-radius: 50%
  opacity: 0
  transition: opacity var(--d-norm)

  > .spinner-stick
    box(absolute)
    size(1px, 3px)
    pos(calc(50% - 1px), calc(50% - 1px))
    transform-origin: 50% 0%
    opacity: 0

    &:before
      box(absolute)
      pos(2.5px, 0)
      size(100%, same)
      background-color: #278dff
      content: ''
  for i in 0..12
    > .spinner-stick-{i}
      transform: rotateZ((i * 30)deg)
      // animation: loading-spin .6s (i*50)ms infinite

.Sidebar .panel-btn > .ok-badge
.Sidebar .panel-btn > .err-badge
  box(absolute)
  size(9px, same)
  pos(b: 6px, r: 7px)
  border-radius: 50%
  opacity: 0
  transform: scale(0.7, 0.7)
  transition: opacity var(--d-norm), transform var(--d-norm)
  > svg
    box(absolute)
    size(100%, same)

.Sidebar .panel-btn > .ok-badge > svg
  fill: #43D043

.Sidebar .panel-btn > .err-badge > svg
  fill: #DB2216

.Sidebar .add-btn
.Sidebar .settings-btn
  box(relative, flex)
  size(NAV_CTRL_WIDTH, NAV_HEIGHT)
  justify-content: center
  align-items: center
  flex-shrink: 0
  &:hover > svg
    opacity: .7
  &:active > svg
    transition: none
    opacity: .4
  > svg
    box(absolute)
    size(16px, same)
    fill: var(--c-act-fg)
    opacity: .4
    transition: opacity var(--d-fast)

.Sidebar .add-btn
  margin: 0 0 0 auto
.Sidebar .settings-btn
  margin: 0 3px 0 0
  &[data-active="true"]
    > svg
      opacity: 1

// --- Panel ---
.Sidebar > .panel-box
  box(relative)
  flex-grow: 2

.Sidebar .panel
  box(absolute)
  pos(0, 0)
  size(100%, same)
  transition: transform var(--d-fast), opacity var(--d-fast), z-index var(--d-fast)
  opacity: 0
  z-index: 0
  &[pos="center"]
    z-index: 10
    opacity: 1
    transform: translateX(0)
  &[pos="left"]
    transform: translateX(-100%)
  &[pos="right"]
    transform: translateX(100%)

@keyframes loading-spin
  0%
    opacity: 1
  100%
    opacity: 0
</style>
