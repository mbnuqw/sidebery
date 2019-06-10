<template lang="pug">
.Sidebar(
  v-noise:300.g:12:af.a:0:42.s:0:9=""
  :data-dashboard="$store.state.dashboardOpened"
  :data-drag="dragMode"
  :data-pointer="pointerMode"
  :data-nav-inline="$store.state.navBarInline"
  @wheel="onWheel"
  @contextmenu.prevent.stop=""
  @dragover.prevent="onDragMove"
  @dragenter="onDragEnter"
  @dragleave="onDragLeave"
  @drop.stop.prevent="onDrop"
  @mouseenter="onMouseEnter"
  @mouseleave="onMouseLeave"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mousemove.passive="onMouseMove")

  ctx-menu

  .pointer(ref="pointer")
    .arrow(:data-expanding="pointerExpanding" @animationend="onPointerExpanded")

  //- Pinned tabs dock
  pinned-dock(
    v-if="$store.state.pinnedTabsPosition !== 'panel'"
    @start-selection="startSelection"
    @stop-selection="stopSelection")

  .box(ref="box")
    .dimmer(@mousedown="closeDashboard")

    //- Navigation
    .nav(v-noise:300.g:12:af.a:0:42.s:0:9="" ref="nav")
      .nav-bar(@wheel.stop.prevent="onNavWheel")
        .nav-btn(
          v-for="(btn, i) in nav"
          :key="btn.cookieStoreId + btn.name"
          :data-loading="btn.loading"
          :data-updated="btn.updated"
          :data-proxified="btn.proxified"
          :data-active="panelIs(i)"
          :data-hidden="btn.hidden"
          :data-index="btn.relIndex"
          :data-colorized="!!btn.colorCode"
          :style="{'--ctx': btn.colorCode}"
          :title="getTooltip(i)"
          @click="onNavClick(i)"
          @dragenter="onNavDragEnter(i)"
          @dragleave="onNavDragLeave(i)"
          @mousedown.right="openDashboard(i)")
          svg: use(:xlink:href="'#' + btn.icon")
          .proxy-badge
            svg: use(xlink:href="#icon_proxy")
          .update-badge
          .ok-badge
            svg: use(xlink:href="#icon_ok")
          .err-badge
            svg: use(xlink:href="#icon_err")
          .progress-spinner

      //- Settings
      .settings-btn(
        v-if="!$store.state.hideSettingsBtn"
        :title="t('nav.settings_tooltip')"
        @click="act('openSettings')")
        svg: use(xlink:href="#icon_settings")

    //- Panels
    .panel-box
      component.panel(
        v-for="(c, i) in $store.state.panels"
        v-if="panelVisible(i)"
        ref="panels"
        :key="c.cookieStoreId + c.name"
        :is="c.panel"
        :data-pos="getPanelPos(i)"
        :tabs="c.tabs"
        :index="i"
        :store-id="c.cookieStoreId"
        :active="panelIs(i)"
        @start-selection="startSelection"
        @stop-selection="stopSelection")
      transition(name="panel")
        window-input(v-if="$store.state.panelIndex === -5" :data-pos="windowInputPos")
      transition(name="dashboard")
        .dashboard-box(v-if="$store.state.dashboardOpened")
          component.dashboard(
            :data-pos="windowInputPos"
            :is="dashboard.dashboard"
            :conf="dashboard"
            :index="$store.state.panelIndex"
            @close="closeDashboard")
</template>


<script>
import Vue from 'vue'
import initNoiseBgDirective from '../directives/noise-bg.js'
import Utils from '../utils.js'
import EventBus from '../event-bus'
import { DEFAULT_CTX_ID, DEFAULT_CTX_TABS_PANEL } from './config/panels'
import Store from './store'
import State from './store/state.js'
import Actions from './actions'
import CtxMenu from './components/context-menu'
import BookmarksDashboard from './components/bookmarks-dashboard'
import DefaultTabsDashboard from './components/default-tabs-dashboard'
import TabsDashboard from './components/containered-tabs-dashboard'
import BookmarksPanel from './components/bookmarks-panel'
import TabsPanel from './components/tabs-panel'
import WindowInput from './components/window-select-input'
import PinnedDock from './components/pinned-tabs-dock'

const noiseBg = initNoiseBgDirective(State, Store)
Vue.directive('noise', noiseBg)

const URL_HOST_PATH_RE = /^([a-z0-9-]{1,63}\.)+\w+(:\d+)?\/[A-Za-z0-9-._~:/?#[\]%@!$&'()*+,;=]*$/
const ADD_CTX_BTN = { icon: 'icon_plus_v2', hidden: false }

// --- Vue Component ---
export default {
  components: {
    CtxMenu,
    BookmarksDashboard,
    DefaultTabsDashboard,
    TabsDashboard,
    BookmarksPanel,
    TabsPanel,
    WindowInput,
    PinnedDock,
  },

  data() {
    return {
      width: 250,
      navBtnWidth: 34,
      dragMode: false,
      pointerMode: 'none',
      pointerExpanding: false,
      dashboard: null,
      loading: [],
      loadingTimers: [],
    }
  },

  /**
   * --- Computed ---
   */
  computed: {
    /**
     * Get window-input-panel position
     */
    windowInputPos() {
      return State.panelIndex === -5 ? 'center' : 'right'
    },

    /**
     * Get list of navigational buttons
     */
    nav() {
      let cap = ~~(this.width / this.navBtnWidth)
      if (!State.hideSettingsBtn) cap -= 1
      let halfCap = cap >> 1
      let invModCap = cap % halfCap ^ 1

      let i, k, r
      let out = []
      let hideOffset = 0

      for (i = 0; i < State.panels.length; i++) {
        const btn = State.panels[i]
        btn.loading = this.loading[i]
        btn.hidden = false
        btn.inactive = false

        // Hide buttons
        if (
          (!State.bookmarksPanel && i === 0) ||
          (!State.private && i === 1) ||
          (State.private && i > 1)
        ) {
          btn.hidden = true
          btn.inactive = true
          if (State.panelIndex > i) hideOffset++
        }

        btn.updated = this.updatedPanels.includes(i)
        if (i === State.panelIndex) btn.updated = false

        out.push(btn)
      }

      if (!State.private && !State.hideAddBtn) {
        ADD_CTX_BTN.hidden = false
        out.push(ADD_CTX_BTN)
      }

      if (!State.navBarInline) return out

      let p = State.panelIndex - hideOffset
      let vis = out.length - hideOffset
      for (i = 0, k = 0, r = 0; i < out.length; i++) {
        if (out[i].hidden) continue
        if (p - k > halfCap && vis - k > cap) out[i].hidden = true
        if (p - k < invModCap - halfCap && k > cap - 1) out[i].hidden = true
        if (!out[i].hidden) out[i].relIndex = r++
        k++
      }

      return out
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
    browser.tabs.onUpdated.addListener(this.onUpdatedTab, {
      properties: [
        'audible',
        'discarded',
        'favIconUrl',
        'hidden',
        'mutedInfo',
        'pinned',
        'status',
        'title',
      ],
    })
    browser.tabs.onRemoved.addListener(this.onRemovedTab)
    browser.tabs.onMoved.addListener(this.onMovedTab)
    browser.tabs.onDetached.addListener(this.onDetachedTab)
    browser.tabs.onAttached.addListener(this.onAttachedTab)
    browser.tabs.onActivated.addListener(this.onActivatedTab)

    // --- Handle resizing of sidebar
    const onresize = Utils.asap(() => this.updateNavSize(), 120)
    window.addEventListener('resize', onresize.func)

    // --- Handle global events
    EventBus.$on('openDashboard', panelIndex => this.openDashboard(panelIndex))
    EventBus.$on('panelLoadingStart', panelIndex => this.onPanelLoadingStart(panelIndex))
    EventBus.$on('panelLoadingEnd', panelIndex => this.onPanelLoadingEnd(panelIndex))
    EventBus.$on('panelLoadingOk', panelIndex => this.onPanelLoadingOk(panelIndex))
    EventBus.$on('panelLoadingErr', panelIndex => this.onPanelLoadingErr(panelIndex))
    EventBus.$on('dynVarChange', this.recalcDynVars)
    EventBus.$on('dragStart', info => (State.dragNodes = info))
    EventBus.$on('outerDragStart', info => (State.dragNodes = info))
    EventBus.$on('panelSwitched', () => setTimeout(() => this.recalcPanelBounds(), 256))

    // Handle key navigation
    EventBus.$on('keyActivate', () => this.onKeyActivate())
    EventBus.$on('keyUp', () => this.onKeySelect(-1))
    EventBus.$on('keyDown', () => this.onKeySelect(1))
    EventBus.$on('keyUpShift', () => this.onKeySelectExpand(-1))
    EventBus.$on('keyDownShift', () => this.onKeySelectExpand(1))
    EventBus.$on('keyMenu', () => this.onKeyMenu())
    EventBus.$on('selectAll', () => this.onKeySelectAll())
  },

  // --- Mounted Hook ---
  mounted() {
    setTimeout(() => this.updateNavSize(), 256)
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
    onWheel(e) {
      if (State.ctxMenu) Actions.closeCtxMenu()

      if (State.hScrollThroughPanels) {
        if (e.deltaX > 0) return Actions.switchPanel(1)
        if (e.deltaX < 0) return Actions.switchPanel(-1)
      }
    },

    /**
     * Navigation wheel event handler
     */
    onNavWheel(e) {
      if (e.deltaY > 0) return Actions.switchPanel(1)
      if (e.deltaY < 0) return Actions.switchPanel(-1)
    },

    /**
     * MouseMove event handler
     */
    onMouseMove(e) {
      if (!this.selectionStart) return

      if (this.selectionStart && !this.selection && Math.abs(e.clientY - this.selectY) > 5) {
        Actions.closeCtxMenu()
        this.selection = true
        State.selected.push(this.selectionStart.id) // ..if group, add children too

        let eventName
        if (this.selectionStart.type === 'tab') eventName = 'selectTab'
        if (this.selectionStart.type === 'bookmark') eventName = 'selectBookmark'
        EventBus.$emit(eventName, this.selectionStart.id)

        this.recalcPanelBounds()

        const scroll = this.panelScrollEl ? this.panelScrollEl.scrollTop : 0
        const startY = this.selectionStart.clientY - this.panelTopOffset + scroll
        const firstItem = this.itemSlots.find(s => s.start <= startY && s.end >= startY)
        if (firstItem) {
          this.selectionStart.clientY = firstItem.center + this.panelTopOffset - scroll
        }
        return
      }

      if (this.selection) {
        const scroll = this.panelScrollEl ? this.panelScrollEl.scrollTop : 0
        const startY = this.selectionStart.clientY - this.panelTopOffset + scroll
        const y = e.clientY - this.panelTopOffset + scroll
        const topY = Math.min(startY, y)
        const bottomY = Math.max(startY, y)

        const slotUnderCursor = this.itemSlots.find(s => s.start <= y && s.end >= y)
        if (slotUnderCursor) {
          if (slotUnderCursor.id === this.slotUnderCursor) return
          this.slotUnderCursor = slotUnderCursor.id
        } else {
          this.slotUnderCursor = undefined
        }

        for (let slot of this.itemSlots) {
          // Inside
          if (slot.end >= topY && slot.start + 1 <= bottomY) {
            if (!State.selected.includes(slot.id)) {
              State.selected.push(slot.id)
              if (slot.type === 'tab') EventBus.$emit('selectTab', slot.id)
              if (slot.type === 'bookmark') EventBus.$emit('selectBookmark', slot.id)
            }
          } else {
          // Outside
            if (State.selected.includes(slot.id)) {
              State.selected.splice(State.selected.indexOf(slot.id), 1)
              if (slot.type === 'tab') EventBus.$emit('deselectTab', slot.id)
              if (slot.type === 'bookmark') EventBus.$emit('deselectBookmark', slot.id)
            }
          }
        }
      }
    },

    /**
     * Start selection
     */
    startSelection(info) {
      this.selectionStart = info
      this.selectY = info.clientY
    },

    /**
     * Stop selection
     */
    stopSelection() {
      this.selectionStart = null
      this.selection = false
      this.selectY = 0

      if (State.selected.length) {
        const target = State.selected[State.selected.length - 1]
        if (typeof target === 'number') EventBus.$emit('openTabMenu', target)
        if (typeof target === 'string') EventBus.$emit('openBookmarkMenu', target)
      }
    },

    /**
     * Drag move handler
     */
    onDragMove(e) {
      if (!this.dragMode) return
      if (!this.$refs.pointer) return
      if (!this.itemSlots) return

      let dragNode = State.dragNodes ? State.dragNodes[0] : null
      let scroll = this.panelScrollEl ? this.panelScrollEl.scrollTop : 0
      let y = e.clientY - this.panelTopOffset + scroll
      let x = e.clientX - this.panelLeftOffset
      
      // Hide pointer if cursor out of drop area
      if (!this.pointerYLock && y < 0) {
        this.pointerMode = 'none'
        this.pointerYLock = true
        return
      }
      if (this.pointerYLock && this.pointerMode === 'none' && y > 0) {
        this.pointerYLock = false
        if (!this.pointerXLock) {
          this.pointerPos--
          this.pointerMode = 'between'
        }
      }
      if (!this.pointerXLock && (x < 0 || e.clientX > this.width)) {
        this.pointerMode = 'none'
        this.pointerXLock = true
        return
      }
      if (this.pointerXLock && this.pointerMode === 'none' && (x > 0 && e.clientX < this.width)) {
        this.pointerXLock = false
        if (!this.pointerYLock) {
          this.pointerPos--
          this.pointerMode = 'between'
        }
      }

      if (this.pointerXLock || this.pointerYLock) return

      // Empty
      if (this.itemSlots.length === 0) {
        const pos = this.panelTopOffset - scroll - 12
        if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== pos) {
          this.pointerPos = pos
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.pointerMode = 'between'
          this.dropParent = -1
          this.dropIndex = State.panels[State.panelIndex].startIndex
        }
        return
      }

      // End
      if (y > this.itemSlots[this.itemSlots.length - 1].bottom) {
        const slot = this.itemSlots[this.itemSlots.length - 1]
        const pos = slot.end - 12 + this.panelTopOffset - scroll
        if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== pos) {
          this.pointerPos = pos
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.pointerMode = 'between'
          this.dropParent = slot.parent
          if (slot.folded) this.dropIndex = -1
          else this.dropIndex = slot.index + 1
        }
        return
      }

      for (let i = 0; i < this.itemSlots.length; i++) {
        const slot = this.itemSlots[i]
        // Skip
        if (y > slot.end || y < slot.start) continue
        // Between
        if (slot.in ? y < slot.top : y < slot.center) {
          const prevSlot = this.itemSlots[i - 1]
          const pos = slot.start - 12 + this.panelTopOffset - scroll
          if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== pos) {
            this.pointerPos = pos
            this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
            this.pointerMode = 'between'
            let dragNodeIsTab = dragNode ? dragNode.type === 'tab' : false
  
            if (!prevSlot) {
              this.dropParent = -1
              this.dropIndex = slot.index
              break
            }

            if (prevSlot.id === slot.parent) {
              // First child
              this.dropParent = slot.parent
              this.dropIndex = slot.index
            } else if (dragNodeIsTab && prevSlot.folded) {
              // After folded group
              this.dropParent = prevSlot.parent
              this.dropIndex = slot.index
            } else {
              // Second-Last in group
              this.dropParent = prevSlot.parent
              this.dropIndex = prevSlot.index + 1
            }
          }
          break
        }
        // Inside
        if (slot.in && y < slot.bottom && (State.tabsTree || !State.panelIndex)) {
          const pos = slot.center - 12 + this.panelTopOffset - scroll
          if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== pos) {
            this.pointerPos = pos
            this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
            this.pointerMode = slot.folded ? 'inside-fold' : 'inside-exp'
            this.dropParent = slot.id
            if (slot.type === 'tab') this.dropIndex = slot.index + 1
            else this.dropIndex = 0
          }
          if (!this.pointerExpLock && slot.folded && x < 36) {
            slot.folded = false
            this.pointerExpLock = true
            this.expandDropTarget()
            this.pointerMode = 'inside-exp'
          }
          if (this.pointerExpLock && x > 36) {
            this.pointerExpLock = false
          }
          if (!this.pointerExpLock && !slot.folded && x < 36) {
            slot.folded = true
            this.pointerExpLock = true
            this.foldDropTarget()
            this.pointerMode = 'inside-fold'
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
        Actions.closeCtxMenu()
      }, 250)
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

      if (e.button < 2) {
        if (this.selectionStart) this.stopSelection()
      }

      if (e.button > 0) {
        Actions.closeCtxMenu()
        Actions.resetSelection()
      }
    },

    /**
     * Mouse up event handler
     */
    onMouseUp(e) {
      if (e.button === 0) {
        Actions.closeCtxMenu()
        Actions.resetSelection()
      }

      if (e.button === 2) {
        if (this.selectionStart) this.stopSelection()
      }
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
      this.itemSlots = panelVN.getItemsBounds()
      if (!this.itemSlots) return

      // Get start coorinate of drop slots
      this.panelTopOffset = panelVN.getTopOffset()
      this.panelLeftOffset = this.$refs.box.offsetLeft

      // Get scroll element
      this.panelScrollEl = panelVN.getScrollEl()

      // Turn on drag mode
      this.dragMode = true
      
      // Select dragged nodes
      if (State.dragNodes) {
        for (let n of State.dragNodes) {
          if (n.type === 'tab') EventBus.$emit('selectTab', n.id)
          else EventBus.$emit('selectBookmark', n.id)
        }
      }
    },

    /**
     * Drag leave event handler
     */
    onDragLeave(e) {
      if (e && e.relatedTarget) return
      if (State.dragNodes) {
        for (let n of State.dragNodes) {
          if (n.type === 'tab') EventBus.$emit('deselectTab', n.id)
          else EventBus.$emit('deselectBookmark', n.id)
        }
      }
      this.resetDrag()
    },

    /**
     * Drop event handler
     */
    onDrop(e) {
      if (this.dropParent === undefined) this.dropParent = -1
      if (this.dropParent === null) this.dropParent = -1

      if (State.panels[State.panelIndex].tabs) {
        Actions.dropToTabs(e, this.dropIndex, this.dropParent, State.dragNodes)
      }
      if (State.panels[State.panelIndex].bookmarks) {
        if (this.pointerMode.startsWith('inside')) this.dropIndex = 0
        Actions.dropToBookmarks(e, this.dropIndex, this.dropParent, State.dragNodes,)
      }

      if (State.dragNodes) {
        if (State.dragNodes[0].type === 'tab') EventBus.$emit('deselectTab')
        else EventBus.$emit('deselectBookmark')
      }
      this.resetDrag()
      State.dragNodes = null
    },

    /**
     * Navigation button click hadler
     */
    onNavClick(i) {
      if (i === State.panels.length) return this.openDashboard(-1)
      if (State.panelIndex !== i) {
        Actions.switchToPanel(i)
      } else if (State.panels[i].cookieStoreId) {
        if (State.dashboardOpened) {
          this.closeDashboard()
        } else {
          browser.tabs.create({
            windowId: State.windowId,
            cookieStoreId: State.panels[i].cookieStoreId,
          })
        }
      }
    },

    /**
     * Navigation button dragenter handler
     */
    onNavDragEnter(i) {
      // Skip last button (AddNewContianer)
      if (i === this.nav.length - 1) return
      this.navDragEnterIndex = i
      if (this.navDragEnterTimeout) clearTimeout(this.navDragEnterTimeout)
      this.navDragEnterTimeout = setTimeout(() => {
        Actions.switchToPanel(i)
      }, 300)
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
      const panel = Utils.cloneObject(DEFAULT_CTX_TABS_PANEL)
      panel.cookieStoreId = contextualIdentity.cookieStoreId
      panel.name = contextualIdentity.name
      panel.colorCode = contextualIdentity.colorCode
      panel.color = contextualIdentity.color
      panel.icon = contextualIdentity.icon
      panel.iconUrl = contextualIdentity.iconUrl

      State.containers.push(contextualIdentity)
      State.panels.push(panel)
      State.panelsMap[panel.cookieStoreId] = panel

      // Check if we have some updates
      // for container with this name
      if (State.windowFocused) {
        State.panelIndex = State.panels.length - 1
        State.lastPanelIndex = State.panelIndex

        if (State.dashboardOpened) this.openDashboard(State.panelIndex)

        Actions.savePanels()
      }

      // Update panels ranges
      Actions.updatePanelsRanges()
    },

    /**
     * contextualIdentities.onRemoved
     */
    async onRemovedContainer({ contextualIdentity }) {
      let id = contextualIdentity.cookieStoreId

      // Find container
      let ctxIndex = State.containers.findIndex(c => c.cookieStoreId === id)
      let ctrIndex = State.panels.findIndex(c => c.cookieStoreId === id)
      if (ctxIndex === -1 || ctrIndex === -1) return
      State.panels[ctrIndex].noEmpty = false

      // Close tabs
      const orphanTabs = State.tabs.filter(t => t.cookieStoreId === id)
      State.removingTabs = orphanTabs.map(t => t.id)
      await browser.tabs.remove([...State.removingTabs])

      // Remove container
      State.containers.splice(ctxIndex, 1)
      State.panels.splice(ctrIndex, 1)
      Vue.delete(State.panelsMap, id)

      // Switch to prev panel
      if (State.panelIndex >= State.panels.length) {
        State.panelIndex = State.panels.length - 1
        State.lastPanelIndex = State.panelIndex
      }

      if (State.windowFocused) {
        Actions.updateReqHandler()
        Actions.savePanels()
      }

      // Update panels ranges
      Actions.updatePanelsRanges()
    },

    /**
     * contextualIdentities.onUpdated
     */
    onUpdatedContainer({ contextualIdentity }) {
      let id = contextualIdentity.cookieStoreId
      let ctxIndex = State.containers.findIndex(c => c.cookieStoreId === id)
      let panelIndex = State.panels.findIndex(c => c.cookieStoreId === id)
      if (ctxIndex === -1 || panelIndex === -1) return

      State.containers.splice(ctxIndex, 1, contextualIdentity)
      State.panels[panelIndex].color = contextualIdentity.color
      State.panels[panelIndex].colorCode = contextualIdentity.colorCode
      State.panels[panelIndex].icon = contextualIdentity.icon
      State.panels[panelIndex].iconUrl = contextualIdentity.iconUrl
      State.panels[panelIndex].name = contextualIdentity.name

      if (State.windowFocused) Actions.savePanels()
    },
    // ---

    // --- Tabs Handlers ---
    /**
     * tabs.onCreated
     */
    onCreatedTab(tab) {
      if (tab.windowId !== State.windowId) return

      if (State.selOpenedBookmarks && State.bookmarksUrlMap && State.bookmarksUrlMap[tab.url]) {
        for (let b of State.bookmarksUrlMap[tab.url]) {
          b.opened = true
        }
      }

      Actions.closeCtxMenu()
      Actions.resetSelection()

      // If new tab is out of panel, move it to the end of this panel
      let panel = State.panelsMap[tab.cookieStoreId]
      let endIndex = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex
      if (tab.index > endIndex || tab.index < panel.startIndex) {
        browser.tabs.move(tab.id, { index: endIndex })
      }

      // Shift tabs after inserted one. (NOT detected by vue)
      for (let i = tab.index; i < State.tabs.length; i++) {
        State.tabs[i].index++
      }

      // Set default custom props (for reactivity)
      tab.isParent = false
      tab.folded = false
      if (tab.parentId === undefined) tab.parentId = -1
      else tab.openerTabId = tab.parentId
      tab.lvl = 0
      tab.invisible = false
      tab.favIconUrl = ''
      tab.host = ''
      if (tab.url) tab.host = tab.url.split('/')[2] || ''

      // Put new tab in tabs list
      State.tabsMap[tab.id] = tab
      State.tabs.splice(tab.index, 0, tab)

      // Put new tab in panel
      if (panel && panel.tabs) {
        let targetIndex = tab.index - panel.startIndex
        if (targetIndex <= panel.tabs.length) {
          panel.tabs.splice(tab.index - panel.startIndex, 0, tab)
          Actions.updatePanelsRanges()
        }
      }

      // Update tree
      if (State.tabsTree && !tab.pinned) {
        if (tab.openerTabId === undefined) {
          // Set tab tree level
          const nextTab = State.tabs[tab.index + 1]
          if (nextTab && tab.cookieStoreId === nextTab.cookieStoreId) {
            tab.parentId = nextTab.parentId
            tab.lvl = nextTab.lvl
          }
        } else {
          tab.parentId = tab.openerTabId
          const start = panel.startIndex
          const parent = State.tabsMap[tab.parentId]
          Actions.updateTabsTree(start, tab.index + 1)
          if (State.autoFoldTabs && parent && !parent.folded) {
            Actions.expTabsBranch(tab.parentId)
          }
        }

        Actions.saveTabsTree()
      }

      // Update succession
      if (State.activateAfterClosing !== 'none') {
        const activeTab = State.tabsMap[State.activeTabId]
        if (activeTab && activeTab.active) {
          const target = Utils.findSuccessorTab(State, activeTab)
          if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
        }
      }

      Actions.recalcPanelScroll()
    },

    /**
     * tabs.onUpdated
     */
    onUpdatedTab(tabId, change, tab) {
      if (tab.windowId !== State.windowId) return

      const localTab = State.tabsMap[tabId]
      if (!localTab) return

      // Url
      if (change.hasOwnProperty('url')) {
        if (change.url !== localTab.url) {
          if (State.selOpenedBookmarks && State.bookmarksUrlMap) {
            if (State.bookmarksUrlMap[localTab.url]) {
              for (let b of State.bookmarksUrlMap[localTab.url]) {
                b.opened = false
              }
            }
            if (State.bookmarksUrlMap[change.url]) {
              for (let b of State.bookmarksUrlMap[change.url]) {
                b.opened = true
              }
            }
          }
          localTab.host = change.url.split('/')[2] || ''
          if (change.url.startsWith('about:')) localTab.favIconUrl = ''
          else Actions.saveTabsTree()
        }
      }

      // Handle favicon change
      // If favicon is base64 string - store it in cache
      if (change.favIconUrl) {
        if (change.favIconUrl.startsWith('data:')) {
          const hostname = tab.url.split('/')[2]
          Actions.setFavicon(hostname, change.favIconUrl)
        } else if (change.favIconUrl.startsWith('chrome:')) {
          change.favIconUrl = ''
        }
      }

      // Handle unpinned tab
      if (change.hasOwnProperty('pinned') && !change.pinned) {
        let panel = State.panelsMap[tab.cookieStoreId]
        if (!panel) return
        panel.tabs.splice(localTab.index - panel.startIndex + 1, 0, localTab)
        Actions.updatePanelsRanges()
        if (panel && panel.tabs) browser.tabs.move(tabId, { index: panel.endIndex })
        if (tab.active) Actions.setPanel(panel.index)
      }

      // Handle pinned tab
      if (change.hasOwnProperty('pinned') && change.pinned) {
        let panel = State.panelsMap[tab.cookieStoreId]
        panel.tabs.splice(localTab.index - panel.startIndex, 1)
        Actions.updatePanelsRanges()
        if (panel.noEmpty && panel.tabs.length === 1) {
          browser.tabs.create({
            windowId: State.windowId,
            index: panel.startIndex,
            cookieStoreId: panel.cookieStoreId,
          })
        }
      }

      // Handle title change
      let inact = Date.now() - tab.lastAccessed
      if (change.hasOwnProperty('title') && !tab.active && inact > 5000) {
        // If prev url starts with 'http' and current url same as prev
        if (localTab.url.startsWith('http') && localTab.url === tab.url) {
          // and if title doesn't looks like url
          if (!URL_HOST_PATH_RE.test(localTab.title) && !URL_HOST_PATH_RE.test(tab.title)) {
            // Mark tab as updated
            if (tab.pinned && State.pinnedTabsPosition !== 'panel') {
              this.$set(State.updatedTabs, tab.id, -1)
            } else {
              let panel = State.panelsMap[tab.cookieStoreId]
              this.$set(State.updatedTabs, tab.id, panel.index)
            }
          }
        }
      }

      // Update tab object
      Object.assign(localTab, change)

      if (change.hasOwnProperty('pinned') && change.pinned) {
        Actions.updateTabsTree()
      }
    },

    /**
     * tabs.onRemoved
     */
    onRemovedTab(tabId, info) {
      if (info.windowId !== State.windowId) return

      if (!State.removingTabs) State.removingTabs = []
      else State.removingTabs.splice(State.removingTabs.indexOf(tabId), 1)

      if (!State.removingTabs.length) {
        Actions.closeCtxMenu()
        Actions.resetSelection()
      }

      // Try to get removed tab and his panel
      if (!State.tabsMap[tabId]) return
      let creatingNewTab
      const tab = State.tabsMap[tabId]
      const panel = State.panelsMap[tab.cookieStoreId]

      // Recreate locked tab
      if (!tab.pinned && panel && panel.lockedTabs && tab.url.startsWith('http')) {
        browser.tabs.create({
          windowId: State.windowId,
          index: tab.index,
          url: tab.url,
          openerTabId: tab.parentId > -1 ? tab.parentId : undefined,
          cookieStoreId: tab.cookieStoreId,
        })
        creatingNewTab = true
      }

      // No-empty
      if (!tab.pinned && panel && panel.noEmpty && panel.tabs && panel.tabs.length === 1) {
        if (!creatingNewTab) {
          browser.tabs.create({
            windowId: State.windowId,
            index: panel.startIndex,
            cookieStoreId: panel.id,
            active: true,
          })
        }
      }

      // Handle child tabs
      if (State.tabsTree && tab.isParent) {
        const toRemove = []
        for (let i = tab.index + 1; i < State.tabs.length; i++) {
          const t = State.tabs[i]
          if (t.lvl <= tab.lvl) break

          // Remove folded tabs
          if (tab.folded && State.rmFoldedTabs) {
            if (!State.removingTabs.includes(t.id)) toRemove.push(t.id)
          }

          // Down level
          if (t.parentId === tab.id) t.parentId = tab.parentId
        }

        // Remove child tabs
        if (State.rmFoldedTabs && toRemove.length) Actions.removeTabs(toRemove)
      }

      // Update last active tab if needed
      if (tab.active && panel && panel.lastActiveTab >= 0) {
        panel.lastActiveTab = -1
      }

      // Shift tabs after removed one. (NOT detected by vue)
      for (let i = tab.index + 1; i < State.tabs.length; i++) {
        State.tabs[i].index--
      }
      State.tabsMap[tabId] = undefined
      State.tabs.splice(tab.index, 1)

      // Remove tab from panel
      if (panel && panel.tabs) {
        if (!tab.pinned) panel.tabs.splice(tab.index - panel.startIndex, 1)
        Actions.updatePanelsRanges()
      }

      // Remove updated flag
      this.$delete(State.updatedTabs, tabId)

      if (!State.removingTabs.length) Actions.recalcPanelScroll()

      // Update tree
      if (State.tabsTree && !State.removingTabs.length) {
        const startIndex = panel ? panel.startIndex : 0
        const endIndex = panel ? panel.endIndex + 1 : -1
        Actions.updateTabsTree(startIndex, endIndex)
        Actions.saveTabsTree()
      }

      // Update succession
      if (!State.removingTabs.length && State.activateAfterClosing !== 'none') {
        const activeTab = State.tabsMap[State.activeTabId]
        if (activeTab && activeTab.active) {
          const target = Utils.findSuccessorTab(State, activeTab)
          if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
        }
      }

      // Remove opened flag from bookmark
      if (State.selOpenedBookmarks && State.bookmarksUrlMap && State.bookmarksUrlMap[tab.url]) {
        for (let t of State.tabs) {
          if (t.url === tab.url) return
        }
        for (let b of State.bookmarksUrlMap[tab.url]) {
          b.opened = false
        }
      }
    },

    /**
     * tabs.onMoved
     */
    onMovedTab(id, info) {
      if (info.windowId !== State.windowId) return

      if (!State.movingTabs) State.movingTabs = []
      else State.movingTabs.splice(State.movingTabs.indexOf(id), 1)

      if (!State.movingTabs.length) {
        Actions.closeCtxMenu()
        Actions.resetSelection()
      }

      // Move tab in tabs array
      let movedTab = State.tabs.splice(info.fromIndex, 1)[0]
      if (!movedTab) {
        const i = State.tabs.findIndex(t => t.id === id)
        movedTab = State.tabs.splice(i, 1)[0]
      }
      if (!movedTab) return

      State.tabs.splice(info.toIndex, 0, movedTab)
      Actions.recalcPanelScroll()

      // Update tabs indexes.
      const minIndex = Math.min(info.fromIndex, info.toIndex)
      const maxIndex = Math.max(info.fromIndex, info.toIndex)
      for (let i = minIndex; i <= maxIndex; i++) {
        if (State.tabs[i]) State.tabs[i].index = i
      }

      // Move tab in panel
      if (!State.tabsMap[id].pinned) {
        const panel = State.panelsMap[movedTab.cookieStoreId]
        if (panel && panel.tabs) {
          let t = panel.tabs[info.fromIndex - panel.startIndex]
          if (t && t.id === movedTab.id) {
            panel.tabs.splice(info.fromIndex - panel.startIndex, 1)
          }
          panel.tabs.splice(info.toIndex - panel.startIndex, 0, movedTab)
          Actions.updatePanelsRanges()
        }
      }

      // Calc tree levels
      if (State.tabsTree && !State.movingTabs.length) {
        const panel = State.panels[State.panelIndex]
        const panelOk = panel && panel.tabs
        const startIndex = panelOk ? panel.startIndex : 0
        const endIndex = panelOk ? panel.endIndex + 1 : -1
        Actions.updateTabsTree(startIndex, endIndex)
        Actions.saveTabsTree()
      }

      // Update succession
      if (!State.movingTabs.length && State.activateAfterClosing !== 'none') {
        const activeTab = State.tabsMap[State.activeTabId]
        if (activeTab && activeTab.active) {
          const target = Utils.findSuccessorTab(State, activeTab)
          if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
        }
      }
    },

    /**
     * tabs.onDetached
     */
    onDetachedTab(id, info) {
      if (info.oldWindowId !== State.windowId) return
      const tab = State.tabsMap[id]
      if (tab) tab.folded = false
      this.onRemovedTab(id, { windowId: State.windowId })
    },

    /**
     * tabs.onAttached
     */
    async onAttachedTab(id, info) {
      if (info.newWindowId !== State.windowId) return

      if (!State.attachingTabs) State.attachingTabs = []
      const ai = State.attachingTabs.findIndex(t => t.id === id)

      let tab
      if (ai > -1) {
        tab = State.attachingTabs.splice(ai, 1)[0]
      } else {
        tab = await browser.tabs.get(id)
      }

      tab.windowId = State.windowId
      tab.index = info.newPosition

      this.onCreatedTab(tab)

      if (tab.active) browser.tabs.update(tab.id, { active: true })
    },

    /**
     * tabs.onActivated
     */
    onActivatedTab(info) {
      if (info.windowId !== State.windowId) return

      const currentPanel = State.panels[State.panelIndex]

      // Reset selection
      Actions.resetSelection()

      // Update previous active tab and store his id
      let prevActive = State.tabsMap[info.previousTabId]
      if (prevActive) {
        prevActive.active = false

        if (!State.actTabs) State.actTabs = []
        if (State.actTabs.length > 128) State.actTabs = State.actTabs.slice(32)
        State.actTabs.push(prevActive.id)
      }

      // Update tabs and find activated one
      let tab = State.tabsMap[info.tabId]
      if (!tab) return
      tab.active = true
      State.activeTabId = info.tabId

      // Remove updated flag
      this.$delete(State.updatedTabs, info.tabId)

      // Find panel of activated tab
      if (tab.pinned && State.pinnedTabsPosition !== 'panel') return
      const tabPanel = State.panelsMap[tab.cookieStoreId]
      if (!tabPanel) return

      // Switch to activated tab's panel
      if (!currentPanel || !currentPanel.lockedPanel) {
        Actions.setPanel(tabPanel.index)
      }

      // Reopen dashboard
      if (State.dashboardOpened) {
        if (this.dashboard.cookieStoreId !== this.nav[State.panelIndex].cookieStoreId) {
          this.openDashboard(State.panelIndex)
        }
      }

      // Auto expand tabs group
      if (State.autoExpandTabs && tab.isParent && tab.folded && !this.dragMode) {
        let prevActiveChild
        for (let i = tab.index + 1; i < State.tabs.length; i++) {
          if (State.tabs[i].lvl <= tab.lvl) break
          if (State.tabs[i].id === info.previousTabId) {
            prevActiveChild = true
            break
          }
        }
        if (!prevActiveChild) Actions.expTabsBranch(tab.id)
      }
      if (tab.invisible) {
        Actions.expTabsBranch(tab.parentId)
      }

      tabPanel.lastActiveTab = info.tabId
      if (!tab.pinned) EventBus.$emit('scrollToTab', tabPanel.index, info.tabId)

      // If activated tab is group - reinit it
      if (Utils.isGroupUrl(tab.url)) {
        const groupId = Utils.getGroupId(tab.url)
        browser.runtime.sendMessage({
          name: 'reinit_group',
          windowId: State.windowId,
          arg: groupId,
        })
      }

      // Update succession
      if (State.activateAfterClosing !== 'none') {
        const target = Utils.findSuccessorTab(State, tab)
        if (target) browser.tabs.moveInSuccession([tab.id], target.id)
      }
    },

    /**
     * Start panel loading
     */
    onPanelLoadingStart(i) {
      this.loading[i] = true
      this.loading = [...this.loading]
      if (this.loadingTimers[i]) {
        clearTimeout(this.loadingTimers[i])
        this.loadingTimers[i] = null
      }
    },

    /**
     * Stop panel loading
     */
    onPanelLoadingEnd(i) {
      this.loading[i] = false
      this.loading = [...this.loading]
    },

    /**
     * Set panel state to 'ok' for 2s
     */
    onPanelLoadingOk(i) {
      this.loading[i] = 'ok'
      this.loading = [...this.loading]
      this.loadingTimers[i] = setTimeout(() => {
        this.onPanelLoadingEnd(i)
        this.loadingTimers[i] = null
      }, 2000)
    },

    /**
     * Set panel state to 'err' or 2s
     */
    onPanelLoadingErr(i) {
      this.loading[i] = 'err'
      this.loading = [...this.loading]
      this.loadingTimers[i] = setTimeout(() => {
        this.onPanelLoadingEnd(i)
        this.loadingTimers[i] = null
      }, 2000)
    },

    /**
     * Handle shortcut 'activate'
     */
    onKeyActivate() {
      if (State.ctxMenu) {
        EventBus.$emit('activateOption')
        return
      }

      this.recalcPanelBounds()
      // Get type
      if (!this.itemSlots || !this.itemSlots.length) return
      const type = this.itemSlots[0].type

      // Get target
      let targetId
      if (!State.selected || !State.selected.length) {
        if (type !== 'tab') return

        const activePanel = State.panels[State.panelIndex]
        if (!activePanel || !activePanel.tabs) return
        const activeTab = activePanel.tabs.find(t => t.active)
        if (!activeTab) return

        targetId = activeTab.id
      } else {
        targetId = State.selected[0]
      }

      if (type === 'tab') {
        const tab = State.tabsMap[targetId]
        if (!tab) return
        if (tab.active) {
          Actions.resetSelection()
          if (tab.isParent) Actions.toggleBranch(tab.id)
        }
        browser.tabs.update(targetId, { active: true })
      }

      if (type === 'bookmark') {
        const target = State.bookmarksMap[targetId]
        if (!target) return

        if (target.type === 'folder') {
          if (target.expanded) Actions.foldBookmark(target.id)
          else Actions.expandBookmark(target.id)
        }

        if (target.type === 'bookmark') {
          if (State.openBookmarkNewTab) {
            let index = State.panelsMap[DEFAULT_CTX_ID].endIndex + 1
            browser.tabs.create({ index, url: target.url, active: true })
          } else {
            browser.tabs.update({ url: target.url })
            if (State.openBookmarkNewTab && !State.panels[0].lockedPanel) {
              Actions.goToActiveTabPanel()
            }
          }
        }
      }
    },

    /**
     * Change selection
     */
    onKeySelect(dir) {
      if (!dir) return

      if (State.ctxMenu) {
        EventBus.$emit('selectOption', dir)
        return
      }

      this.recalcPanelBounds()
      if (!this.itemSlots || !this.itemSlots.length) return

      // Tabs or Bookmarks?
      const type = this.itemSlots[0].type
      const selectEvent = type === 'tab' ? 'selectTab' : 'selectBookmark'
      const deselectEvent = type === 'tab' ? 'deselectTab' : 'deselectBookmark'
      let target = null

      // Change current selection
      if (State.selected.length) {
        const selId = State.selected[0]
        const selIndex = this.itemSlots.findIndex(s => s.id === selId)
        target = this.itemSlots[selIndex + dir]
        if (target) {
          Actions.resetSelection()
          EventBus.$emit(deselectEvent, selId)
          EventBus.$emit(selectEvent, target.id)
          State.selected = [target.id]
        }
      }

      // No selected items -> select first/last
      if (!State.selected.length) {
        const panel = State.panels[State.panelIndex]
        let activeTab, activeSlot
        if (panel && panel.tabs) activeTab = panel.tabs.find(t => t.active)
        if (activeTab) activeSlot = this.itemSlots.find(s => s.id === activeTab.id)
        // From start / end
        if (dir > 0) {
          target = activeSlot ? activeSlot : this.itemSlots[0]
          EventBus.$emit(selectEvent, target.id)
          State.selected.push(target.id)
        } else {
          target = activeSlot ? activeSlot : this.itemSlots[this.itemSlots.length - 1]
          EventBus.$emit(selectEvent, target.id)
          State.selected.push(target.id)
        }
      }

      // Update scroll position
      if (target) {
        const h = this.panelScrollEl.offsetHeight
        const s = this.panelScrollEl.scrollTop
        if (target.start < s + 64) {
          this.panelScrollEl.scrollTop = target.start - 64
        }
        if (target.end > h + s - 64) {
          this.panelScrollEl.scrollTop = target.end - h + 64
        }
      }
    },

    /**
     * Expand selection to provided direction
     */
    onKeySelectExpand(dir) {
      if (!dir) return
      this.recalcPanelBounds()
      if (!this.itemSlots || !this.itemSlots.length) return

      // Tabs or Bookmarks?
      const type = this.itemSlots[0].type
      const selectEvent = type === 'tab' ? 'selectTab' : 'selectBookmark'
      const deselectEvent = type === 'tab' ? 'deselectTab' : 'deselectBookmark'
      let target

      // No selected items -> select first/last
      if (!State.selected.length) {
        // From start / end
        if (dir > 0) {
          target = this.itemSlots[0]
          EventBus.$emit(selectEvent, target.id)
          State.selected.push(target.id)
        } else {
          target = this.itemSlots[this.itemSlots.length - 1]
          EventBus.$emit(selectEvent, target.id)
          State.selected.push(target.id)
        }
      }

      // Change current selection
      if (State.selected.length) {
        if (State.selected.length === 1) {
          const selId = State.selected[0]
          let index = this.itemSlots.findIndex(t => t.id === selId)
          this.selStartIndex = index
          this.selEndIndex = index + dir
        } else {
          this.selEndIndex = this.selEndIndex + dir
        }
        if (this.selEndIndex < 0) this.selEndIndex = 0
        if (this.selEndIndex >= this.itemSlots.length) this.selEndIndex = this.itemSlots.length - 1

        let minIndex = Math.min(this.selStartIndex, this.selEndIndex)
        let maxIndex = Math.max(this.selStartIndex, this.selEndIndex)

        const toSelect = []
        const all = []
        for (let i = minIndex; i <= maxIndex; i++) {
          const id = this.itemSlots[i].id
          if (!State.selected.includes(id)) {
            toSelect.push(id)
            target = this.itemSlots[i]
          }
          all.push(id)
        }
        const toDeselect = State.selected.filter(id => !all.includes(id))

        State.selected = all
        toDeselect.forEach(id => EventBus.$emit(deselectEvent, id))
        toSelect.forEach(id => EventBus.$emit(selectEvent, id))
      }

      // Update scroll position
      if (target) {
        const h = this.panelScrollEl.offsetHeight
        const s = this.panelScrollEl.scrollTop
        if (target.start < s + 64) {
          this.panelScrollEl.scrollTop = target.start - 64
        }
        if (target.end > h + s - 64) {
          this.panelScrollEl.scrollTop = target.end - h + 64
        }
      }
    },

    /**
     * Select all items on current panel
     */
    onKeySelectAll() {
      this.recalcPanelBounds()
      if (!this.itemSlots || !this.itemSlots.length) return

      // Tabs or Bookmarks?
      const type = this.itemSlots[0].type
      const selectEvent = type === 'tab' ? 'selectTab' : 'selectBookmark'

      Actions.resetSelection()
      for (let s of this.itemSlots) {
        EventBus.$emit(selectEvent, s.id)
        State.selected.push(s.id)
      }
    },

    /**
     * Open context menu
     */
    onKeyMenu() {
      this.recalcPanelBounds()
      if (!this.itemSlots || !this.itemSlots.length) return
      if (!State.selected || !State.selected.length) return

      // Tabs or Bookmarks?
      const type = typeof State.selected[0] === 'number' ? 'tab' : 'bookmark'
      const targetId = State.selected[0]
      const targetSlot = this.itemSlots.find(s => s.id === targetId)
      let target
      if (type === 'tab') target = State.tabsMap[targetId]
      if (type === 'bookmark') target = State.bookmarksMap[targetId]

      if (!target) return
      const offset = this.panelTopOffset - this.panelScrollEl.scrollTop
      const start = targetSlot.start + offset
      const end = targetSlot.end + offset
      Actions.openCtxMenu({ start, end }, target)
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
     * Recalc css vars
     */
    recalcDynVars() {
      const compStyle = getComputedStyle(this.$el)
      const thRaw = compStyle.getPropertyValue('--tabs-height')
      const nbwRaw = compStyle.getPropertyValue('--nav-btn-width')
      State.tabHeight = Utils.parseCSSNum(thRaw.trim())[0]
      this.navBtnWidth = Utils.parseCSSNum(nbwRaw.trim())[0]
    },

    /**
     * Recalc panel bounds
     */
    recalcPanelBounds() {
      // Get drop slots
      if (!this.$refs.panels) return
      const panelVN = this.$refs.panels.find(p => p.index === State.panelIndex)
      if (!panelVN) return
      this.itemSlots = panelVN.getItemsBounds()

      // Get start coorinate of drop slots
      this.panelTopOffset = panelVN.getTopOffset()

      // Get scroll element
      this.panelScrollEl = panelVN.getScrollEl()
    },

    /**
     * Expand drop target
     */
    expandDropTarget() {
      if (!this.pointerMode.startsWith('inside')) return
      if (this.pointerEnterTimeout) return

      if (typeof this.dropParent === 'number') Actions.expTabsBranch(this.dropParent)
      if (typeof this.dropParent === 'string') Actions.expandBookmark(this.dropParent)

      // Start expand animation
      this.pointerExpanding = true

      setTimeout(() => this.recalcPanelBounds(), 128)
      this.pointerEnterTimeout = setTimeout(() => {
        this.pointerEnterTimeout = null
      }, 500)
    },

    /**
     * Handle end of animation of poitner expanding
     */
    onPointerExpanded() {
      this.pointerExpanding = false
    },

    /**
     * Fold drop target
     */
    foldDropTarget() {
      if (!this.pointerMode.startsWith('inside')) return
      if (this.pointerEnterTimeout) return

      if (typeof this.dropParent === 'number') Actions.foldTabsBranch(this.dropParent)
      if (typeof this.dropParent === 'string') Actions.foldBookmark(this.dropParent)

      setTimeout(() => this.recalcPanelBounds(), 128)
      this.pointerEnterTimeout = setTimeout(() => {
        this.pointerEnterTimeout = null
      }, 500)
    },

    /**
     * Reset drag-and-drop values
     */
    resetDrag() {
      this.dragMode = false
      this.dropIndex = null
      this.dropParent = null
      this.pointerPos = null
      this.pointerMode = 'none'
      this.panelScrollEl = null
    },

    // --- Dashboard ---
    /**
     * Open panel menu by nav index.
     */
    async openDashboard(i) {
      if (i === State.panels.length) i = -1
      Actions.closeCtxMenu()
      Actions.resetSelection()
      State.dashboardOpened = true
      State.panelIndex = i
      if (i === -1) this.dashboard = { dashboard: 'TabsDashboard', name: '', new: true }
      else if (i >= 0) this.dashboard = this.nav[i]
    },

    /**
     * Close nav menu.
     */
    closeDashboard() {
      State.dashboardOpened = false
      this.dashboard = null
      if (State.panelIndex < 0 && State.lastPanelIndex >= 0) {
        State.panelIndex = State.lastPanelIndex
      }
    },
    // ---

    /**
     * Update sidebar width value.
     */
    updateNavSize() {
      if (this.width !== this.$refs.nav.offsetWidth) this.width = this.$refs.nav.offsetWidth
    },

    /**
     * Get tooltip for button
     */
    getTooltip(i) {
      if (i === State.panels.length) return this.t('nav.add_ctx_tooltip')
      if (!State.panels[i].tabs) return this.nav[i].name
      return `${this.nav[i].name}: ${State.panels[i].tabs.length}`
    },
  },
}
</script>
