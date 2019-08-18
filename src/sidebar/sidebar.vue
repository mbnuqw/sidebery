<template lang="pug">
.Sidebar(
  v-noise:300.g:12:af.a:0:42.s:0:9=""
  :data-dashboard="$store.state.dashboardIsOpen"
  :data-drag="dragMode"
  :data-pointer="pointerMode"
  :data-nav-inline="$store.state.navBarInline"
  @wheel="onWheel"
  @contextmenu="onCtxMenu"
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
    .dimmer(@mousedown="act('closeDashboard')")

    //- Navigation
    nav-bar

    //- Panels
    .panel-box
      component.panel(
        v-for="(c, i) in $store.state.panels"
        ref="panels"
        :key="c.cookieStoreId + c.name"
        :is="c.panel"
        :data-pos="getPanelPos(i)"
        :tabs="c.tabs"
        :index="i"
        :panel="c"
        :store-id="c.cookieStoreId"
        :active="$store.state.panelIndex === i"
        @start-selection="startSelection"
        @stop-selection="stopSelection")
      transition(name="panel")
        window-input(v-if="$store.state.panelIndex === -5" :data-pos="windowInputPos")
      transition(name="dashboard")
        .dashboard-box(v-if="$store.state.dashboardIsOpen")
          component.dashboard(
            :data-pos="windowInputPos"
            :is="$store.state.dashboard.dashboard"
            :conf="$store.state.dashboard"
            :index="$store.state.panelIndex"
            @close="act('closeDashboard')")
</template>


<script>
import Vue from 'vue'
import { PRE_SCROLL } from '../defaults'
import initNoiseBgDirective from '../directives/noise-bg.js'
import Utils from '../utils.js'
import EventBus from '../event-bus'
import Store from './store'
import State from './store/state.js'
import Actions from './actions'
import CtxMenu from './components/context-menu'
import NavBar from './components/nav-bar'
import BookmarksDashboard from './components/bookmarks-dashboard'
import DefaultTabsDashboard from './components/default-tabs-dashboard'
import TabsDashboard from './components/containered-tabs-dashboard'
import HiddenPanelsDashboard from './components/hidden-panels-dashboard'
import BookmarksPanel from './components/bookmarks-panel'
import TabsPanel from './components/tabs-panel'
import WindowInput from './components/window-select-input'
import PinnedDock from './components/pinned-tabs-dock'

const noiseBg = initNoiseBgDirective(State, Store)
Vue.directive('noise', noiseBg)

// --- Vue Component ---
export default {
  components: {
    CtxMenu,
    NavBar,
    BookmarksDashboard,
    DefaultTabsDashboard,
    TabsDashboard,
    HiddenPanelsDashboard,
    BookmarksPanel,
    TabsPanel,
    WindowInput,
    PinnedDock,
  },

  data() {
    return {
      dragMode: false,
      pointerMode: 'none',
      pointerExpanding: false,
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
  },

  // --- Created Hook ---
  async created() {
    EventBus.$on('dynVarChange', this.recalcDynVars)
    EventBus.$on('dragStart', info => (State.dragNodes = info))
    EventBus.$on('outerDragStart', info => (State.dragNodes = info))
  },

  /**
   * --- Methods ---
   */
  methods: {
    /**
     * Handle context menu
     */
    onCtxMenu(e) {
      if (!State.ctxMenuNative) {
        e.stopPropagation()
        e.preventDefault()
      }

      if (State.menuCtx) {
        let nativeCtx = { context: State.menuCtx.type }
        if (State.menuCtx.type === 'tab') nativeCtx.tabId = State.menuCtx.item.id
        if (State.menuCtx.type === 'bookmark') nativeCtx.bookmarkId = State.menuCtx.item.id
        browser.menus.overrideContext(nativeCtx)

        if (!State.selected.length) State.selected = [State.menuCtx.item.id]
        Actions.openCtxMenu(State.menuCtx.el, State.menuCtx.item)
      } else {
        e.preventDefault()
      }

      State.menuCtx = null
    },

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
     * MouseMove event handler
     */
    onMouseMove(e) {
      if (!this.selectionStart) return

      if (this.selectionStart && !this.selection && Math.abs(e.clientY - this.selectY) > 5) {
        Actions.closeCtxMenu()
        this.selection = true
        Actions.selectItem(this.selectionStart.id)

        EventBus.$emit('updatePanelBounds')

        let scroll = State.panelScrollEl ? State.panelScrollEl.scrollTop : 0
        this.startY = this.selectionStart.clientY - State.panelTopOffset + scroll
        let firstItem = State.itemSlots.find(s => s.start <= this.startY && s.end >= this.startY)
        if (firstItem) {
          this.selectionStart.clientY = firstItem.center + State.panelTopOffset - scroll
        }
        return
      }

      if (this.selection) {
        let scroll = State.panelScrollEl ? State.panelScrollEl.scrollTop : 0
        let y = e.clientY - State.panelTopOffset + scroll
        let topY = Math.min(this.startY, y)
        let bottomY = Math.max(this.startY, y)

        if (y - scroll < PRE_SCROLL) {
          State.panelScrollEl.scrollTop = scroll - 15
        } else if (y - scroll > State.panelScrollEl.offsetHeight - PRE_SCROLL) {
          State.panelScrollEl.scrollTop = scroll + 15
        }

        let slotUnderCursor = State.itemSlots.find(s => s.start <= y && s.end >= y)
        if (slotUnderCursor) {
          if (slotUnderCursor.id === this.slotUnderCursor) return
          this.slotUnderCursor = slotUnderCursor.id
        } else {
          this.slotUnderCursor = undefined
        }

        for (let slot of State.itemSlots) {
          // Inside
          if (slot.end >= topY && slot.start + 1 <= bottomY) {
            if (!State.selected.includes(slot.id)) {
              State.selected.push(slot.id)
              if (slot.type === 'tab') State.tabsMap[slot.id].sel = true
              if (slot.type === 'bookmark') State.bookmarksMap[slot.id].sel = true
            }
          } else {
          // Outside
            if (State.selected.includes(slot.id)) {
              State.selected.splice(State.selected.indexOf(slot.id), 1)
              if (slot.type === 'tab') State.tabsMap[slot.id].sel = false
              if (slot.type === 'bookmark') State.bookmarksMap[slot.id].sel = false
            }
          }
        }
      }
    },

    /**
     * Start selection
     */
    startSelection(info) {
      if (State.ctxMenuNative) return
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
    },

    /**
     * Drag move handler
     */
    onDragMove(e) {
      if (!this.dragMode) return
      if (!this.$refs.pointer) return
      if (!State.itemSlots) return

      let dragNode = State.dragNodes ? State.dragNodes[0] : null
      let scroll = State.panelScrollEl ? State.panelScrollEl.scrollTop : 0
      let y = e.clientY - State.panelTopOffset + scroll
      let x = e.clientX - State.panelLeftOffset
      
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
      if (!this.pointerXLock && (x < 0 || e.clientX > State.width)) {
        this.pointerMode = 'none'
        this.pointerXLock = true
        return
      }
      if (this.pointerXLock && this.pointerMode === 'none' && (x > 0 && e.clientX < State.width)) {
        this.pointerXLock = false
        if (!this.pointerYLock) {
          this.pointerPos--
          this.pointerMode = 'between'
        }
      }

      if (this.pointerXLock || this.pointerYLock) return

      // Empty
      if (State.itemSlots.length === 0) {
        const pos = State.panelTopOffset - scroll - 12
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
      if (y > State.itemSlots[State.itemSlots.length - 1].bottom) {
        const slot = State.itemSlots[State.itemSlots.length - 1]
        const pos = slot.end - 12 + State.panelTopOffset - scroll
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

      for (let i = 0; i < State.itemSlots.length; i++) {
        const slot = State.itemSlots[i]
        // Skip
        if (y > slot.end || y < slot.start) continue
        // Between
        if (slot.in ? y < slot.top : y < slot.center) {
          const prevSlot = State.itemSlots[i - 1]
          const pos = slot.start - 12 + State.panelTopOffset - scroll
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
          const pos = slot.center - 12 + State.panelTopOffset - scroll
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
      if (e.button === 0 && !e.ctrlKey && !e.shiftKey) {
        Actions.closeCtxMenu()
        Actions.resetSelection()
      }

      if (e.button === 2) {
        if (this.selectionStart) this.stopSelection()
        Actions.openCtxMenu(e.clientX, e.clientY)
      }
    },

    /**
     * Drag enter event handler
     */
    onDragEnter(e) {
      if (e && e.relatedTarget) return

      EventBus.$emit('updatePanelBounds')

      // Turn on drag mode
      this.dragMode = true
      
      // Select dragged nodes
      if (State.dragNodes) {
        for (let n of State.dragNodes) {
          Actions.selectItem(n.id)
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
          Actions.deselectItem(n.id)
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

      if (State.dashboardIsOpen) {
        this.dropParent = -1
        this.dropIndex = State.panels[State.panelIndex].startIndex
      }

      if (State.panels[State.panelIndex].tabs) {
        Actions.dropToTabs(e, this.dropIndex, this.dropParent, State.dragNodes)
      }
      if (State.panels[State.panelIndex].bookmarks) {
        if (this.pointerMode.startsWith('inside')) this.dropIndex = 0
        Actions.dropToBookmarks(e, this.dropIndex, this.dropParent, State.dragNodes,)
      }

      if (State.dragNodes) Actions.resetSelection()
      this.resetDrag()
      State.dragNodes = null

      if (State.dashboardIsOpen) {
        State.dashboardIsOpen = false
        State.dashboard = null
      }
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
      State.navBtnWidth = Utils.parseCSSNum(nbwRaw.trim())[0]
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

      Actions.updatePanelBoundsDebounced(128)
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

      Actions.updatePanelBoundsDebounced(128)
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
  },
}
</script>
