<template lang="pug">
.Sidebar(
  v-noise:300.g:12:af.a:0:42.s:0:9=""
  :data-hidden-panels-bar="$store.state.hiddenPanelsBar"
  :data-drag="dragMode"
  :data-pointer="pointerMode"
  :data-nav-inline="$store.state.navBarInline"
  @wheel="onWheel"
  @contextmenu.stop.prevent=""
  @dragover.prevent="onDragMove"
  @dragenter="onDragEnter"
  @dragleave="onDragLeave"
  @drop.stop.prevent="onDrop"
  @mouseenter="onMouseEnter"
  @mouseleave="onMouseLeave"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mousemove.passive="onMouseMove"
  @focusout="onFocusOut")

  transition(name="upgrading"): .upgrading(
    v-if="$store.state.upgrading"
    v-noise:300.g:12:af.a:0:42.s:0:9="")
    .info {{t('upgrading')}}

  Confirm
  CtxMenu

  .pointer(ref="pointer")
    .arrow(:data-expanding="pointerExpanding" @animationend="onPointerExpanded")

  PinnedDock(v-if="$store.state.pinnedTabsPosition !== 'panel'")

  .box(ref="box")
    .dimmer(@mousedown="$store.state.hiddenPanelsBar = false")
    NavBar
    .panel-box
      component.panel(
        v-for="(panel, i) in $store.state.panels"
        ref="panels"
        :key="panel.id"
        :is="getPanelComponent(panel)"
        :data-pos="getPanelPos(i)"
        :tabs="panel.tabs"
        :index="i"
        :panel="panel"
        :store-id="panel.cookieStoreId"
        :active="$store.state.panelIndex === i")
      transition(name="panel")
        WindowInput(v-if="$store.state.panelIndex === -5" :data-pos="windowInputPos")
      transition(name="hidden-panels-bar")
        HiddenPanelsBar(v-if="$store.state.hiddenPanelsBar")
  Notifications
</template>


<script>
import Vue from 'vue'
import { PRE_SCROLL } from '../../addon/defaults'
import initNoiseBgDirective from '../directives/noise-bg.js'
import EventBus from '../event-bus'
import Store from './store'
import State from './store/state.js'
import Actions from './actions'
import CtxMenu from './components/context-menu'
import NavBar from './components/nav-bar'
import HiddenPanelsBar from './components/hidden-panels-bar'
import BookmarksPanel from './components/bookmarks-panel'
import TabsPanel from './components/tabs-panel'
import WindowInput from './components/window-select-input'
import PinnedDock from './components/pinned-tabs-dock'
import Confirm from './components/confirm'
import Notifications from './components/notifications'

const noiseBg = initNoiseBgDirective(State, Store)
Vue.directive('noise', noiseBg)

// --- Vue Component ---
export default {
  components: {
    CtxMenu,
    NavBar,
    HiddenPanelsBar,
    BookmarksPanel,
    TabsPanel,
    WindowInput,
    PinnedDock,
    Confirm,
    Notifications,
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
    getPanelComponent(panel) {
      if (panel.type === 'bookmarks') return 'BookmarksPanel'
      return 'TabsPanel'
    },

    /**
     * onFocusOut
     */
    onFocusOut(e) {
      if (e.explicitOriginalTarget === e.target) {
        Actions.resetSelection()
      }
    },

    /**
     * Mousedown Mid
     */
    onMouseDownMid(e) {
      this.close()
      Actions.blockWheel()
      e.preventDefault()
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
      if (!State.multiSelectionStart) return

      if (State.multiSelectionStart && !State.multiSelection && Math.abs(e.clientY - State.multiSelectionY) > 5) {
        Actions.closeCtxMenu()
        State.multiSelection = true
        Actions.selectItem(State.multiSelectionStart.id)

        EventBus.$emit('updatePanelBounds')

        let scroll = State.panelScrollEl ? State.panelScrollEl.scrollTop : 0
        this.startY = State.multiSelectionStart.clientY - State.panelTopOffset + scroll
        let firstItem = State.itemSlots.find(s => s.start <= this.startY && s.end >= this.startY)
        if (firstItem) {
          State.multiSelectionStart.clientY = firstItem.center + State.panelTopOffset - scroll
        }
        return
      }

      if (State.multiSelection) {
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
              if (slot.type === 'tab') {
                State.tabsMap[slot.id].sel = true
                if (State.nativeHighlight) Actions.updateHighlightedTabs()
              }
              if (slot.type === 'bookmark') State.bookmarksMap[slot.id].sel = true
            }
          } else {
          // Outside
            if (State.selected.includes(slot.id)) {
              State.selected.splice(State.selected.indexOf(slot.id), 1)
              if (slot.type === 'tab') {
                State.tabsMap[slot.id].sel = false
                if (State.nativeHighlight) Actions.updateHighlightedTabs()
              }
              if (slot.type === 'bookmark') State.bookmarksMap[slot.id].sel = false
            }
          }
        }
      }
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
      let slotsLen = State.itemSlots.length
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
      if (slotsLen === 0) {
        this.pos = State.panelTopOffset - scroll - 12
        if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== this.pos) {
          this.pointerPos = this.pos
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.pointerMode = 'between'
          this.dropParent = -1
          this.dropIndex = State.panels[State.panelIndex].startIndex
        }
        return
      }

      // End
      if (y > State.itemSlots[slotsLen - 1].bottom) {
        let slot = State.itemSlots[slotsLen - 1]
        this.pos = slot.end - 12 + State.panelTopOffset - scroll
        if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== this.pos) {
          this.pointerPos = this.pos
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.pointerMode = 'between'
          this.dropParent = slot.parent
          if (slot.folded) this.dropIndex = -1
          else this.dropIndex = slot.index + 1
        }
        return
      }

      for (let slot, i = 0; i < slotsLen; i++) {
        slot = State.itemSlots[i]
        // Skip
        if (y > slot.end || y < slot.start) continue
        // Between
        if (slot.in ? y < slot.top : y < slot.center) {
          this.pos = slot.start - 12 + State.panelTopOffset - scroll
          if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== this.pos) {
            this.pointerPos = this.pos
            this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
            this.pointerMode = 'between'
            let prevSlot = State.itemSlots[i - 1]
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
          this.pos = slot.center - 12 + State.panelTopOffset - scroll
          if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== this.pos) {
            this.pointerPos = this.pos
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
      Actions.resetSelection()

      if (e.button === 1) {
        Actions.blockWheel()
        e.preventDefault()
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

      if (State.multiSelectionStart) Actions.stopMultiSelection()
      if (e.button === 2) {
        let type
        if (State.selected[0]) {
          if (typeof State.selected[0] === 'string') type = 'bookmark'
          if (typeof State.selected[0] === 'number') type = 'tab'
        }
        // NOTE: check type === undefined case
        Actions.openCtxMenu(type, e.clientX, e.clientY)
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

      if (State.hiddenPanelsBar) {
        this.dropParent = -1
        this.dropIndex = State.panels[State.panelIndex].startIndex
        State.hiddenPanelsBar = false
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
