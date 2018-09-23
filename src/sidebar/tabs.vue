<template lang="pug">
.TabsPanel(
  :drag-active="drag && drag.dragged"
  :drag-end="dragEnd"
  @contextmenu.prevent.stop=""
  @mousedown="onMD"
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
        :dragged="isDragged(t.id)"
        @md="onTabMD(i, ...arguments)"
        @closedown="$emit('closedown', i)")
</template>


<script>
import Tab from './tabs.tab'
import ScrollBox from './scroll-box'

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
      mpb: [],
      topOffset: 0,
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
    onMD(e) {
      this.mpb[e.button] = true
    },

    onMU(e) {
      this.mpb[e.button] = false

      if (this.drag) {
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
      }
    },

    onMM(e) {
      if (!this.drag) return

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

    onTabMD(i, e, vm) {
      // Activate tab
      browser.tabs.update(vm.tab.id, { active: true })

      if (!vm.tab.pinned) {
        let h = vm.height()
        this.drag = {
          id: vm.tab.id,
          title: vm.tab.title,
          globalIndex: vm.tab.index,
          i,
          h,
          tabY: h >> 1,
          y: e.clientY,
          x: e.clientX,
          top: 0,
          dragged: false,
        }
      }
    },

    recalcDragTabs() {
      let top = 0
      this.dragTabs = this.tabs.map(t => {
        const vm = this.$refs.tabs.find(tvm => tvm.tab.id === t.id)

        t.fav = vm.faviErr ? null : vm.favicon
        t.h = vm.height()
        t.top = top

        top += t.h
        return t
      })
    },

    recalcScroll() {
      if (this.$refs.scrollBox) {
        this.$refs.scrollBox.recalcScroll()
      }
    },

    /**
     * Dragged state of tab
     */
    isDragged(id) {
      if (!this.drag) return false
      return this.drag.id === id && this.drag.dragged
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
  transition: transform var(--d-fast), opacity var(--d-fast)
  &[ctx-menu] .tab:not([data-menu])
    opacity: .4
</style>
