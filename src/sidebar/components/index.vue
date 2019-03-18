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
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mousemove.passive="onMouseMove")
  ctx-menu
  .pointer(ref="pointer"): .arrow

  //- Pinned tabs dock
  pinned-dock(v-if="$store.state.pinnedTabsPosition !== 'panel'"
    @start-selection="startSelection"
    @stop-selection="stopSelection")

  .box(ref="box")
    .bg(v-noise:300.g:12:af.a:0:42.s:0:9="", :style="bgPosStyle")
    .dimmer(@mousedown="closeDashboard")

    //- Navigation
    .nav(ref="nav")
      keep-alive
        component.panel-menu(
          v-if="dashboard"
          ref="menu"
          :is="dashboard.dashboard" 
          :conf="dashboard"
          :index="$store.state.panelIndex"
          @close="closeDashboard"
          @height="recalcDashboardHeight")

      .nav-strip(@wheel.stop.prevent="onNavWheel")
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
        @create-tab="createTab"
        @start-selection="startSelection"
        @stop-selection="stopSelection")
      transition(name="settings")
        settings-panel(v-if="$store.state.panelIndex === -2", :pos="settingsPanelPos")
        styles-panel(v-if="$store.state.panelIndex === -3", :pos="stylesPanelPos")
        snapshots-panel(v-if="$store.state.panelIndex === -4", :pos="snapshotsPanelPos")
        window-input(v-if="$store.state.panelIndex === -5", :pos="windowInputPos")
</template>


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
    .dimmer
      z-index: 999
      opacity: 1
    .panel-menu
      opacity: 1
      transition: opacity var(--d-fast), z-index var(--d-fast)
    .panel-btn[is-active="true"]
      flex-grow: 10
      transition: flex var(--d-fast)

#root.-pinned-tabs-top > .Sidebar
  flex-direction: column
#root.-pinned-tabs-left > .Sidebar
  flex-direction: row
#root.-pinned-tabs-bottom > .Sidebar
  flex-direction: column-reverse
#root.-pinned-tabs-right > .Sidebar
  flex-direction: row-reverse

.Sidebar > .box
  box(relative, flex)
  size(100%, same)
  flex-direction: column

// --- Parallaxed background ---
.Sidebar > .box > .bg
  box(absolute)
  size(200%, 100%)
  transition: transform var(--d-fast)

// --- Dimmer layer ---
.Sidebar .dimmer
  box(absolute)
  pos(0, 0)
  size(100%, same)
  background-color: #24242464
  z-index: -1
  opacity: 0
  transition: z-index var(--d-fast), opacity var(--d-fast)

// --- Nav panel ---
.Sidebar .nav
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
        circle at calc(100% - 1.5px) calc(100% - 1.5px),
        #00000032,
        #00000032 5px,
        #000000 6px,
        #000000
      )
  &[proxified]
  &[loading]
    > svg
      mask: radial-gradient(
        circle at calc(100% - 1px) calc(100% - 1px),
        #00000032,
        #00000032 7px,
        #000000 8px,
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
    size(1px, 4px)
    pos(calc(50% - 2px), calc(50% - 1px))
    opacity: 0

    &:before
      box(absolute)
      pos(4px, 0)
      size(100%, same)
      background-color: var(--tabs-loading-fg)
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
.Sidebar .pointer
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
    opacity: 1
    transition: opacity var(--d-fast)
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
      size(16px, 16px)
      pos(4px, -11px)
      opacity: 0
      transform: rotateZ(45deg)
      box-shadow: inset -1px 1px 0 0 var(--nav-btn-update-badge-bg)
  &:after
    content: ''
    box(absolute)
    size(100vw, 2px)
    pos(11px, 6px)
    background-color: var(--nav-btn-update-badge-bg)
    opacity: 0
    transition: opacity var(--d-fast)
.Sidebar[drag-mode] .pointer
  opacity: 1
  z-index: 100
.Sidebar[pointer-mode="none"] .pointer .arrow
  opacity: 0
.Sidebar[pointer-mode="between"] .pointer:after
  opacity: 1
.Sidebar[pointer-mode="inside-fold"] .pointer .arrow:before
  background-color: var(--nav-btn-update-badge-bg)
.Sidebar[pointer-mode^="inside"] .pointer:after
  opacity: 0
.Sidebar .pointer.-expanding .arrow
  animation: pointer-expand-arrow .3s
.Sidebar .pointer.-expanding .arrow:after
  animation: pointer-expand-pulse .5s

#root.-pinned-tabs-left .Sidebar .pointer
  pos(l: 33px)

// --- Panel ---
.Sidebar .panel-box
  box(relative)
  flex-grow: 2

.Sidebar .panel
  box(absolute, flex)
  pos(0, 0)
  size(100%, same)
  flex-direction: column
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

@keyframes pointer-expand-arrow
  0%
    opacity: 0
  100%
    opacity: 1

@keyframes pointer-expand-pulse
  0%
    opacity: 1
    transform: rotateZ(45deg) scale(1, 1)
  100%
    opacity: 0
    transform: rotateZ(45deg) scale(2, 2)
</style>


<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import NoiseBg from '../../directives/noise-bg.js'
import Utils from '../../libs/utils.js'
import EventBus from '../event-bus'
import Store from '../store'
import State from '../store.state.js'
import CtxMenu from './context-menu'
import WindowInput from './inputs/window'
import BookmarksDashboard from './dashboards/bookmarks.vue'
import DefaultTabsDashboard from './dashboards/default-tabs.vue'
import TabsDashboard from './dashboards/containered-tabs'
import BookmarksPanel from './panels/bookmarks'
import TabsPanel from './panels/tabs'
import SettingsPanel from './panels/settings'
import SnapshotsPanel from './panels/snapshots'
import StylesPanel from './panels/styles'
import PinnedDock from './panels/pinned-dock'

Vue.directive('noise', NoiseBg)

const GROUP_URL = 'moz-extension://eec1cad1-d067-40d5-a88f-9b1d9c7172d9/group/group.html'
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
    SettingsPanel,
    WindowInput,
    SnapshotsPanel,
    StylesPanel,
    PinnedDock,
  },

  data() {
    return {
      width: 250,
      dragMode: false,
      pointerMode: 'none',
      dashboard: null,
      loading: [],
      loadingTimers: [],
    }
  },

  /**
   * --- Computed ---
   */
  computed: {
    ...mapGetters(['defaultCtxId', 'defaultPanel', 'panels', 'activePanel']),

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
     * Get list of navigational buttons
     */
    nav() {
      // console.log('[DEBUG] INDEX COMPUTED nav');
      let cap = ~~((this.width - 32) / 34)
      let halfCap = cap >> 1
      let invModCap = cap % halfCap ^ 1

      let i, k, r
      let out = []
      let hideOffset = 0

      for (i = 0; i < State.containers.length; i++) {
        const btn = State.containers[i]
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

      if (!State.private) {
        ADD_CTX_BTN.hidden = false
        out.push(ADD_CTX_BTN)
      }

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
    const onresize = Utils.Asap(() => this.updateNavSize(), 120)
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
      if (e.deltaY > 0) return Store.dispatch('switchPanel', 1)
      if (e.deltaY < 0) return Store.dispatch('switchPanel', -1)
    },

    /**
     * MouseMove event handler
     */
    onMouseMove(e) {
      if (!this.selectionStart) return

      if (this.selectionStart && !this.selection && Math.abs(e.clientY - this.selectY) > 5) {
        Store.commit('closeCtxMenu')
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
          this.dropIndex = this.panels[State.panelIndex].startIndex
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
        if (slot.in && y < slot.bottom && State.tabsTree) {
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
        Store.commit('closeCtxMenu')
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
        Store.commit('closeCtxMenu')
        Store.commit('resetSelection')
      }
    },

    /**
     * Mouse up event handler
     */
    onMouseUp(e) {
      if (e.button === 0) {
        Store.commit('closeCtxMenu')
        Store.commit('resetSelection')
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
      for (let n of State.dragNodes) {
        if (n.type === 'tab') EventBus.$emit('deselectTab', n.id)
        else EventBus.$emit('deselectBookmark', n.id)
      }
      this.resetDrag()
    },

    /**
     * Drop event handler
     */
    onDrop(e) {
      if (this.dropParent === undefined) this.dropParent = -1
      if (this.dropParent === null) this.dropParent = -1

      if (this.panels[State.panelIndex].tabs) {
        Store.dispatch('dropToTabs', {
          event: e,
          dropIndex: this.dropIndex,
          dropParent: this.dropParent,
          nodes: State.dragNodes,
        })
      }
      if (this.panels[State.panelIndex].bookmarks) {
        Store.dispatch('dropToBookmarks', {
          event: e,
          dropIndex: this.pointerMode.startsWith('inside') ? 0 : this.dropIndex,
          dropParent: this.dropParent,
          nodes: State.dragNodes,
        })
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
      // Skip last button (AddNewContianer)
      if (i === this.nav.length - 1) return
      this.navDragEnterIndex = i
      if (this.navDragEnterTimeout) clearTimeout(this.navDragEnterTimeout)
      this.navDragEnterTimeout = setTimeout(() => {
        Store.dispatch('switchToPanel', i)
      }, 250)
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
      State.ctxs.push(contextualIdentity)
      State.containers.push({
        ...contextualIdentity,
        type: 'ctx',
        id: contextualIdentity.cookieStoreId,
        dashboard: 'TabsDashboard',
        panel: 'TabsPanel',
        lockedTabs: false,
        lockedPanel: false,
        proxy: null,
        proxified: false,
        sync: false,
        noEmpty: false,
        includeHostsActive: false,
        includeHosts: '',
        excludeHostsActive: false,
        excludeHosts: '',
        lastActiveTab: -1,
      })
      State.panelIndex = this.panels.length - 1
      State.lastPanelIndex = State.panelIndex

      this.openDashboard(State.panelIndex)

      // Check if we have some updates
      // for container with this name
      Store.dispatch('resyncPanels')
      Store.dispatch('saveContainers')
    },

    /**
     * contextualIdentities.onRemoved
     */
    async onRemovedContainer({ contextualIdentity }) {
      let id = contextualIdentity.cookieStoreId

      // Close tabs
      const orphanTabs = State.tabs.filter(t => t.cookieStoreId === id)
      State.removingTabs = orphanTabs.map(t => t.id)
      await browser.tabs.remove([...State.removingTabs])

      // Remove container
      let ctxIndex = State.ctxs.findIndex(c => c.cookieStoreId === id)
      let ctrIndex = State.containers.findIndex(c => c.id === id)
      if (ctxIndex === -1 || ctrIndex === -1) return
      State.ctxs.splice(ctxIndex, 1)
      State.containers.splice(ctrIndex, 1)
      if (State.proxies[id]) delete State.proxies[id]

      // Switch to prev panel
      State.panelIndex = this.panels.length - 1
      State.lastPanelIndex = State.panelIndex

      Store.dispatch('saveContainers')
    },

    /**
     * contextualIdentities.onUpdated
     */
    onUpdatedContainer({ contextualIdentity }) {
      let id = contextualIdentity.cookieStoreId
      let ctxIndex = State.ctxs.findIndex(c => c.cookieStoreId === id)
      let ctrIndex = State.containers.findIndex(c => c.cookieStoreId === id)
      if (ctxIndex === -1 || ctrIndex === -1) return

      State.ctxs.splice(ctxIndex, 1, contextualIdentity)
      State.containers.splice(ctrIndex, 1, { ...State.containers[ctrIndex], ...contextualIdentity })

      Store.dispatch('saveSyncPanels')
      Store.dispatch('saveContainers')
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

      // If new tab is out of panel, move it to the end of this panel
      let panel = this.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
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
      tab.parentId = -1
      tab.lvl = 0
      tab.invisible = false

      // Put new tab in tabs list
      State.tabsMap[tab.id] = tab
      State.tabs.splice(tab.index, 0, tab)

      // Update tree
      if (State.tabsTree) {
        if (tab.openerTabId === undefined) {
          // Try to restore ?reopened tab
          Store.dispatch('restoreReopenedTreeTab', tab.id)
        } else {
          Store.dispatch('newTreeTab', tab.id)
        }

        Store.dispatch('saveTabsTree', 500)
      }

      // Set last tab successor
      if (panel.tabs.length >= 1 && tab.index >= panel.endIndex) {
        Store.dispatch('updateTabsSuccessorsDebounced', { timeout: 200 })
      }

      Store.dispatch('recalcPanelScroll')
      Store.dispatch('saveSyncPanels')
    },

    /**
     * tabs.onUpdated
     */
    onUpdatedTab(tabId, change, tab) {
      if (tab.windowId !== State.windowId) return
      if (!State.tabs[tab.index]) return
      if (State.tabs[tab.index].id !== tabId) return
      const localTab = State.tabs[tab.index]

      // Loaded
      if (change.hasOwnProperty('status')) {
        if (change.status === 'complete' && localTab.status === 'loading') {
          EventBus.$emit('tabLoaded', tab.id)
        }
      }

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

      // Handle pinned tab
      if (change.hasOwnProperty('pinned') && change.pinned) {
        let panel = this.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
        if (panel.noEmpty && panel.tabs.length === 1) {
          browser.tabs.create({ cookieStoreId: panel.cookieStoreId })
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
              let pi = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
              this.$set(State.updatedTabs, tab.id, pi)
            }
          }
        }
      }

      // Update tab object
      Object.assign(localTab, change)

      if (change.hasOwnProperty('url') || change.hasOwnProperty('pinned')) {
        Store.dispatch('saveSyncPanels')
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
        Store.commit('closeCtxMenu')
        Store.commit('resetSelection')
      }

      // Try to get removed tab and his panel
      if (!State.tabsMap[tabId]) return
      const tab = State.tabsMap[tabId]
      const panel = Utils.GetPanelOf(this.panels, tab)

      // Recreate locked tab
      if (panel && panel.lockedTabs && tab.url.startsWith('http')) {
        browser.tabs.create({ url: tab.url, cookieStoreId: tab.cookieStoreId })
      }

      // Temporary store child tab info (for tree recovering)
      if (State.tabsTree && tab.parentId >= 0 && !tab.url.startsWith('about:')) {
        if (!State.removedTabs) State.removedTabs = []
        if (State.removedTabs.length > 123) State.removedTabs.splice(50, 50)
        if (tab.parentId >= 0) {
          State.removedTabs.push({ title: tab.title, parentId: tab.parentId })
        }
      }

      // No-empty
      if (panel && panel.noEmpty) {
        if (panel.tabs && panel.tabs.length === 1) {
          browser.tabs.create({ cookieStoreId: panel.id })
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

          // Show invisible children
          if (!State.removingTabs.includes(t.id)) t.invisible = false
        }
      }

      // Update last tab successor
      if (panel && State.ffVer >= 65 && panel.tabs.length > 2 && !State.removingTabs.length) {
        // Removing the last tab
        if (tab.index === panel.endIndex) {
          const prevTab = panel.tabs[panel.tabs.length - 2]
          const prePrevTab = panel.tabs[panel.tabs.length - 3]
          prevTab.successorTabId = prePrevTab.id
          browser.tabs.update(prevTab.id, { successorTabId: prePrevTab.id })
        }
        // Removing successor of last tab
        if (tab.index === panel.endIndex - 1) {
          const lastTab = panel.tabs[panel.tabs.length - 1]
          const prevTab = panel.tabs[panel.tabs.length - 3]
          lastTab.successorTabId = prevTab.id
          browser.tabs.update(lastTab.id, { successorTabId: prevTab.id })
        }
      }

      // Shift tabs after removed one. (NOT detected by vue)
      for (let i = tab.index + 1; i < State.tabs.length; i++) {
        State.tabs[i].index--
      }
      State.tabsMap[tabId] = undefined
      State.tabs.splice(tab.index, 1)

      if (panel && panel.lastActiveTab >= 0) panel.lastActiveTab = -1

      // Remove updated flag
      this.$delete(State.updatedTabs, tabId)

      if (!State.removingTabs.length) {
        Store.dispatch('recalcPanelScroll')
        Store.dispatch('saveSyncPanels')
      }

      // Calc tree levels
      if (State.tabsTree && !State.removingTabs.length) {
        State.tabs = Utils.CalcTabsTreeLevels(State.tabs)
        Store.dispatch('saveTabsTree')
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
        Store.commit('closeCtxMenu')
        Store.commit('resetSelection')
      }

      // Move tab in tabs array
      let movedTab = State.tabs.splice(info.fromIndex, 1)[0]
      if (!movedTab) {
        const i = State.tabs.findIndex(t => t.id === id)
        movedTab = State.tabs.splice(i, 1)[0]
      }
      if (!movedTab) return

      State.tabs.splice(info.toIndex, 0, movedTab)
      Store.dispatch('recalcPanelScroll')

      // Update tabs indexes.
      const minIndex = Math.min(info.fromIndex, info.toIndex)
      const maxIndex = Math.max(info.fromIndex, info.toIndex)
      for (let i = minIndex; i <= maxIndex; i++) {
        State.tabs[i].index = i
      }

      // Update last tab successor
      Store.dispatch('updateTabsSuccessorsDebounced', { timeout: 200 })

      // Calc tree levels
      if (State.tabsTree && !State.movingTabs.length) {
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

      if (!State.tabsMap[id]) return
      let i = State.tabsMap[id].index

      State.tabsMap[id] = undefined
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

      // Reset selection
      Store.commit('resetSelection')

      // Update tabs and find activated one
      let tab, isActivated
      for (let i = State.tabs.length; i--; ) {
        isActivated = info.tabId === State.tabs[i].id
        State.tabs[i].active = isActivated
        if (isActivated) tab = State.tabs[i]
      }
      if (!tab) return

      // Remove updated flag
      this.$delete(State.updatedTabs, info.tabId)

      // Find panel of activated tab
      if (tab.pinned && State.pinnedTabsPosition !== 'panel') return
      let panelIndex = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
      if (panelIndex === -1) return

      // Switch to activated tab's panel
      if (!this.panels[State.panelIndex].lockedPanel) {
        Store.commit('setPanel', panelIndex)
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
        if (!prevActiveChild) Store.dispatch('expTabsBranch', tab.id)
      }
      if (tab.invisible) {
        Store.dispatch('expTabsBranch', tab.parentId)
      }

      this.panels[State.panelIndex].lastActiveTab = info.tabId
      EventBus.$emit('scrollToActiveTab', panelIndex, info.tabId)

      // If activated tab is group - reinit it
      if (tab.url.startsWith(GROUP_URL)) {
        const groupId = tab.url.slice(GROUP_URL.length + 1)
        browser.runtime.sendMessage({
          name: 'reinit_group',
          windowId: State.windowId,
          arg: groupId,
        })
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
      if (!this.itemSlots || !this.itemSlots.length) return
      if (!State.selected || !State.selected.length) return

      // Tabs or Bookmarks?
      const type = this.itemSlots[0].type
      const targetId = State.selected[0]

      if (type === 'tab') {
        const tab = State.tabsMap[targetId]
        if (!tab) return
        if (tab.active) {
          Store.commit('resetSelection')
          if (tab.isParent) Store.dispatch('toggleBranch', tab.id)
        }
        browser.tabs.update(targetId, { active: true })
      }

      if (type === 'bookmark') {
        const target = Utils.FindBookmark(State.bookmarks, targetId)
        if (!target) return

        if (target.type === 'folder') {
          if (target.expanded) Store.dispatch('foldBookmark', target.id)
          else Store.dispatch('expandBookmark', target.id)
        }

        if (target.type === 'bookmark') {
          if (State.openBookmarkNewTab) {
            let index = this.defaultPanel.endIndex + 1
            browser.tabs.create({ index, url: target.url, active: true })
          } else {
            browser.tabs.update({ url: target.url })
            if (State.openBookmarkNewTab && !this.panels[0].lockedPanel) {
              Store.dispatch('goToActiveTabPanel')
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
          Store.commit('resetSelection')
          EventBus.$emit(deselectEvent, selId)
          EventBus.$emit(selectEvent, target.id)
          State.selected = [target.id]
        }
      }

      // No selected items -> select first/last
      if (!State.selected.length) {
        const panel = this.panels[State.panelIndex]
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

      Store.commit('resetSelection')
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
      if (type === 'bookmark') target = Utils.FindBookmark(State.bookmarks, targetId)

      if (!target) return
      const offset = this.panelTopOffset - this.panelScrollEl.scrollTop
      const start = targetSlot.start + offset
      const end = targetSlot.end + offset
      Store.dispatch('openCtxMenu', { el: { start, end }, node: target })
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
      State.tabHeight = Utils.ParseCSSNum(thRaw.trim())[0]
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

      if (typeof this.dropParent === 'number') Store.dispatch('expTabsBranch', this.dropParent)
      if (typeof this.dropParent === 'string') Store.dispatch('expandBookmark', this.dropParent)

      // Start expand animation
      if (this.$refs.pointer) {
        this.$refs.pointer.classList.remove('-expanding')
        this.$refs.pointer.offsetHeight
        this.$refs.pointer.classList.add('-expanding')
      }

      setTimeout(() => this.recalcPanelBounds(), 128)
      this.pointerEnterTimeout = setTimeout(() => {
        this.pointerEnterTimeout = null
      }, 500)
    },

    /**
     * Fold drop target
     */
    foldDropTarget() {
      if (!this.pointerMode.startsWith('inside')) return
      if (this.pointerEnterTimeout) return

      if (typeof this.dropParent === 'number') Store.dispatch('foldTabsBranch', this.dropParent)
      if (typeof this.dropParent === 'string') Store.dispatch('foldBookmark', this.dropParent)

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
      if (i === this.panels.length) i = -1
      Store.commit('closeSettings')
      Store.commit('closeCtxMenu')
      Store.commit('resetSelection')
      State.dashboardOpened = true
      State.panelIndex = i
      if (i >= 0) State.activePanel = State.panelIndex
      if (i === -1) this.dashboard = { dashboard: 'TabsDashboard', new: true }
      else if (i >= 0) this.dashboard = this.nav[i]

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
      if (this.width !== this.$refs.nav.offsetWidth) this.width = this.$refs.nav.offsetWidth
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
