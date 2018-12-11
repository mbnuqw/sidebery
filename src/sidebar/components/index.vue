<template lang="pug">
.Sidebar(
  :menu-opened="isPanelMenuOpened"
  @wheel="onWH"
  @contextmenu.prevent.stop=""
  @dragover.prevent=""
  @drop="onDrop"
  @mouseenter="onME"
  @mouseleave="onML"
  @mousedown="onMD")
  ctx-menu
  window-input(:is-active="!!winChoosing")
  snapshots-list
  .bg(v-noise:300.g:12:af.a:0:42.s:0:9="", :style="bgPosStyle")
  .dimmer(@mousedown="closePanelMenu")
  .nav(ref="nav")
    keep-alive
      component.panel-menu(
        v-if="panelMenu" 
        ref="menu"
        :is="panelMenu.menu" 
        :conf="panelMenu"
        @close="closePanelMenu"
        @height="recalcPanelMenuHeight")

    .nav-strip(@wheel="onNavWheel")
      .panel-btn(
        v-for="(btn, i) in nav"
        :key="btn.cookieStoreId || btn.name"
        :title="getTooltip(i)"
        :loading="btn.loading"
        :updated="btn.updated"
        :proxified="btn.proxified"
        :data-active="panelIs(i)"
        :data-hidden="btn.hidden"
        @click="onNavClick(i)"
        @mousedown.right="openPanelMenu(i)")
        svg(:style="{fill: btn.colorCode}")
          use(:xlink:href="'#' + btn.icon")
        .proxy-badge
          svg: use(xlink:href="#icon_proxy")
        .update-badge
        .ok-badge
          svg: use(xlink:href="#icon_ok")
        .err-badge
          svg: use(xlink:href="#icon_err")
        .loading-spinner
          each n in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .spinner-stick(class='spinner-stick-' + n)

    //- Add new container
    .add-btn(
      v-if="!isPrivate"
      :title="t('sidebar.nav_add_ctx_title')"
      @click="openPanelMenu(-1)")
      svg: use(xlink:href="#icon_plus_v2")

    //- Settings
    .settings-btn(
      :data-active="$store.state.settingsOpened"
      :title="t('sidebar.nav_settings_title')"
      @click="toggleSettings")
      svg: use(xlink:href="#icon_settings")

  //- Panels
  .panel-box
    component.panel(
      v-for="(c, i) in panels"
      ref="panels"
      :key="c.cookieStoreId || c.name"
      :is="c.panel"
      :tabs="c.tabs"
      :index="i"
      :store-id="c.cookieStoreId"
      :pos="getPanelPos(i)"
      :active="panelIs(i)"
      @create-tab="createTab")
    settings-panel.panel(:pos="settingsPanelPos")
</template>


<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import NoiseBg from '../../directives/noise-bg.js'
import Utils from '../../libs/utils.js'
import Logs from '../../libs/logs.js'
import EventBus from '../event-bus'
import Store from '../store'
import State, { DEFAULT_PANELS, DEFAULT_CTX } from '../store.state.js'
import CtxMenu from './context-menu'
import BookmarksPanel from './bookmarks'
import TabsPanel from './tabs'
import TabsDefaultMenu from './tabs.default.menu'
import TabsMenu from './tabs.menu'
import SettingsPanel from './settings'
import WindowInput from './input.window'
import SnapshotsList from './snapshots-list'

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
    SnapshotsList,
  },

  data() {
    return {
      width: 250,
      panelMenu: null,
      loading: [],
      loadingTimers: [],
    }
  },

  /**
   * --- Computed ---
   */
  computed: {
    ...mapGetters(['winChoosing', 'isPrivate', 'defaultCtxId', 'panels', 'activePanel']),

    isPanelMenuOpened() {
      return !!State.panelMenuOpened
    },

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
      return State.settingsOpened ? 'center' : 'right'
    },

    /**
     * Get list of navigational buttons
     */
    nav() {
      let cap = ~~((this.width - 56) / 34)
      let halfCap = cap >> 1
      let invModCap = (cap % halfCap) ^ 1

      let i, k
      let out = []
      let hideOffset = 0
      for (i = 0, k = 0; i < DEFAULT_PANELS.length; i++, k++) {
        const btn = DEFAULT_PANELS[i]
        btn.loading = this.loading[i]
        btn.hidden = false
        if (
          !this.anyPinnedTabs && btn.pinned
          || !State.private && btn.private
          || State.private && btn.cookieStoreId === DEFAULT_CTX
        ) {
          btn.hidden = true
          if (State.panelIndex > k) hideOffset++
        }
        btn.updated = this.updatedPanels.includes(btn.cookieStoreId)
        if (k === State.panelIndex) btn.updated = false
        out.push(btn)
      }
      for (i = 0; i < State.ctxs.length; i++, k++) {
        const btn = State.ctxs[i]
        btn.proxified = !!State.proxiedPanels.find(p => {
          return p.id === btn.cookieStoreId && !!p.host && !!p.port
        })
        btn.loading = this.loading[k]
        if (State.private) {
          btn.hidden = true
          break
        }
        if (!btn.menu) btn.menu = TabsMenu
        btn.hidden = false
        btn.updated = this.updatedPanels.includes(btn.cookieStoreId)
        if (k === State.panelIndex) btn.updated = false
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
     * Have any pinned tabs
     */
    anyPinnedTabs() {
      if (!State.tabs[0]) return false
      return !!State.tabs[0].pinned
    },

    /**
     * List of updated panels
     */
    updatedPanels() {
      return Object.values(State.updatedTabs)
    },
  },

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
    await Store.dispatch('loadContexts')
    await Store.dispatch('loadTabs')

    // --- Handle resizing of sidebar
    const onresize = Utils.Asap(() => this.updateNavSize(), 120)
    window.addEventListener('resize', onresize.func)

    // --- Handle global events
    EventBus.$on('openPanelMenu', panelIndex => this.openPanelMenu(panelIndex))
    EventBus.$on('panelLoadingStart', panelIndex => this.onPanelLoadingStart(panelIndex))
    EventBus.$on('panelLoadingEnd', panelIndex => this.onPanelLoadingEnd(panelIndex))
    EventBus.$on('panelLoadingOk', panelIndex => this.onPanelLoadingOk(panelIndex))
    EventBus.$on('panelLoadingErr', panelIndex => this.onPanelLoadingErr(panelIndex))
    EventBus.$on('dragTabStart', tabInfo => this.outerDraggedTab = tabInfo)

    // --- Non-watched vars
    this.updatedTabs = {}
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
    ...mapActions(['createTab']),

    /**
     * Sidebar wheel event handler
     */
    onWH(e) {
      if (State.scrollThroughTabs !== 'none' && State.panelIndex > 0) {
        const globaly = State.scrollThroughTabs === 'global'
        if (e.deltaY > 0) {
          if (this.wheelBlockTimeout) return
          Store.dispatch('switchTab', { globaly, cycle: false, step: 1 })
        }
        if (e.deltaY < 0) {
          if (this.wheelBlockTimeout) return
          Store.dispatch('switchTab', { globaly, cycle: false, step: -1 })
        }
      }

      if (State.hScrollThroughPanels) {
        if (e.deltaX > 0) return Store.dispatch('switchPanel', 1)
        if (e.deltaX < 0) return Store.dispatch('switchPanel', -1)
      }
    },

    /**
     * Navigation wheel event handler
     */
    onNavWheel(e) {
      if (e.deltaY > 0) return Store.dispatch('switchPanel', 1)
      if (e.deltaY < 0) return Store.dispatch('switchPanel', -1)
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
      Store.commit('resetSelection')
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
              const tab = this.outerDraggedTab

              if (!tab || tab.url !== s) {
                if (s.indexOf('http') === -1) return
                browser.tabs.create({ url: s, windowId: State.windowId })
                return
              }

              if (tab.incognito === State.private) {
                browser.tabs.move(tab.tabId, { windowId: State.windowId, index: -1 })
              } else {
                if (s.indexOf('http') === -1) return
                browser.tabs.create({ url: s, windowId: State.windowId })
                browser.tabs.remove(tab.tabId)
              }
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
        Store.dispatch('switchToPanel', i)
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
      Store.dispatch('resyncPanels')
      Store.dispatch('checkContextBindings', contextualIdentity.cookieStoreId)
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
      Store.dispatch('saveSyncPanels')
      Store.dispatch('checkContextBindings', id)
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
      Store.commit('resetSelection')

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
      Store.dispatch('recalcPanelScroll')
      Store.dispatch('saveSyncPanels')
      if (State.proxiedPanels.includes(tab.cookieStoreId)) {
        Store.dispatch('setupTabProxy', tab.id)
      }
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

      // Handle url change
      if (change.hasOwnProperty('url')) {
        this.updatedTabs[tab.id] = 1
      }

      // Handle title change
      if (change.hasOwnProperty('title') && !tab.active) {
        // If prev url start with 'http'
        const prevTabState = State.tabs[upIndex]
        if (!prevTabState.url.indexOf('http')) {
          // And if prev title not just url
          // which is default title value
          const hn = prevTabState.url.split('/')[2]
          const shn = hn.indexOf('www.') ? hn : hn.slice(4)
          if (prevTabState.title.indexOf(shn)) {
            if (this.updatedTabs[tab.id]) {
              this.updatedTabs[tab.id]++
              if (this.updatedTabs[tab.id] > 2) {
                this.$set(State.updatedTabs, tab.id, tab.cookieStoreId)
              }
            }
          }
        }
      }

      State.tabs.splice(upIndex, 1, tab)

      if (change.hasOwnProperty('pinned') && change.pinned) {
        if (tab.active) Store.commit('setPanel', 1)
      }

      if (change.hasOwnProperty('url') || change.hasOwnProperty('pinned')) {
        Store.dispatch('saveSyncPanels')
      }
    },

    /**
     * tabs.onRemoved
     */
    onRemovedTab(tabId, info) {
      if (info.windowId !== State.windowId) return
      Logs.D(`Tab removed, id: '${tabId}'`)
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      let rmIndex = State.tabs.findIndex(t => t.id === tabId)
      if (rmIndex === -1) return

      const panelIndex = Utils.GetPanelIndex(this.panels, tabId)
      const tab = State.tabs[rmIndex]
      if (State.lockedPanels.includes(tab.cookieStoreId) && tab.url.indexOf('about')) {
        browser.tabs.create({
          url: tab.url,
          cookieStoreId: tab.cookieStoreId,
        })
      }

      if (
        State.noEmptyDefault
        && !tab.pinned
        && tab.cookieStoreId === this.defaultCtxId
      ) {
        const panelTabs = this.panels[panelIndex].tabs
        if (panelTabs && panelTabs.length === 1) {
          browser.tabs.create({})
        }
      }

      // Shift tabs after removed one. (NOT detected by vue)
      for (let i = rmIndex + 1; i < State.tabs.length; i++) {
        State.tabs[i].index--
      }
      State.tabs.splice(rmIndex, 1)

      if (State.activeTabs[panelIndex] !== null) State.activeTabs[panelIndex] = null

      // Remove updated flag
      this.$delete(State.updatedTabs, tabId)
      this.updatedTabs[tabId] = 0

      Store.dispatch('recalcPanelScroll')
      Store.dispatch('saveSyncPanels')
    },

    /**
     * tabs.onMoved
     */
    onMovedTab(id, info) {
      if (info.windowId !== State.windowId) return
      Logs.D(`Tab moved, id: '${id}', from: '${info.fromIndex}', to: '${info.toIndex}'`)
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')

      // If moved tab active, cut it out
      let pIndex = Utils.GetPanelIndex(this.panels, id)
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
      if (!movedTab) {
        const i = State.tabs.findIndex(t => t.id === id)
        movedTab = State.tabs.splice(i, 1)[0]
      }
      if (!movedTab) return
      movedTab.index = info.toIndex

      // Shift tabs after moved one. (NOT detected by vue)
      for (let i = 0; i < State.tabs.length; i++) {
        if (i < info.toIndex) State.tabs[i].index = i
        else State.tabs[i].index = i + 1
      }
      State.tabs.splice(info.toIndex, 0, movedTab)

      // Update active tab position
      pIndex = Utils.GetPanelIndex(this.panels, id)
      if (isActive) Store.commit('setPanel', pIndex)
      Store.dispatch('recalcPanelScroll')
    },

    /**
     * tabs.onDetached
     */
    onDetachedTab(id, info) {
      if (info.oldWindowId !== State.windowId) return
      Logs.D(`Tab detached, id: '${id}'`)
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      let i = State.tabs.findIndex(t => t.id === id)
      if (i === -1) return
      State.tabs.splice(i, 1)

      // Remove updated flag
      this.$delete(State.updatedTabs, id)
      this.updatedTabs[id] = 0

      Store.dispatch('recalcPanelScroll')
      Store.dispatch('saveSyncPanels')
    },

    /**
     * tabs.onAttached
     */
    onAttachedTab(id, info) {
      if (info.newWindowId !== State.windowId) return
      Logs.D(`Tab attached, id: '${id}'`)
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      Store.dispatch('loadTabs')
      Store.dispatch('saveSyncPanels')
    },

    /**
     * tabs.onActivated
     */
    onActivatedTab(info) {
      if (info.windowId !== State.windowId) return
      Logs.D(`Tab activated, id: '${info.tabId}'`)
      Store.commit('resetSelection')
      for (let i = 0; i < State.tabs.length; i++) {
        State.tabs[i].active = info.tabId === State.tabs[i].id
      }

      // Switch to tab's panel
      let tab = State.tabs.find(t => t.id === info.tabId)
      let panelIndex = -1
      if (tab && !tab.pinned) {
        panelIndex = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
        if (panelIndex === -1) return
      }
      if (tab && tab.pinned) panelIndex = 1
      if (panelIndex > 0 && State.panelIndex !== panelIndex) {
        // Close settings and switch panel
        if (State.settingsOpened) State.settingsOpened = false
        Store.commit('setPanel', panelIndex)
      }

      // Remove updated flag
      this.$delete(State.updatedTabs, info.tabId)
      this.updatedTabs[info.tabId] = 0

      State.activeTabs[panelIndex] = info.tabId
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
     * Get position class for panel by index.
     */
    getPanelPos(i) {
      if (this.settingsOpened) return 'left'
      if (State.panelIndex < i) return 'right'
      if (State.panelIndex === i) return 'center'
      if (State.panelIndex > i) return 'left'
    },

    // --- Panel Menu ---
    /**
     * Open panel menu by nav index.
     */
    async openPanelMenu(i) {
      Store.commit('closeSettings')
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      State.panelMenuOpened = true
      State.panelIndex = i
      if (i >= 0) State.activePanel = State.panelIndex
      if (i === -1) this.panelMenu = { menu: TabsMenu, new: true }
      else if (i >= 0) this.panelMenu = { ...this.nav[i] }

      await this.$nextTick()
      if (this.$refs.menu && this.$refs.menu.open) this.$refs.menu.open()
      let h = this.$refs.menu.$el.offsetHeight
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    /**
     * Wait for rerendering and calc panels menu height.
     */
    async recalcPanelMenuHeight() {
      await this.$nextTick()
      if (!State.panelMenuOpened) return
      let h = this.$refs.menu ? this.$refs.menu.$el.offsetHeight : 336
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    /**
     * Close nav menu.
     */
    closePanelMenu() {
      State.panelMenuOpened = false
      if (State.panelIndex < 0 && State.lastPanelIndex >= 0) {
        State.panelIndex = State.lastPanelIndex
      }
      this.$refs.nav.style.transform = 'translateY(0px)'
      setTimeout(() => (this.panelMenu = null), 120)
    },
    // ---

    /**
     * Toggle settings
     */
    toggleSettings() {
      if (State.panelMenuOpened) this.closePanelMenu()
      if (State.settingsOpened) Store.commit('closeSettings')
      else Store.commit('openSettings')
      Store.commit('resetSelection')
    },

    /**
     * Update sidebar width value.
     */
    updateNavSize() {
      if (this.width !== window.innerWidth) this.width = window.innerWidth
      this.recalcPanelMenuHeight()
    },

    /**
     * Get tooltip for button
     */
    getTooltip(i) {
      if (!this.panels[i].tabs) return this.nav[i].name
      return `${this.nav[i].name}: ${this.panels[i].tabs.length}`
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

NAV_HEIGHT = 32px
NAV_BTN_WIDTH = 34px
NAV_CTRL_WIDTH = 28px
NAV_CONF_HEIGHT = auto

.Sidebar
  box(relative, flex)
  size(100%, same)
  flex-direction: column
  overflow: hidden

  &[menu-opened]
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
  size(100%, NAV_CONF_HEIGHT, max-h: calc(100vh + 200px))
  padding: 300px 0 32px
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
  &[proxified]
    > .proxy-badge
      opacity: 1
      transform: scale(1, 1)
  &[updated]
    > .update-badge
      opacity: 1
      transform: scale(1, 1)
  &[loading="true"]
    cursor: progress
    > .loading-spinner
      opacity: 1
      for i in 0..12
        > .spinner-stick-{i}
          animation: loading-spin .6s (i*50)ms infinite
  &[loading="ok"]
    > .ok-badge
      opacity: 1
      transform: scale(1, 1)
  &[loading="err"]
    > .err-badge
      opacity: 1
      transform: scale(1, 1)
  &[proxified]
  &[loading]
  &[updated]
    > svg
      mask: radial-gradient(
        circle at calc(100% - 2px) calc(100% - 2px),
        #00000032,
        #00000032 6.5px,
        #000000 7.5px,
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
  pos(b: 4px, r: 6px)
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
      animation: none

.Sidebar .panel-btn > .update-badge
  box(absolute)
  size(10px, same)
  pos(b: 5px, r: 6px)
  border-radius: 50%
  background-color: var(--nav-btn-update-badge-bg)
  opacity: 0
  transform: scale(0.7, 0.7)
  transition: opacity var(--d-norm), transform var(--d-norm)

.Sidebar .panel-btn > .proxy-badge
  box(absolute)
  size(9px, same)
  pos(b: 6px, r: 7px)
  fill: var(--nav-btn-fg)
  opacity: 0
  transform: scale(0.7, 0.7)
  transition: opacity var(--d-norm), transform var(--d-norm)
  > svg
    box(absolute)
    size(100%, same)

.Sidebar .panel-btn > .ok-badge
.Sidebar .panel-btn > .err-badge
  box(absolute)
  size(10px, same)
  pos(b: 5px, r: 6px)
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
