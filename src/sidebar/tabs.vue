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
        :panel-index="i"
        :selected="isSelected(t.id)"
        @mdl="onTabMDL(i, ...arguments)"
        @mdr="onTabMDR(i, ...arguments)"
        @closedown="$emit('closedown', i)")
</template>


<script>
import Tab from './tabs.tab'
import ScrollBox from './scroll-box'
import Utils from '../libs/utils'
import CtxMenu from './context-menu.js'

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
    activeTab: Number,
    storeId: String,
  },

  data() {
    return {
      topOffset: 0,
      selection: null,
      selectionMenuEl: null,
      selectedTabs: [],
      drag: null,
      dragTabs: [],
      dragEls: [],
      dragEnd: false,
    }
  },

  mounted() {
    this.topOffset = this.$el.getBoundingClientRect().top
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

      if (!vm.tab.pinned) {
        let id = vm.tab.id
        let title = vm.tab.title
        let globalIndex = vm.tab.index
        let h = vm.height()
        let tabY = h >> 1
        let y = e.clientY
        let x = e.clientX
        this.drag = { id, title, globalIndex, i, h, tabY, y, x, top: 0, dragged: false }
      }
    },

    onTabMDR(i, e, vm) {
      if (vm.tab.pinned) return

      let id = vm.tab.id
      let h = vm.height()
      let y = e.clientY
      this.selection = { id, i: vm.tab.index, h, y }
    },

    onTabsSelection(e) {
      if (!this.selection.active && Math.abs(e.clientY - this.selection.y) > 10) {
        this.selection.active = true
        this.$root.closeCtxMenu()
        this.selectedTabs.push(this.selection.id)
        this.recalcDragTabs()
      }

      if (this.selection.active) {
        let moveY = e.clientY - this.topOffset + this.$refs.scrollBox.scrollY
        for (let i = 0; i < this.dragTabs.length; i++) {
          let tab = this.dragTabs[i]

          // Up
          if (this.selection.i > tab.index && moveY < tab.top + tab.h) {
            if (!this.selectedTabs.includes(tab.id)) {
              this.selectedTabs.push(tab.id)
              this.selectionMenuEl = tab.el
            }
          }

          // Down
          if (this.selection.i < tab.index && moveY > tab.top) {
            if (!this.selectedTabs.includes(tab.id)) {
              this.selectedTabs.push(tab.id)
              this.selectionMenuEl = tab.el
            }
          }
        }
      }
    },

    async onTabsSelectionEnd() {
      if (this.selection && !this.selection.active) {
        this.selection = null
        return
      }
      if (this.selection && this.selectedTabs.length < 2) {
        this.selection = null
        this.selectedTabs = []
        return
      }
      this.selection = null
      if (!this.selectionMenuEl) return this.closeSelectionMenu()

      let windows = await Utils.GetAllWindows()
      let otherWindows = []
      let otherDefWindows = []
      let privateWindow
      windows.map(w => {
        if (!privateWindow && w.incognito) privateWindow = w
        if (!w.current) otherWindows.push(w)
        if (!w.current && !w.incognito) otherDefWindows.push(w)
      })

      const menu = new CtxMenu(this.selectionMenuEl, this.closeSelectionMenu)

      // Default window
      if (!this.$root.private) {
        // Move to new window
        menu.add('move_to_new_window', this.moveSelectedTabsToNewWin)

        // Move to windows
        if (otherDefWindows.length === 1) {
          menu.add('move_to_another_window', () => this.moveToWin(otherDefWindows[0]))
        }
        if (otherDefWindows.length > 1) menu.add('move_to_window_', this.moveToWin)

        // Reopen in new private window
        menu.add('tabs_reopen_in_new_priv_window', () => this.reopenInNewPrivWin())

        // Reopen in containers
        if (this.storeId !== 'firefox-default') {
          menu.add('reopen_in_default_panel', this.openInPanel, 'firefox-default')
        }
        this.$root.$refs.sidebar.contexts.map(c => {
          if (this.storeId === c.cookieStoreId) return
          const label = this.t('ctx_menu.re_open_in_') + `||${c.colorCode}>>${c.name}`
          menu.addTranslated(label, this.openInPanel, c.cookieStoreId)
        })
      }

      // Private window
      if (this.$root.private) {
        if (otherWindows.length === 1) {
          menu.add('reopen_in_another_window', () => this.reopenInWin(otherWindows[0]))
        }
        if (otherWindows.length > 1) menu.add('reopen_in_window_', this.reopenInWin)
      }

      menu.add('pin', this.pinSelectedTabs)
      menu.add('tabs_bookmark', this.bookmarkSelectedTabs)
      menu.add('tabs_reload', this.reloadSelectedTabs)
      menu.add('tabs_close', this.closeSelectedTabs)

      this.$root.closeCtxMenu()
      this.$root.ctxMenu = menu
    },

    closeSelectionMenu() {
      this.selectedTabs = []
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
          if (!this.$root.dragTabToPanels) return
          this.$parent.dragToNextPanel(this.drag)
          this.drag = null
        }

        if (dragX < -30) {
          if (!this.$root.dragTabToPanels) return
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
      if (!this.selectedTabs) return false
      return this.selectedTabs.includes(id)
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

    /**
     * Create new window with first selected
     * tab and then move other selected tabs.
     */
    async moveSelectedTabsToNewWin() {
      if (!this.selectedTabs) return
      const first = this.selectedTabs.shift()
      const rest = [...this.selectedTabs]
      const win = await browser.windows.create({ tabId: first })
      browser.tabs.move(rest, {windowId: win.id, index: -1})
    },

    /**
     *  Move selected tabs to window if provided,
     * otherwise show window-choosing menu
     */
    async moveToWin(window) {
      if (!this.selectedTabs) return
      const tabsId = [...this.selectedTabs]
      const windowId = window ? window.id : await this.$root.chooseWin()
      browser.tabs.move(tabsId, { windowId, index: -1 })
    },

    /**
     * Open selected tabs urls in
     * another window.
     */
    async reopenInWin(window) {
      if (!this.selectedTabs) return
      const tabsId = [...this.selectedTabs]
      const windowId = window ? window.id : await this.$root.chooseWin()
      tabsId.map(id => {
        let tab = this.tabs.find(t => t.id === id)
        if (!tab) return
        browser.tabs.create({ windowId, url: tab.url })
      })
    },

    /**
     * Open selected tabs urls in new
     * private window and close them in current window
     */
    async reopenInNewPrivWin() {
      if (!this.selectedTabs) return
      const first = this.selectedTabs.shift()
      const firstTab = this.tabs.find(t => t.id === first)
      if (!firstTab) return
      const rest = [...this.selectedTabs]
      const win = await browser.windows.create({ url: firstTab.url, incognito: true })
      browser.tabs.remove(first)
      for (let tabId of rest) {
        let tab = this.tabs.find(t => t.id === first)
        if (!tab) continue
        browser.tabs.create({windowId: win.id, url: tab.url})
        browser.tabs.remove(tabId)
      }
    },

    /**
     * Open url in panel by cookieStoreId
     */
    async openInPanel(id) {
      if (!this.selectedTabs) return
      const tabsId = [...this.selectedTabs]
      for (let tabId of tabsId) {
        let tab = this.tabs.find(t => t.id === tabId)
        if (!tab) return

        await browser.tabs.create({ cookieStoreId: id, url: tab.url })
        await browser.tabs.remove(tab.id)
      }
    },

    /**
     * Pin selected tabs
     */
    pinSelectedTabs() {
      if (!this.selectedTabs) return
      for (let tabId of this.selectedTabs) {
        browser.tabs.update(tabId, { pinned: true })
      }
    },

    /**
     * Create bookmarks from selected tabs
     */
    bookmarkSelectedTabs() {
      if (!this.selectedTabs) return
      for (let tabId of this.selectedTabs) {
        let tab = this.tabs.find(t => t.id === tabId)
        if (!tab) continue
        browser.bookmarks.create({ title: tab.title, url: tab.url })
      }
    },

    /**
     * Reload selected tabs
     */
    reloadSelectedTabs() {
      if (!this.selectedTabs) return
      for (let tabId of this.selectedTabs) {
        browser.tabs.reload(tabId)
      }
    },

    /**
     * Close selected tabs
     */
    closeSelectedTabs() {
      if (!this.selectedTabs) return
      browser.tabs.remove(this.selectedTabs)
    },
  },
}
</script>


<style lang="stylus" scoped>
@import '../styles/mixins'

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
