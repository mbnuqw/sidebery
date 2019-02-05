<template lang="pug">
.TabsPanel(
  :drag-active="drag && drag.dragged"
  :drag-end="dragEnd"
  @contextmenu.prevent.stop=""
  @wheel="onWheel"
  @mousedown="onMouseDown"
  @dblclick="onDoubleClick")
  scroll-box(ref="scrollBox", :lock="scrollLock")
    .container(:ctx-menu="!!$root.ctxMenu")
      tab.tab(
        v-for="(t, i) in tabs"
        v-if="!t.hidden"
        ref="tabs"
        :key="t.id"
        :tab="t"
        @start-selection="$emit('start-selection', $event)"
        @stop-selection="$emit('stop-selection')")
</template>


<script>
import Store from '../../store'
import State from '../../store.state'
import Utils from '../../../libs/utils'
import EventBus from '../../event-bus'
import Tab from './tabs.tab.vue'
import ScrollBox from '../scroll-box.vue'

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

  computed: {
    scrollLock() {
      return State.scrollThroughTabs !== 'none'
    },
  },

  mounted() {
    this.topOffset = this.$el.getBoundingClientRect().top
    EventBus.$on('recalcPanelScroll', () => {
      if (this.index !== State.panelIndex) return
      this.recalcScroll()
    })
    EventBus.$on('scrollToActiveTab', (panelIndex, tabId) => {
      if (panelIndex !== this.index) return
      if (!this.$refs.tabs) return
      const tabVm = this.$refs.tabs.find(t => t.tab.id === tabId)
      if (!tabVm) return
      const activeTabAbsTop = tabVm.$el.offsetTop
      const activeTabAbsBottom = tabVm.$el.offsetTop + tabVm.$el.offsetHeight

      if (activeTabAbsTop < this.$refs.scrollBox.scrollY + 64) {
        this.$refs.scrollBox.setScrollY(activeTabAbsTop - 64)
      } else if (activeTabAbsBottom > this.$refs.scrollBox.scrollY + this.$el.offsetHeight - 64) {
        this.$refs.scrollBox.setScrollY(activeTabAbsBottom - this.$el.offsetHeight + 64)
      }
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
      if (State.panelIndex === this.index) State.selected = this.tabs.map(t => t.id)
    })
  },

  methods: {
    onMouseDown(e) {
      if (e.button === 0) {
        const la = State.tabsPanelLeftClickAction
        if (la === 'prev') return Store.dispatch('switchPanel', -1)
      }

      if (e.button === 1) {
        this.createTab()
      }

      if (e.button === 2) {
        const ra = State.tabsPanelRightClickAction
        if (ra === 'next') return Store.dispatch('switchPanel', 1)
        if (ra === 'dash') return EventBus.$emit('openDashboard', State.panelIndex)
      }
    },

    onDoubleClick() {
      if (State.tabsPanelLeftClickAction !== 'none') return
      const da = State.tabsPanelDoubleClickAction
      if (da === 'tab') return this.createTab()
    },

    onWheel(e) {
      if (State.scrollThroughTabs !== 'none') {
        const globaly = State.scrollThroughTabs === 'global'

        if (e.deltaY > 0) {
          if (State.wheelBlockTimeout) return
          Store.dispatch('switchTab', { globaly, cycle: false, step: 1 })
        }
        if (e.deltaY < 0) {
          if (State.wheelBlockTimeout) return
          Store.dispatch('switchTab', { globaly, cycle: false, step: -1 })
        }
      }
    },

    /**
     * ...
     */
    onKeySelect(dir) {
      if (this.tabs.length === 0) return

      if (State.selected.length === 0) {
        let activeTab = this.tabs.find(t => t.active)
        if (activeTab) {
          State.selected.push(activeTab.id)
        } else if (dir < 0) {
          State.selected.push(this.tabs[this.tabs.length - 1].id)
        } else if (dir > 0) {
          State.selected.push(this.tabs[0].id)
        }
        return
      }

      const selId = State.selected[0]
      let index = this.tabs.findIndex(t => t.id === selId) + dir
      if (index < 0) index = 0
      if (index >= this.tabs.length) index = this.tabs.length - 1
      State.selected = [this.tabs[index].id]

      this.scrollToSelectedTab()
    },

    onKeySelectChange(dir) {
      if (State.selected.length === 0) {
        this.onKeySelect(dir)
        return
      }

      if (State.selected.length === 1) {
        const selId = State.selected[0]
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
      State.selected = []
      for (let i = minIndex; i <= maxIndex; i++) {
        State.selected.push(this.tabs[i].id)
      }

      this.scrollToSelectedTab()
    },

    scrollToSelectedTab() {
      const tabId = State.selected[0]
      if (tabId === undefined) return
      const tabVm = this.$refs.tabs.find(t => t.tab.id === tabId)
      if (!tabVm) return
      const activeTabAbsTop = tabVm.$el.offsetTop
      const activeTabAbsBottom = tabVm.$el.offsetTop + tabVm.$el.offsetHeight

      if (activeTabAbsTop < this.$refs.scrollBox.scrollY + 64) {
        this.$refs.scrollBox.setScrollY(activeTabAbsTop - 64)
      } else if (activeTabAbsBottom > this.$refs.scrollBox.scrollY + this.$el.offsetHeight - 64) {
        this.$refs.scrollBox.setScrollY(activeTabAbsBottom - this.$el.offsetHeight + 64)
      }
    },

    onKeyActivate() {
      if (this.tabs.length === 0) return
      if (State.selected.length === 0) return
      browser.tabs.update(State.selected[0], { active: true })
      State.selected = []
    },

    /**
     * Update fake drag tabs.
     */
    recalcDragTabs() {
      // let top = 0
      // this.dragTabs = this.tabs.map(t => {
      //   const vm = this.$refs.tabs.find(tvm => tvm.tab.id === t.id)

      //   t.fav = vm.faviErr ? null : vm.favicon
      //   t.h = vm.height()
      //   t.el = vm.$el
      //   t.top = top

      //   top += t.h
      //   return t
      // })
    },

    /**
     * Calculate tabs bounds
     */
    getItemsBounds() {
      if (!this.$refs.tabs) return null
      if (!this.$refs.tabs.length) return []

      // probe tabs heights
      const compStyle = getComputedStyle(this.$el)
      const thRaw = compStyle.getPropertyValue('--tabs-height')
      const th = Utils.ParseCSSNum(thRaw.trim())[0]
      if (th === 0) return []
      const half = th >> 1
      const e = half >> 1

      let overallHeight = 0
      const bounds = []
      for (let t of this.tabs) {
        if (t.hidden) continue

        bounds.push({
          type: 'tab',
          id: t.id,
          index: t.index,
          in: true,
          folded: t.folded,
          parent: t.parentId,
          start: overallHeight,
          top: overallHeight + e,
          center: overallHeight + half,
          bottom: overallHeight + half + e,
          end: overallHeight + th,
        })

        overallHeight += th
      }

      return bounds
    },

    /**
     * Return scroll-box element
     */
    getScrollEl() {
      if (!this.$refs.scrollBox) return
      else return this.$refs.scrollBox.getScrollBox()
    },

    /**
     * Return top offset of panel
     */
    getTopOffset() {
      const b = this.$el.getBoundingClientRect()
      return b.top
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
@import '../../../styles/mixins'

.TabsPanel
  &[drag-active] .container
    opacity: 0
  &[drag-active] .drag-box
    opacity: 1
    z-index: 10
  &[drag-end] .drag-tab[dragged]
    transition: transform var(--d-fast)

.TabsPanel .container
  box(relative)
  size(100%, same)
  padding: 0 0 64px
  transition: transform var(--d-fast), opacity var(--d-fast)
  &[ctx-menu] .tab:not([data-menu])
    opacity: .4
</style>
