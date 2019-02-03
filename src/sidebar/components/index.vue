<template lang="pug">
.Sidebar(
  :dashboard-opened="$store.state.dashboardOpened"
  :drag-mode="dragMode"
  :pointer-mode="pointerMode"
  @wheel="onWheel"
  @contextmenu.prevent.stop=""
  @dragover.prevent="onDragMove"
  @dragenter="onDragEnter"
  @dragleave="onDragLeave"
  @drop.stop.prevent="onDrop"
  @mouseenter="onMouseEnter"
  @mouseleave="onMouseLeave"
  @mousedown="onMouseDown")
  ctx-menu
  .bg(v-noise:300.g:12:af.a:0:42.s:0:9="", :style="bgPosStyle")
  .dimmer(@mousedown="closeDashboard")
  .pointer(ref="pointer"): .arrow
  .nav(ref="nav")
    keep-alive
      component.panel-menu(
        v-if="dashboard"
        ref="menu"
        :is="dashboard.component" 
        :conf="dashboard"
        :index="$store.state.panelIndex"
        @close="closeDashboard"
        @height="recalcDashboardHeight")

    .nav-strip(@wheel="onNavWheel")
      .panel-btn(
        v-for="(btn, i) in nav"
        :key="btn.cookieStoreId || btn.name"
        :title="getTooltip(i)"
        :loading="btn.loading"
        :updated="btn.updated"
        :proxified="btn.proxified"
        :is-active="panelIs(i)"
        :is-hidden="btn.hidden"
        :class="'rel-' + btn.relIndex"
        @click="onNavClick(i)"
        @dragenter="onNavDragEnter(i)"
        @dragleave="onNavDragLeave(i)"
        @mousedown.right="openDashboard(i)")
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

    //- Settings
    .settings-btn(
      :data-active="$store.state.panelIndex === -2"
      :title="t('nav.settings_tooltip')"
      @click="toggleSettings")
      svg: use(xlink:href="#icon_settings")

  //- Panels
  .panel-box
    component.panel(
      v-for="(c, i) in panels"
      v-if="panelVisible(i)"
      ref="panels"
      :key="c.cookieStoreId || c.name"
      :is="c.panel"
      :tabs="c.tabs"
      :index="i"
      :store-id="c.cookieStoreId"
      :pos="getPanelPos(i)"
      :active="panelIs(i)"
      @create-tab="createTab")
    transition(name="settings")
      settings-panel(v-if="$store.state.panelIndex === -2", :pos="settingsPanelPos")
      styles-panel(v-if="$store.state.panelIndex === -3", :pos="stylesPanelPos")
      snapshots-panel(v-if="$store.state.panelIndex === -4", :pos="snapshotsPanelPos")
      window-input(v-if="$store.state.panelIndex === -5", :pos="windowInputPos")
</template>


<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import NoiseBg from '../../directives/noise-bg.js'
import Utils from '../../libs/utils.js'
import EventBus from '../event-bus'
import Store from '../store'
import State, { DEFAULT_PANELS, DEFAULT_CTX } from '../store.state.js'
import CtxMenu from './context-menu'
import WindowInput from './inputs/window'
import TabsDashboard from './dashboards/containered-tabs'
import BookmarksPanel from './panels/bookmarks'
import TabsPanel from './panels/tabs'
import SettingsPanel from './panels/settings'
import SnapshotsPanel from './panels/snapshots'
import StylesPanel from './panels/styles'

Vue.directive('noise', NoiseBg)

const URL_HOST_PATH_RE = /^([a-z0-9-]{1,63}\.)+\w+(:\d+)?\/[A-Za-z0-9-._~:/?#[\]%@!$&'()*+,;=]*$/
const ADD_CTX_BTN = { icon: 'icon_plus_v2', hidden: false }

// --- Vue Component ---
export default {
  components: {
    CtxMenu,
    BookmarksPanel,
    TabsPanel,
    SettingsPanel,
    WindowInput,
    SnapshotsPanel,
    StylesPanel,
  },

  data() {
    return {
      width: 250,
      dragMode: false,
      pointerMode: 'between',
      dashboard: null,
      loading: [],
      loadingTimers: [],
    }
  },

  /**
   * --- Computed ---
   */
  computed: {
    ...mapGetters(['isPrivate', 'defaultCtxId', 'panels', 'activePanel']),

    /**
     * Background transform style for parallax fx
     */
    bgPosStyle() {
      return { transform: `translateX(-${State.panelIndex * 5}%)` }
    },

    /**
     * Get settings-panel position
     */
    settingsPanelPos() {
      return State.panelIndex === -2 ? 'center' : 'right'
    },

    /**
     * Get styles-editor-panel position
     */
    stylesPanelPos() {
      return State.panelIndex === -3 ? 'center' : 'right'
    },

    /**
     * Get styles-editor-panel position
     */
    snapshotsPanelPos() {
      return State.panelIndex === -4 ? 'center' : 'right'
    },

    /**
     * Get window-input-panel position
     */
    windowInputPos() {
      return State.panelIndex === -5 ? 'center' : 'right'
    },

    /**
     * Count of visible nav buttons
     */
    countOfVisibleBtns() {
      return this.nav.filter(b => !b.hidden).length
    },

    /**
     * Get list of navigational buttons
     */
    nav() {
      let cap = ~~((this.width - 32) / 34)
      let halfCap = cap >> 1
      let invModCap = cap % halfCap ^ 1

      let i, k
      let out = []
      let hideOffset = 0
      for (i = 0, k = 0; i < DEFAULT_PANELS.length; i++, k++) {
        const btn = DEFAULT_PANELS[i]
        btn.loading = this.loading[i]
        btn.hidden = false
        btn.inactive = false
        if (
          (!this.anyPinnedTabs && btn.pinned) ||
          (!State.private && btn.private) ||
          (State.private && btn.cookieStoreId === DEFAULT_CTX)
        ) {
          btn.hidden = true
          btn.inactive = true
          if (State.panelIndex > k) hideOffset++
        }
        if (i === 0 && !State.bookmarksPanel) btn.hidden = btn.inactive = true
        btn.updated = this.updatedPanels.includes(k)
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
          btn.inactive = true
          break
        }
        if (!btn.component) btn.component = TabsDashboard
        btn.hidden = false
        btn.inactive = false
        btn.updated = this.updatedPanels.includes(k)
        if (k === State.panelIndex) btn.updated = false
        out.push(btn)
      }

      if (!State.private) {
        ADD_CTX_BTN.hidden = false
        out.push(ADD_CTX_BTN)
      }

      let p = State.panelIndex - hideOffset
      let vis = out.length - hideOffset
      let r = 0
      for (i = 0, k = 0; i < out.length; i++) {
        if (out[i].hidden) continue
        if (p - k > halfCap && vis - k > cap) out[i].hidden = true
        if (p - k < invModCap - halfCap && k > cap - 1) out[i].hidden = true
        if (!out[i].hidden) out[i].relIndex = r++
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

    // --- Handle resizing of sidebar
    const onresize = Utils.Asap(() => this.updateNavSize(), 120)
    window.addEventListener('resize', onresize.func)

    // --- Handle global events
    EventBus.$on('openDashboard', panelIndex => this.openDashboard(panelIndex))
    EventBus.$on('panelLoadingStart', panelIndex => this.onPanelLoadingStart(panelIndex))
    EventBus.$on('panelLoadingEnd', panelIndex => this.onPanelLoadingEnd(panelIndex))
    EventBus.$on('panelLoadingOk', panelIndex => this.onPanelLoadingOk(panelIndex))
    EventBus.$on('panelLoadingErr', panelIndex => this.onPanelLoadingErr(panelIndex))
    EventBus.$on('dragStart', info => (this.dragNodes = info))
    EventBus.$on('outerDragStart', info => (this.dragNodes = info))
    EventBus.$on('panelSwitched', () => setTimeout(() => this.recalcPanelBounds(), 256))
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
    onWheel(e) {
      if (State.ctxMenu) Store.commit('closeCtxMenu')

      if (State.hScrollThroughPanels) {
        if (e.deltaX > 0) return Store.dispatch('switchPanel', 1)
        if (e.deltaX < 0) return Store.dispatch('switchPanel', -1)
      }
    },

    /**
     * Navigation wheel event handler
     */
    onNavWheel(e) {
      e.stopPropagation()
      e.preventDefault()
      if (e.deltaY > 0) return Store.dispatch('switchPanel', 1)
      if (e.deltaY < 0) return Store.dispatch('switchPanel', -1)
    },

    /**
     * Drag move handler
     */
    onDragMove(e) {
      if (!this.dragMode) return
      if (!this.$refs.pointer) return

      let dragNode = this.dragNodes ? this.dragNodes[0] : null
      let dragNodeId = dragNode ? dragNode.id : null
      let scroll = this.panelScrollEl ? this.panelScrollEl.scrollTop : 0
      let y = e.clientY - this.panelTopOffset + scroll

      // Empty
      if (this.dropSlots.length === 0) {
        if (this.pointerPos !== this.panelTopOffset - scroll - 12) {
          this.pointerPos = this.panelTopOffset - scroll - 12
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.dropParent = -1
          this.dropIndex = 0 // Find start index of panel
        }
        return
      }

      // End
      if (y > this.dropSlots[this.dropSlots.length - 1].bottom) {
        const slot = this.dropSlots[this.dropSlots.length - 1]
        if (this.pointerPos !== slot.end - 12 + this.panelTopOffset - scroll) {
          this.pointerPos = slot.end - 12 + this.panelTopOffset - scroll
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.pointerMode = 'between'
          this.dropParent = slot.parent
          this.dropIndex = slot.index + 1
        }
        return
      }

      for (let i = 0; i < this.dropSlots.length; i++) {
        const slot = this.dropSlots[i]
        // Skip
        if (y > slot.end || y < slot.start || slot.id === dragNodeId) continue
        // Between
        if (slot.in ? y < slot.top : y < slot.center) {
          const prevSlot = this.dropSlots[i - 1]
          if (this.pointerPos !== slot.start - 12 + this.panelTopOffset - scroll) {
            this.pointerPos = slot.start - 12 + this.panelTopOffset - scroll
            this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
            this.pointerMode = 'between'

            if (!prevSlot) {
              this.dropParent = -1
              this.dropIndex = slot.index
              break
            }

            if (prevSlot.id === slot.parent) {
              // First child
              this.dropParent = slot.parent
              this.dropIndex = slot.index
            } else {
              // Second - Last
              this.dropParent = prevSlot.parent
              this.dropIndex = prevSlot.index + 1
            }
          }
          break
        }
        // Inside
        if (slot.in && y < slot.bottom) {
          if (this.pointerPos !== slot.center - 12 + this.panelTopOffset - scroll) {
            this.pointerPos = slot.center - 12 + this.panelTopOffset - scroll
            this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
            this.pointerMode = 'in'
            this.dropParent = slot.id
            if (slot.type === 'tab') this.dropIndex = slot.index + 1
            else this.dropIndex = 0
          }
          if (slot.folded && e.clientX < 32) {
            slot.folded = false
            this.expandDropTarget()
          }
          break
        }
      }
    },

    /**
     * Mouse enter event handler
     */
    onMouseEnter() {
      if (this.leaveTimeout) {
        clearTimeout(this.leaveTimeout)
        this.leaveTimeout = null
      }
    },

    /**
     * Mouse leave event handler
     */
    onMouseLeave() {
      this.leaveTimeout = setTimeout(() => {
        Store.commit('closeCtxMenu')
      }, 500)
    },

    /**
     * Mouse down event handler
     */
    onMouseDown(e) {
      if (e.button === 1) {
        if (State.wheelBlockTimeout) {
          clearTimeout(State.wheelBlockTimeout)
          State.wheelBlockTimeout = null
        }
        State.wheelBlockTimeout = setTimeout(() => {
          State.wheelBlockTimeout = null
        }, 500)
      }
      if (e.button < 2) Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
    },

    /**
     * Drag enter event handler
     */
    onDragEnter(e) {
      if (e && e.relatedTarget) return

      // Get drop slots
      if (!this.$refs.panels) return
      const panelVN = this.$refs.panels.find(p => p.index === State.panelIndex)
      if (!panelVN) return
      this.dropSlots = panelVN.getItemsBounds()
      if (!this.dropSlots) return

      // Get start coorinate of drop slots
      this.panelTopOffset = panelVN.getTopOffset()

      // Get scroll element
      this.panelScrollEl = panelVN.getScrollEl()

      // Turn on drag mode
      this.dragMode = true
    },

    onDragLeave(e) {
      if (e && e.relatedTarget) return
      this.resetDrag()
    },

    /**
     * Drop event handler
     * 
     *                   Tab     OuterTab  Bookmark  OuterBookmark  Native
     * ToSamePanel       id      -         id        -              -
     * ToSamePanel+CTRL  url     -         url       -              -
     * 
     * ToTabsPanel       both    url       url       url            url
     * ToTabsPanel+CTRL  url     url       url       url            url
     * ToBookmarksPanel  url     url       -         -              url
     */
    onDrop(e) {
      if (this.dropParent === undefined) this.dropParent = -1
      if (this.dropParent === null) this.dropParent = -1

      if (this.panels[State.panelIndex].tabs) {
        Store.dispatch('dropToTabs', {
          event: e,
          dropIndex: this.dropIndex,
          dropParent: this.dropParent,
          nodes: this.dragNodes,
        })
      }
      if (this.panels[State.panelIndex].bookmarks) {
        Store.dispatch('dropToBookmarks', {
          event: e,
          dropIndex: this.pointerMode === 'in' ? 0 : this.dropIndex,
          dropParent: this.dropParent,
          nodes: this.dragNodes,
        })
      }

      this.resetDrag()
    },

    /**
     * Navigation button click hadler
     */
    onNavClick(i) {
      if (i === this.panels.length) return this.openDashboard(-1)
      if (State.panelIndex !== i) {
        Store.dispatch('switchToPanel', i)
      } else if (this.panels[i].cookieStoreId) {
        browser.tabs.create({ cookieStoreId: this.panels[i].cookieStoreId })
      }
    },

    /**
     * Navigation button dragenter handler
     */
    onNavDragEnter(i) {
      this.navDragEnterIndex = i
      if (this.navDragEnterTimeout) clearTimeout(this.navDragEnterTimeout)
      this.navDragEnterTimeout = setTimeout(() => {
        Store.dispatch('switchToPanel', i)
      }, 200)
    },

    /**
     * Navigation button dragleave handler
     */
    onNavDragLeave(i) {
      if (this.navDragEnterTimeout && this.navDragEnterIndex === i) {
        clearTimeout(this.navDragEnterTimeout)
      }
    },

    // --- Contextual Identities Hooks ---
    /**
     * contextualIdentities.onCreated
     */
    onCreatedContainer({ contextualIdentity }) {
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
      let id = contextualIdentity.cookieStoreId
      let i = State.ctxs.findIndex(c => c.cookieStoreId === id)
      if (i === -1) return
      State.ctxs.splice(i, 1)

      // Turn off sync and unlock
      this.$set(State.syncedPanels, this.index, false)
      this.$set(State.lockedPanels, this.index, false)

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

      // Update tree
      tab.parentId = -1
      if (State.tabsTree && tab.openerTabId !== undefined) {
        tab.parentId = tab.openerTabId
        for (let i = tab.index; i--; ) {
          if (tab.parentId === State.tabs[i].id) {
            if (State.tabs[i].lvl) tab.lvl = State.tabs[i].lvl + 1
            else tab.lvl = 1
            State.tabs[i].isParent = true
            if (State.tabs[i].folded) browser.tabs.hide(tab.id)
            break
          }
        }
        Store.dispatch('saveTabsTree')
      }

      // Put new tab in tabs list
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

      // Preserve tree levels and parent flags
      tab.lvl = State.tabs[upIndex].lvl
      tab.parentId = State.tabs[upIndex].parentId
      tab.isParent = State.tabs[upIndex].isParent
      tab.folded = State.tabs[upIndex].folded

      // Handle favicon change
      // If favicon is base64 string - store it in cache
      if (change.favIconUrl && change.favIconUrl.startsWith('data:')) {
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

      // Handle title change
      if (change.hasOwnProperty('title') && !tab.active) {
        // If prev url starts with 'http' and current url same as prev
        const prevTabState = State.tabs[upIndex]
        if (prevTabState.url.startsWith('http') && prevTabState.url === tab.url) {
          // and if title doesn't looks like url
          if (!URL_HOST_PATH_RE.test(prevTabState.title) && !URL_HOST_PATH_RE.test(tab.title)) {
            // Mark tab as updated
            if (tab.pinned) {
              this.$set(State.updatedTabs, tab.id, 1)
            } else {
              let pi = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
              this.$set(State.updatedTabs, tab.id, pi)
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
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      let rmIndex = State.tabs.findIndex(t => t.id === tabId)
      if (rmIndex === -1) return

      const panelIndex = Utils.GetPanelIndex(this.panels, tabId)
      const tab = State.tabs[rmIndex]
      if (State.lockedTabs[panelIndex] && !tab.url.startsWith('about')) {
        browser.tabs.create({
          url: tab.url,
          cookieStoreId: tab.cookieStoreId,
        })
      }

      if (State.noEmptyDefault && !tab.pinned && tab.cookieStoreId === this.defaultCtxId) {
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

      Store.dispatch('recalcPanelScroll')
      Store.dispatch('saveSyncPanels')
    },

    /**
     * tabs.onMoved
     */
    onMovedTab(id, info) {
      if (info.windowId !== State.windowId) return
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')

      let pIndex = Utils.GetPanelIndex(this.panels, id)
      let isActive = State.activeTabs[pIndex] === id

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

      // Calc tree levels
      if (State.tabsTree) {
        State.tabs = Utils.CalcTabsTreeLevels(State.tabs)
        Store.dispatch('saveTabsTree')
      }
    },

    /**
     * tabs.onDetached
     */
    onDetachedTab(id, info) {
      if (info.oldWindowId !== State.windowId) return
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      let i = State.tabs.findIndex(t => t.id === id)
      if (i === -1) return
      State.tabs.splice(i, 1)

      // Remove updated flag
      this.$delete(State.updatedTabs, id)

      Store.dispatch('recalcPanelScroll')
      Store.dispatch('saveSyncPanels')
    },

    /**
     * tabs.onAttached
     */
    onAttachedTab(id, info) {
      if (info.newWindowId !== State.windowId) return
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

      // Reset selectin and close settings
      Store.commit('resetSelection')

      // Update tabs and find activated one
      let tab, isActivated
      for (let i = State.tabs.length; i--; ) {
        isActivated = info.tabId === State.tabs[i].id
        State.tabs[i].active = isActivated
        if (isActivated) tab = State.tabs[i]
      }
      if (!tab) return

      // Find panel of activated tab
      let panelIndex = this.panels.findIndex(p => {
        return tab.pinned ? p.pinned : p.cookieStoreId === tab.cookieStoreId
      })
      if (panelIndex === -1) return

      // Switch to activated tab's panel
      if (!State.lockedPanels[State.panelIndex]) {
        Store.commit('setPanel', panelIndex)
      }
      EventBus.$emit('scrollToActiveTab', panelIndex, info.tabId)

      // Reopen dashboard
      if (State.dashboardOpened) {
        if (this.dashboard.cookieStoreId !== this.nav[State.panelIndex].cookieStoreId) {
          this.openDashboard(State.panelIndex)
        }
      }

      // Remove updated flag
      this.$delete(State.updatedTabs, info.tabId)

      State.activeTabs[panelIndex] = info.tabId

      if (State.hideInact) Store.dispatch('hideInactPanelsTabs')
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
     * Check if panel should be rendered
     */
    panelVisible(index) {
      if (index === 0) return State.bookmarksPanel
      return true
    },

    /**
     * Get position class for panel by index.
     */
    getPanelPos(i) {
      if (State.panelIndex < 0) return 'left'
      if (State.panelIndex < i) return 'right'
      if (State.panelIndex === i) return 'center'
      if (State.panelIndex > i) return 'left'
    },

    /**
     * Recalc panel bounds
     */
    recalcPanelBounds() {
      if (!this.dragMode) return

      // Get drop slots
      if (!this.$refs.panels) return
      const panelVN = this.$refs.panels.find(p => p.index === State.panelIndex)
      if (!panelVN) return
      this.dropSlots = panelVN.getItemsBounds()

      // Get start coorinate of drop slots
      this.panelTopOffset = panelVN.getTopOffset()

      // Get scroll element
      this.panelScrollEl = panelVN.getScrollEl()
    },

    /**
     * Expand drop target
     */
    expandDropTarget() {
      if (this.pointerMode !== 'in') return
      if (this.pointerEnterTimeout) return

      if (typeof this.dropParent === 'number') Store.dispatch('expTabsBranch', this.dropParent)
      if (typeof this.dropParent === 'string') Store.dispatch('expandBookmark', this.dropParent)
      setTimeout(() => this.recalcPanelBounds(), 128)
      this.pointerEnterTimeout = setTimeout(() => {
        this.pointerEnterTimeout = null
      }, 500)
    },

    /**
     * Reset drag-and-drop values
     */
    resetDrag() {
      this.dragNodes = null
      this.dragMode = false
      this.dropIndex = null
      this.dropParent = null
      this.pointerPos = null
      this.panelScrollEl = null
      EventBus.$emit('dragEnd')
    },

    // --- Panel Menu ---
    /**
     * Open panel menu by nav index.
     */
    async openDashboard(i) {
      if (i === this.panels.length) i = -1
      Store.commit('closeSettings')
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      State.dashboardOpened = true
      State.panelIndex = i
      if (i >= 0) State.activePanel = State.panelIndex
      if (i === -1) this.dashboard = { component: TabsDashboard, new: true }
      else if (i >= 0) this.dashboard = { ...this.nav[i] }

      await this.$nextTick()
      if (this.$refs.menu && this.$refs.menu.open) this.$refs.menu.open()
      let h = this.$refs.menu.$el.offsetHeight
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    /**
     * Wait for rerendering and calc panels menu height.
     */
    async recalcDashboardHeight() {
      await this.$nextTick()
      if (!State.dashboardOpened) return
      let h = this.$refs.menu ? this.$refs.menu.$el.offsetHeight : 336
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    /**
     * Close nav menu.
     */
    closeDashboard() {
      State.dashboardOpened = false
      if (State.panelIndex < 0 && State.lastPanelIndex >= 0) {
        State.panelIndex = State.lastPanelIndex
      }
      this.$refs.nav.style.transform = 'translateY(0px)'
      setTimeout(() => (this.dashboard = null), 120)
    },
    // ---

    /**
     * Toggle settings
     */
    toggleSettings() {
      if (State.dashboardOpened) this.closeDashboard()
      if (State.panelIndex === -2) Store.commit('closeSettings')
      else Store.commit('openSettings')
      Store.commit('resetSelection')
    },

    /**
     * Update sidebar width value.
     */
    updateNavSize() {
      if (this.width !== window.innerWidth) this.width = window.innerWidth
      this.recalcDashboardHeight()
    },

    /**
     * Get tooltip for button
     */
    getTooltip(i) {
      if (i === this.panels.length) return this.t('nav.add_ctx_tooltip')
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

  &[dashboard-opened]
    > .dimmer
      z-index: 999
      opacity: 1
    .panel-menu
      opacity: 1
      transition: opacity var(--d-fast), z-index var(--d-fast)
    .panel-btn[is-active="true"]
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
  background-color: var(--bg)
  box-shadow: 0 1px 12px 0 #00000056, 0 1px 0 0 #00000012
  opacity: 0
  z-index: 0
  transition: opacity var(--d-fast) .03s, z-index var(--d-fast)

.Sidebar .nav-strip
  box(relative, flex)
  flex-grow: 1
  overflow: hidden

.Sidebar .panel-btn
  box(absolute, flex)
  size(NAV_BTN_WIDTH, NAV_HEIGHT, max-w: 34px)
  justify-content: center
  align-items: center
  flex-shrink: 0
  opacity: var(--nav-btn-opacity)
  z-index: 10
  transition: opacity var(--d-fast), transform var(--d-fast), z-index var(--d-fast)
  // for dragenter
  &:before
    content: ''
    box(absolute)
    size(100%, same)
    pos(0, 0)
    z-index: 1
  &[is-active="true"]
    opacity: var(--nav-btn-activated-opacity)
  &:hover
    opacity: var(--nav-btn-opacity-hover)
  &:active
    opacity: var(--nav-btn-opacity-active)
    transition: none
  &[is-hidden="true"]
    opacity: 0
    z-index: -1
    transform: scale(0, 0)
  &[updated]
    > .update-badge
      opacity: 1
      transform: scale(1, 1)
  &[proxified]
    > .update-badge
      opacity: 0
      transform: scale(0.7, 0.7)
    > .proxy-badge
      opacity: .64
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
  &[updated]
    > svg
      mask: radial-gradient(
        circle at calc(100% - 2px) calc(100% - 2px),
        #00000032,
        #00000032 4.5px,
        #000000 5.5px,
        #000000
      )
  &[proxified]
  &[loading]
    > svg
      mask: radial-gradient(
        circle at calc(100% - 2px) calc(100% - 2px),
        #00000032,
        #00000032 6.5px,
        #000000 7.5px,
        #000000
      )

  // Button x possition
  for i in 0..16
    &.rel-{i}
      transform: translateX(NAV_BTN_WIDTH * i)

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
  size(6px, same)
  pos(b: 7px, r: 8px)
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
    fill: var(--nav-btn-fg)
    opacity: .4
    transition: opacity var(--d-fast)

.Sidebar .add-btn
  margin: 0 0 0 auto
.Sidebar .settings-btn
  margin: 0 3px 0 0
  &[data-active="true"]
    > svg
      opacity: 1

// --- Move pointer ---
.Sidebar > .pointer
  box(absolute)
  size(32px, 24px)
  pos(0, 0)
  z-index: -1
  opacity: 0
  transition: z-index var(--d-fast), opacity var(--d-fast), transform var(--d-fast)
  .arrow
    box(absolute)
    size(100%, same)
    pos(0, 0)
    transform: translateX(0)
    transition: transform var(--d-fast)
    &:before
      content: ''
      box(absolute)
      size(16px, 16px)
      pos(4px, -11px)
      transform: rotateZ(45deg)
      box-shadow: inset 0 0 0 2px var(--nav-btn-update-badge-bg)
      transition: background-color var(--d-fast)
  &:after
    content: ''
    box(absolute)
    size(100vw, 2px)
    pos(11px, 6px)
    background-color: var(--nav-btn-update-badge-bg)
    opacity: 0
    transition: opacity var(--d-fast), transform var(--d-fast)
.Sidebar[drag-mode] > .pointer
  opacity: 1
  z-index: 100
.Sidebar[pointer-mode="between"] > .pointer:after
  opacity: 1
.Sidebar[pointer-mode="in"] > .pointer .arrow:before
  background-color: var(--nav-btn-update-badge-bg)
.Sidebar[pointer-mode="in"] > .pointer:after
  opacity: 0

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

// --- Settings Transitions ---
.Sidebar
  .settings-enter-active
  .settings-leave-active
    transition: opacity var(--d-fast), z-index var(--d-fast), transform var(--d-fast)
  .settings-enter
    transform: translateX(100%)
    opacity: 0
    z-index: 0
  .settings-enter-to
    transform: translateX(0)
    opacity: 1
    z-index: 10
  .settings-leave
    transform: translateX(0)
    opacity: 1
    z-index: 10
  .settings-leave-to
    transform: translateX(100%)
    opacity: 0
    z-index: 0

@keyframes loading-spin
  0%
    opacity: 1
  100%
    opacity: 0
</style>
