<template lang="pug">
.TabsPanel(
  :drag-active="drag && drag.dragged"
  :drag-end="dragEnd"
  @contextmenu.prevent.stop=""
  @mousedown.middle="createTab"
  @mousemove="onMM"
  @mouseup="onMU"
  @mouseleave="onMU")
  scroll-box(ref="scrollBox", @auto-scroll="onMM")
    .drag-box
      .drag-tab(
        v-for="dt in dragTabs"
        ref="dragTabs"
        :key="dt.id"
        :dragged="drag && drag.id === dt.id && drag.dragged"
        :style="dragTabStyle(dt)")
        .drag-fav
          .placeholder(v-if="!dt.fav")
          img(v-else :src="dt.fav")
        .drag-title {{dt.title}}
    .container(:ctx-menu="!!$root.ctxMenu")
      tab.tab(
        v-for="(t, i) in tabs"
        ref="tabs"
        :key="t.id"
        :tab="t"
        :selected="isSelected(t.id)"
        @mdl="onTabMDL(i, ...arguments)"
        @mdr="onTabMDR(i, ...arguments)"
        @closedown="$emit('closedown', i)")
</template>


<script>
import Utils from '../../libs/utils'
import Store from '../store'
import State from '../store.state'
import EventBus from '../event-bus'
import CtxMenu from '../context-menu'
import Tab from './tabs.tab.vue'
import ScrollBox from './scroll-box.vue'

export default {
  components: {
    ScrollBox,
    Tab,
  },

  props: {
    tabs: {
      type: Array,
      default: () => [],
    },
    id: String,
    index: Number,
    storeId: String,
  },

  data() {
    return {
      topOffset: 0,
      selection: null,
      selectionMenuEl: null,
      drag: null,
      dragTabs: [],
      dragEls: [],
      dragEnd: false,
    }
  },

  mounted() {
    this.topOffset = this.$el.getBoundingClientRect().top
    EventBus.$on('recalcPanelScroll', () => {
      if (this.index !== State.panelIndex) return
      this.recalcScroll()
    })

    // Handle key navigation
    EventBus.$on('keyActivate', () => {
      if (State.panelIndex === this.index) this.onKeyActivate()
    })
    EventBus.$on('keyUp', () => {
      if (State.panelIndex === this.index) this.onKeySelect(-1)
    })
    EventBus.$on('keyDown', () => {
      if (State.panelIndex === this.index) this.onKeySelect(1)
    })
    EventBus.$on('keyUpShift', () => {
      if (State.panelIndex === this.index) this.onKeySelectChange(-1)
    })
    EventBus.$on('keyDownShift', () => {
      if (State.panelIndex === this.index) this.onKeySelectChange(1)
    })
    EventBus.$on('selectAll', () => {
      if (State.panelIndex === this.index) State.selectedTabs = this.tabs.map(t => t.id)
    })
  },

  methods: {
    onMU() {
      if (this.drag) this.onTabMoveEnd()
      if (this.selection) this.onTabsSelectionEnd()
    },

    onMM(e) {
      if (this.drag) this.onTabMove(e)
      if (this.selection) this.onTabsSelection(e)
    },

    onTabMDL(i, e, vm) {
      // Activate tab
      browser.tabs.update(vm.tab.id, { active: true })

      // Start dragging
      let id = vm.tab.id
      let title = vm.tab.title
      let globalIndex = vm.tab.index
      let h = vm.height()
      let tabY = h >> 1
      let y = e.clientY
      let x = e.clientX
      this.drag = { id, title, globalIndex, i, h, tabY, y, x, top: 0, dragged: false }
    },

    onTabMDR(i, e, vm) {
      let id = vm.tab.id
      let h = vm.height()
      let y = e.clientY
      this.selection = { id, i: vm.tab.index, h, y }
    },

    onTabsSelection(e) {
      if (!this.selection.active && Math.abs(e.clientY - this.selection.y) > 10) {
        this.selection.active = true
        Store.commit('closeCtxMenu')
        State.selectedTabs.push(this.selection.id)
        this.recalcDragTabs()
      }

      if (this.selection.active) {
        let moveY = e.clientY - this.topOffset + this.$refs.scrollBox.scrollY
        for (let i = 0; i < this.dragTabs.length; i++) {
          let tab = this.dragTabs[i]

          // Up
          if (this.selection.i > tab.index) {
            if (moveY < tab.top + tab.h) {
              // Select
              if (!State.selectedTabs.includes(tab.id)) {
                State.selectedTabs.push(tab.id)
                this.selectionMenuEl = tab.el
              }
            } else {
              // Deselect
              let index = State.selectedTabs.findIndex(id => id === tab.id)
              if (index >= 0) {
                State.selectedTabs.splice(index, 1)
                this.selectionMenuEl = this.dragTabs[i + 1].el
              }
            }
          }

          // Down
          if (this.selection.i < tab.index) {
            if (moveY > tab.top) {
              // Select
              if (!State.selectedTabs.includes(tab.id)) {
                State.selectedTabs.push(tab.id)
                this.selectionMenuEl = tab.el
              }
            } else {
              // Deselect
              let index = State.selectedTabs.findIndex(id => id === tab.id)
              if (index >= 0) {
                State.selectedTabs.splice(index, 1)
                this.selectionMenuEl = this.dragTabs[i - 1].el
              }
            }
          }
        }
      }
    },

    /**
     * Open context menu
     */
    async onTabsSelectionEnd() {
      if (this.selection && !this.selection.active) {
        this.selection = null
        return
      }
      if (this.selection && State.selectedTabs.length < 2) {
        this.selection = null
        State.selectedTabs = []
        return
      }
      this.selection = null
      if (!this.selectionMenuEl) return this.closeSelectionMenu()

      const otherWindows = (await Utils.GetAllWindows()).filter(w => !w.current)
      const menu = new CtxMenu(this.selectionMenuEl, this.closeSelectionMenu)

      // Move to new window
      let args = { tabIds: State.selectedTabs }
      menu.add('move_to_new_window', 'moveTabsToNewWin', args)

      // Move to new private window
      args = { tabIds: State.selectedTabs, incognito: true }
      menu.add('move_to_new_priv_window', 'moveTabsToNewWin', args)

      // Move to another window
      if (otherWindows.length === 1) {
        const args = { tabIds: State.selectedTabs, window: otherWindows[0] }
        menu.add('move_to_another_window', 'moveTabsToWin', args)
      }

      // Move to window...
      if (otherWindows.length > 1) {
        menu.add('move_to_window_', 'moveTabsToWin', { tabIds: State.selectedTabs })
      }

      // Default window
      if (!State.private) {
        // Reopen in containers
        if (this.storeId !== 'firefox-default') {
          const args = { tabIds: State.selectedTabs, ctxId: 'firefox-default'}
          menu.add('reopen_in_default_panel', 'moveTabsToCtx', args)
        }
        State.ctxs.map(c => {
          if (this.storeId === c.cookieStoreId) return
          const args = { tabIds: State.selectedTabs, ctxId: c.cookieStoreId}
          const label = this.t('ctx_menu.re_open_in_') + `||${c.colorCode}>>${c.name}`
          menu.addTranslated(label, 'moveTabsToCtx', args)
        })
      }

      if (State.panelIndex === 1) {
        menu.add('unpin', 'unpinTabs', State.selectedTabs)
      } else {
        menu.add('pin', 'pinTabs', State.selectedTabs)
      }
      menu.add('tabs_discard', 'discardTabs', State.selectedTabs)
      menu.add('tabs_bookmark', 'bookmarkTabs', State.selectedTabs)
      menu.add('tabs_reload', 'reloadTabs', State.selectedTabs)
      menu.add('tabs_close', 'closeTabs', State.selectedTabs)

      Store.commit('closeCtxMenu')
      State.ctxMenu = menu
    },

    closeSelectionMenu() {
      State.selectedTabs = []
    },

    onTabMove(e) {
      if (
        (!this.drag.dragged && Math.abs(e.clientY - this.drag.y) > 5) ||
        (!this.drag.dragged && Math.abs(e.clientX - this.drag.x) > 5)
      ) {
        this.drag.dragged = true
        this.recalcDragTabs()
      }

      if (this.drag.dragged) {
        if (!this.$refs.dragTabs || !this.$refs.dragTabs[this.drag.i]) return
        let moveY = e.clientY - this.topOffset + this.$refs.scrollBox.scrollY
        let y

        this.drag.target = 0
        for (let i = 0; i < this.dragTabs.length; i++) {
          let tab = this.dragTabs[i]

          // Dragged tab - just skip
          if (i === this.drag.i) continue

          // Nodes BEFORE dragged
          if (i < this.drag.i) {
            if (tab.top > moveY - tab.h) {
              // - [Dragged tab] UP
              // ...
              // -> You here
              // - OLD PLACE
              y = tab.top + this.drag.h
            } else {
              // ...
              // -> You here
              // - [Dragged tab] UP
              // - OLD PLACE
              this.drag.target = i + 1
              y = tab.top
            }
          }

          // Nodes AFTER dragged
          if (i > this.drag.i) {
            if (tab.top > moveY) {
              // - OLD PLACE
              // - [Dragged tab] DOWN
              // -> You here
              // ...
              y = tab.top
            } else {
              // - OLD PLACE
              // ...
              // -> You here
              // - [Dragged tab] DOWN
              this.drag.target = i
              y = tab.top - this.drag.h
            }
          }

          if (this.$refs.dragTabs[i].lastY !== y) {
            this.$refs.dragTabs[i].style.transform = `translate(0px, ${y}px)`
            this.$refs.dragTabs[i].lastY = y
          }
        }

        let dragY = moveY - this.drag.tabY
        let dragX = e.clientX - this.drag.x
        if (dragY < 0) dragY = 0
        this.$refs.dragTabs[this.drag.i].style.transform = `translate(0px, ${dragY}px)`

        if (dragX > 30) {
          if (!State.dragTabToPanels) return
          this.$parent.dragToNextPanel(this.drag)
          this.drag = null
        }

        if (dragX < -30) {
          if (!State.dragTabToPanels) return
          this.$parent.dragToPrevPanel(this.drag)
          this.drag = null
        }
      }
    },

    onTabMoveEnd() {
      if (!this.drag.dragged) {
        this.drag = null
        return
      }

      // Set final position for dragged node
      let draggedEl = this.$refs.dragTabs[this.drag.i]
      let targetTab = this.dragTabs[this.drag.target]
      if (!draggedEl || !targetTab) {
        this.drag = null
        return
      }
      this.dragEnd = true
      this.$nextTick(() => {
        draggedEl.style.transform = `translate(0px, ${targetTab.top}px)`
      })

      // Update actual nodes order
      let newGlobalIndex = this.drag.globalIndex + this.drag.target - this.drag.i
      if (!this.drag.panel || this.drag.panel === this.drag.origPanel) {
        browser.tabs.move(this.drag.id, { index: newGlobalIndex })
      } else if (this.$parent.panels[this.drag.panel]) {
        let panel = this.$parent.panels[this.drag.panel]
        let tab = this.$parent.allTabs.find(t => t.id === this.drag.id)
        if (!panel.cookieStoreId) {
          this.drag = null
          return
        }
        browser.tabs.create({
          active: true,
          cookieStoreId: panel.cookieStoreId,
          index: newGlobalIndex,
          url: tab.url,
        })
        browser.tabs.remove(this.drag.id)
      }

      // If tab position is not changed (and move event will
      // not trigger) - just reset drag state.
      if (newGlobalIndex === this.drag.globalIndex) {
        setTimeout(() => {
          this.drag = null
        }, 8)
        setTimeout(() => {
          this.dragTabs = null
          this.dragEnd = false
        }, 128)
      }
    },

    onKeySelect(dir) {
      if (this.tabs.length === 0) return

      if (State.selectedTabs.length === 0) {
        let activeTab = this.tabs.find(t => t.active)
        if (activeTab) {
          State.selectedTabs.push(activeTab.id)
        } else if (dir < 0) {
          State.selectedTabs.push(this.tabs[this.tabs.length - 1].id)
        } else if (dir > 0) {
          State.selectedTabs.push(this.tabs[0].id)
        }
        return
      }

      const selId = State.selectedTabs[0]
      let index = this.tabs.findIndex(t => t.id === selId) + dir
      if (index < 0) index = 0
      if (index >= this.tabs.length) index = this.tabs.length - 1
      State.selectedTabs = [this.tabs[index].id]
    },

    onKeySelectChange(dir) {
      if (State.selectedTabs.length === 0) {
        this.onKeySelect(dir)
        return
      }

      if (State.selectedTabs.length === 1) {
        const selId = State.selectedTabs[0]
        let index = this.tabs.findIndex(t => t.id === selId)
        this.selStartIndex = index
        this.selEndIndex = index + dir
      } else {
        this.selEndIndex = this.selEndIndex + dir
      }
      if (this.selEndIndex < 0) this.selEndIndex = 0
      if (this.selEndIndex >= this.tabs.length) this.selEndIndex = this.tabs.length - 1

      let minIndex = Math.min(this.selStartIndex, this.selEndIndex)
      let maxIndex = Math.max(this.selStartIndex, this.selEndIndex)
      State.selectedTabs = []
      for (let i = minIndex; i <= maxIndex; i++) {
        State.selectedTabs.push(this.tabs[i].id)
      }
    },

    onKeyActivate() {
      if (this.tabs.length === 0) return
      if (State.selectedTabs.length === 0) return
      browser.tabs.update(State.selectedTabs[0], { active: true })
      State.selectedTabs = []
    },

    /**
     * Update fake drag tabs.
     */
    recalcDragTabs() {
      let top = 0
      this.dragTabs = this.tabs.map(t => {
        const vm = this.$refs.tabs.find(tvm => tvm.tab.id === t.id)

        t.fav = vm.faviErr ? null : vm.favicon
        t.h = vm.height()
        t.el = vm.$el
        t.top = top

        top += t.h
        return t
      })
    },

    /**
     * Recalc scroll wrapper.
     */
    recalcScroll() {
      if (this.$refs.scrollBox) {
        this.$refs.scrollBox.recalcScroll()
      }
    },

    /**
     * Is tab dragged?
     */
    isDragged(id) {
      if (!this.drag) return false
      return this.drag.id === id && this.drag.dragged
    },

    /**
     * Is tab selected?
     */
    isSelected(id) {
      if (!State.selectedTabs) return false
      return State.selectedTabs.includes(id)
    },

    /**
     * Return styles for fake drag tabs
     */
    dragTabStyle(tab) {
      return {
        transform: `translate(0px, ${tab.top}px)`,
        height: tab.h + 'px',
      }
    },

    /**
     * Create new tab
     */
    createTab() {
      this.$emit('create-tab', this.storeId)
    },
  },
}
</script>


<style lang="stylus" scoped>
@import '../../styles/mixins'

.TabsPanel
  &[drag-active] .container
    opacity: 0
  &[drag-active] .drag-box
    opacity: 1
    z-index: 10
  &[drag-end] .drag-tab[dragged]
    transition: transform var(--d-fast)

.TabsPanel .drag-box
  box(absolute)
  size(100%, same)
  pos(0, 0)
  opacity: 0
  z-index: -1
  transition: opacity var(--d-fast), z-index var(--d-fast)

.TabsPanel .drag-tab
  box(absolute, flex)
  pos(0, 0)
  size(100%)
  align-items: center
  background-color: #24242400
  white-space: nowrap
  transition: transform var(--d-fast), background-color var(--d-fast)
  &[dragged]
    transition: none
    z-index: 50
    background-color: var(--tabs-actibated-bg)

.TabsPanel .drag-fav
  box(relative)
  size(16px, same)
  flex-shrink: 0
  margin: 0 6px 0 7px
  > img
    box(absolute)
    size(100%, same)
  > .placeholder
    box(absolute)
    size(3px, same)
    pos(7px, 6px)
    border-radius: 50%
    background-color: var(--fav-out)
    transition: opacity var(--d-fast), transform var(--d-fast)
    &:before
    &:after
      content: ''
      box(absolute)
      size(3px, same)
      border-radius: 6px
      background-color: var(--fav-out)
    &:before
      pos(0, -5px)
    &:after
      pos(0, 5px)

.TabsPanel .drag-title
  box(relative)
  text(s: rem(16), h: 28px)
  flex-grow: 1
  color: var(--tabs-fg)
  padding: 0 1px
  overflow: hidden
  mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)

.TabsPanel .container
  box(relative)
  size(100%, same)
  padding: 0 0 64px
  transition: transform var(--d-fast), opacity var(--d-fast)
  &[ctx-menu] .tab:not([data-menu])
    opacity: .4
</style>
