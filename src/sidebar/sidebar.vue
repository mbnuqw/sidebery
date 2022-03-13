<template lang="pug">
#root.root(
  :data-nav-layout="$store.state.navBarLayout"
  :data-native-scrollbar="$store.state.nativeScrollbars"
  :data-theme="$store.state.theme"
  :data-style="$store.state.style"
  :data-animations="animations"
  :data-pinned-tabs-position="pinnedTabsPosition"
  :data-pinned-tabs-list="$store.state.pinnedTabsList"
  :data-tabs-tree-lvl-marks="$store.state.tabsLvlDots"
  :data-tabs-close-btn="$store.state.showTabRmBtn")
  .Sidebar(
    :data-hidden-panels-bar="$store.state.hiddenPanelsBar"
    :data-drag="$store.state.dragMode"
    :data-pointer="pointerMode"
    :data-nav-inline="$store.state.navBarInline"
    :data-panel-type="activePanelType"
    @wheel.passive="onWheel"
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

    Confirm
    CtxMenu

    .pointer(ref="pointer" :data-lvl="pointerLvl")
      .arrow(
        :data-expanding="pointerExpanding"
        @animationend="onPointerExpanded"
        @dragenter="onPointerDragenter"
        @dragleave="onPointerDragleave")

    PinnedDock(v-if="$store.state.pinnedTabsPosition !== 'panel'")

    .box(ref="box")
      .dimmer(@mousedown="$store.state.hiddenPanelsBar = false")
      NavBar(v-if="$store.state.navBarLayout !== 'hidden'")
      .panel-box
        Component.panel(
          v-for="(panel, i) in $store.state.panels"
          ref="panels"
          :key="panel.id"
          :is="getPanelComponent(panel)"
          :data-pos="getPanelPos(i)"
          :index="i"
          :panel="panel"
          :store-id="panel.cookieStoreId"
          :active="$store.state.panelIndex === i")
        Transition(name="panel")
          WindowInput(v-if="$store.state.panelIndex === -5" :data-pos="windowInputPos")
        Transition(name="hidden-panels-bar")
          HiddenPanelsBar(v-if="$store.state.hiddenPanelsBar")
    Notifications
</template>

<script>
import { PRE_SCROLL } from '../../addon/defaults'
import EventBus from '../event-bus'
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
      pointerMode: 'none',
      pointerExpanding: false,
      pointerLvl: 0,
    }
  },

  /**
   * --- Computed ---
   */
  computed: {
    pinnedTabsPosition() {
      if (!this.$store.getters.pinnedTabs.length) return 'none'
      return State.pinnedTabsPosition
    },

    animations() {
      if (!this.$store.state.animations) return 'none'
      else return this.$store.state.animationSpeed || 'fast'
    },

    /**
     * Get window-input-panel position
     */
    windowInputPos() {
      return State.panelIndex === -5 ? 'center' : 'right'
    },

    /**
     * Type of active panel
     */
    activePanelType() {
      if (State.panels[State.panelIndex]) return State.panels[State.panelIndex].type
      else return undefined
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
        let threshold = e.deltaMode === 0 ? 8 : 1
        if (e.deltaX >= threshold) return Actions.switchPanel(1)
        if (e.deltaX <= -threshold) return Actions.switchPanel(-1)
      }
    },

    /**
     * MouseMove event handler
     */
    onMouseMove(e) {
      if (!State.multiSelectionStart) return

      if (
        State.multiSelectionStart &&
        !State.multiSelection &&
        Math.abs(e.clientY - State.multiSelectionY) > 5
      ) {
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
      if (!State.dragMode) return
      if (!this.$refs.pointer) return
      if (!State.itemSlots) return

      let dragNode = State.dragNodes ? State.dragNodes[0] : null
      let scroll = State.panelScrollEl ? State.panelScrollEl.scrollTop : 0
      let slotsLen = State.itemSlots.length
      let y = e.clientY - State.panelTopOffset + scroll
      let x = e.clientX - State.panelLeftOffset

      // Hide pointer if cursor out of drop area
      if (!this.pointerYLock && e.clientY < State.panelTopOffset) {
        this.pointerMode = 'none'
        this.pointerYLock = true
        return
      }
      if (this.pointerYLock && this.pointerMode === 'none' && e.clientY > State.panelTopOffset) {
        this.pointerYLock = false
        if (!this.pointerXLock) {
          this.pointerPos--
          this.pointerMode = 'between'
        }
      }
      if (!this.pointerXLock && (x < 0 || e.clientX > State.panelRightOffset)) {
        this.pointerMode = 'none'
        this.pointerXLock = true
        return
      }
      if (
        this.pointerXLock &&
        this.pointerMode === 'none' &&
        x > 0 &&
        e.clientX < State.panelRightOffset
      ) {
        this.pointerXLock = false
        if (!this.pointerYLock) {
          this.pointerPos--
          this.pointerMode = 'between'
        }
      }

      if (this.pointerXLock || this.pointerYLock) return

      State.dropLvlOffset = ~~((e.clientX - State.dragXStart) / 10)
      let lvlChanged = State.prevDropLvlOffset !== State.dropLvlOffset
      State.prevDropLvlOffset = State.dropLvlOffset

      // Empty
      if (slotsLen === 0) {
        this.pos = State.panelTopOffset - scroll - 12
        if (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== this.pos) {
          this.pointerPos = this.pos
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.pointerMode = 'between'
          State.dropParent = -1
          this.dropIndex = State.panels[State.panelIndex].startIndex
          this.pointerLvl = 0
        }
        return
      }

      // End
      if (y > State.itemSlots[slotsLen - 1].bottom) {
        let slot = State.itemSlots[slotsLen - 1]
        this.pos = slot.end - 12 + State.panelTopOffset - scroll
        if (
          lvlChanged ||
          (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== this.pos)
        ) {
          this.pointerPos = this.pos
          this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
          this.pointerMode = 'between'
          State.dropParent = slot.parent
          if (slot.folded) this.dropIndex = -1
          else this.dropIndex = slot.index + 1
          this.pointerLvl = State.dropLvlOffset < 0 ? slot.lvl + State.dropLvlOffset : slot.lvl
        }
        return
      }

      for (let slot, i = 0; i < slotsLen; i++) {
        slot = State.itemSlots[i]
        // Skip
        if (!lvlChanged && (y > slot.end || y < slot.start)) continue
        // Between
        if (slot.in ? y < slot.top : y < slot.center) {
          this.pos = slot.start - 12 + State.panelTopOffset - scroll
          if (
            lvlChanged ||
            (!this.pointerXLock && !this.pointerYLock && this.pointerPos !== this.pos)
          ) {
            this.pointerPos = this.pos
            this.$refs.pointer.style.transform = `translateY(${this.pointerPos}px)`
            let prevSlot = State.itemSlots[i - 1]
            if (!prevSlot) {
              State.dropParent = -1
              this.dropIndex = slot.index
              this.pointerLvl = 0
              this.pointerMode = 'between'
              break
            }

            let dragNodeIsTab = dragNode ? dragNode.type === 'tab' : false
            let slotIsTab = slot.type === 'tab'

            let node = slotIsTab ? State.tabsMap[slot.id] : State.bookmarksMap[slot.id]
            let prevNode = slotIsTab ? State.tabsMap[prevSlot.id] : State.bookmarksMap[prevSlot.id]

            if (prevNode.sel && node.sel) this.pointerMode = 'none'
            else this.pointerMode = 'between'

            if (prevSlot.id === slot.parent) {
              // First child
              State.dropParent = slot.parent
              this.dropIndex = slot.index
              this.pointerLvl = prevSlot.lvl + 1
            } else if (dragNodeIsTab && prevSlot.folded) {
              // After folded group
              State.dropParent = prevSlot.parent
              this.dropIndex = slot.index
              if (State.dropLvlOffset >= 0) this.pointerLvl = prevSlot.lvl
              else this.pointerLvl = prevSlot.lvl + State.dropLvlOffset
            } else {
              // Second-Last in group
              State.dropParent = prevSlot.parent
              this.dropIndex = prevSlot.index + 1
              this.pointerLvl = prevSlot.lvl
              if (prevSlot.lvl > slot.lvl && lvlChanged && State.dropLvlOffset < 0) {
                let lvl = prevSlot.lvl + State.dropLvlOffset
                if (lvl > prevSlot.lvl) lvl = prevSlot.lvl
                if (lvl < slot.lvl) lvl = slot.lvl
                this.pointerLvl = lvl
              } else {
                this.pointerLvl = prevSlot.lvl
              }
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

            if (State.selected.includes(slot.id)) this.pointerMode = 'none'
            else this.pointerMode = 'inside'

            State.dropParent = slot.id

            if (slot.type === 'tab') this.dropIndex = slot.index + 1
            else this.dropIndex = 0

            this.pointerLvl = slot.lvl + 1
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
      Actions.resetLongClickLock()

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
      State.dragMode = true

      // Select dragged nodes
      if (State.dragNodes) {
        for (let n of State.dragNodes) {
          Actions.selectItem(n.id)
        }
      }

      if (!State.dragXStart) State.dragXStart = State.width >> 1
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
      if (State.dropParent === undefined) State.dropParent = -1
      if (State.dropParent === null) State.dropParent = -1

      if (State.hiddenPanelsBar) {
        State.dropParent = -1
        this.dropIndex = State.panels[State.panelIndex].startIndex
        State.hiddenPanelsBar = false
      }

      if (this.pointerLvl < 0) this.pointerLvl = 0

      // to Tabs
      if (State.panels[State.panelIndex].tabs) {
        let parentTab = State.tabsMap[State.dropParent]
        while (parentTab && this.pointerLvl <= parentTab.lvl) {
          parentTab = State.tabsMap[parentTab.parentId]
          if (!parentTab) {
            State.dropParent = -1
            break
          }
          State.dropParent = parentTab.id
        }

        let isInside = this.pointerMode.startsWith('inside')
        Actions.dropToTabs(e, this.dropIndex, State.dropParent, State.dragNodes, false, isInside)
      }

      // to Bookmarks
      if (State.panels[State.panelIndex].bookmarks) {
        if (this.pointerMode.startsWith('inside')) this.dropIndex = 0

        let parent = State.bookmarksMap[State.dropParent]
        while (parent && this.pointerLvl <= parent.lvl) {
          this.dropIndex = parent.index + 1
          parent = State.bookmarksMap[parent.parentId]
          if (!parent) {
            State.dropParent = null
            break
          }
          State.dropParent = parent.id
        }

        if (State.dropParent && State.dropParent !== 'root________') {
          Actions.dropToBookmarks(e, this.dropIndex, State.dropParent, State.dragNodes)
        }
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
      const ptwRaw = compStyle.getPropertyValue('--tabs-pinned-width')
      State.tabHeight = Utils.parseCSSNum(thRaw.trim())[0]
      State.navBtnWidth = Utils.parseCSSNum(nbwRaw.trim())[0]
      State.pinnedTabWith = Utils.parseCSSNum(ptwRaw.trim())[0]
    },

    /**
     * Expand drop target
     */
    expandDropTarget() {
      if (!this.pointerMode.startsWith('inside')) return

      if (typeof State.dropParent === 'number') Actions.toggleBranch(State.dropParent)
      if (typeof State.dropParent === 'string') Actions.toggleBookmarksBranch(State.dropParent)

      // Start expand animation
      this.pointerExpanding = true

      Actions.updatePanelBoundsDebounced(128)
    },

    /**
     * Handle end of animation of poitner expanding
     */
    onPointerExpanded() {
      this.pointerExpanding = false
    },

    onPointerDragenter(e) {
      if (State.dndExp !== 'pointer') return
      if (State.dndExpMod !== 'none' && !e[State.dndExpMod + 'Key']) return
      if (this.dragExpTimeout) clearTimeout(this.dragExpTimeout)
      this.dragExpTimeout = setTimeout(() => {
        this.dragExpTimeout = null
        if (State.dragMode) this.expandDropTarget()
      }, State.dndExpDelay)
    },

    onPointerDragleave() {
      if (this.dragExpTimeout) {
        clearTimeout(this.dragExpTimeout)
        this.dragExpTimeout = null
      }
    },

    /**
     * Reset drag-and-drop values
     */
    resetDrag() {
      State.dragMode = false
      this.dropIndex = null
      State.dropParent = null
      this.pointerPos = null
      this.pointerMode = 'none'
      this.panelScrollEl = null
      this.pointerLvl = 0
    },
  },
}
</script>
