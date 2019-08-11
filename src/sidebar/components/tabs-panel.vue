<template lang="pug">
.TabsPanel(
  @wheel="onWheel"
  @mousedown="onMouseDown"
  @dblclick="onDoubleClick")
  pinned-dock(v-if="$store.state.pinnedTabsPosition === 'panel'"
    :ctx="storeId"
    @start-selection="$emit('start-selection', $event)"
    @stop-selection="$emit('stop-selection')")
  scroll-box(ref="scrollBox")
    .container(:style="{ height: scrollHeight }")
      tab(
        v-for="(t, i) in tabs"
        ref="tabs"
        :key="t.id"
        :position="getTabYPosition(i)"
        :child-count="getChildrenCount(i)"
        :tab="t"
        @start-selection="$emit('start-selection', $event)"
        @stop-selection="$emit('stop-selection')")
</template>


<script>
import Utils from '../../utils'
import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'
import ScrollBox from './scroll-box'
import PinnedDock from './pinned-tabs-dock'
import Tab from './tab'

const PRE_SCROLL = 64

export default {
  components: {
    PinnedDock,
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
    }
  },

  computed: {
    scrollHeight() {
      let h = PRE_SCROLL
      for (let t of this.tabs) {
        if (!t.invisible) h += State.tabHeight
      }
      return `${h}px`
    },
  },

  mounted() {
    this.topOffset = this.$el.getBoundingClientRect().top
    this.scrollBoxEl = this.$refs.scrollBox.getScrollBox()

    EventBus.$on('recalcPanelScroll', this.recalcScroll)
    EventBus.$on('updatePanelBounds', this.updatePanelBounds)

    EventBus.$on('scrollToTab', (panelIndex, tabId) => {
      if (panelIndex !== this.index) return
      if (!this.scrollBoxEl) return
      const sh = this.scrollBoxEl.offsetHeight
      let h = 0
      for (let t of this.tabs) {
        if (!t.invisible) h += State.tabHeight
        if (t.id === tabId) break
      }
      if (h - State.tabHeight < this.scrollBoxEl.scrollTop + PRE_SCROLL) {
        this.scrollBoxEl.scrollTop = h - State.tabHeight - PRE_SCROLL
      }
      if (h + PRE_SCROLL > sh + this.scrollBoxEl.scrollTop) {
        this.scrollBoxEl.scrollTop = h - sh + PRE_SCROLL
      }
    })
  },

  methods: {
    onMouseDown(e) {
      if (e.target.draggable) return
      if (State.selected.length) return

      if (e.button === 0) {
        const la = State.tabsPanelLeftClickAction
        if (la === 'prev') return Actions.switchPanel(-1)
        if (la === 'expand') {
          if (!State.tabsTree) return
          let targetTab = State.tabs.find(t => t.active)
          if (!targetTab) return
          if (!targetTab.isParent) targetTab = State.tabsMap[targetTab.parentId]
          if (!targetTab) return
          return Actions.toggleBranch(targetTab.id)
        }
        if (la === 'parent') {
          if (!State.tabsTree) return
          const activeTab = State.tabs.find(t => t.active)
          if (!activeTab || !State.tabsMap[activeTab.parentId]) return
          browser.tabs.update(activeTab.parentId, { active: true })
        }
      }

      if (e.button === 1) {
        e.preventDefault()
        this.createTab()
      }

      if (e.button === 2) {
        const ra = State.tabsPanelRightClickAction
        if (ra === 'next') return Actions.switchPanel(1)
        if (ra === 'dash') return Actions.openDashboard(State.panelIndex)
        if (ra === 'expand') {
          if (!State.tabsTree) return
          let targetTab = State.tabs.find(t => t.active)
          if (!targetTab) return
          if (!targetTab.isParent) targetTab = State.tabsMap[targetTab.parentId]
          if (!targetTab) return
          return Actions.toggleBranch(targetTab.id)
        }
        if (ra === 'parent') {
          if (!State.tabsTree) return
          const activeTab = State.tabs.find(t => t.active)
          if (!activeTab || !State.tabsMap[activeTab.parentId]) return
          browser.tabs.update(activeTab.parentId, { active: true })
        }
      }
    },

    onDoubleClick() {
      if (State.tabsPanelLeftClickAction !== 'none') return
      const da = State.tabsPanelDoubleClickAction
      if (da === 'tab') return this.createTab()
    },

    onWheel(e) {
      if (State.scrollThroughTabs !== 'none') {
        if (this.scrollBoxEl && State.scrollThroughTabsExceptOverflow) {
          if (this.scrollBoxEl.scrollHeight > this.scrollBoxEl.offsetHeight) return
        }
        e.preventDefault()
        const globaly = State.scrollThroughTabs === 'global' || e.shiftKey

        if (e.deltaY > 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, e.ctrlKey, 1)
        }
        if (e.deltaY < 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, e.ctrlKey, -1)
        }
      }
    },

    getTabYPosition(i) {
      let out = i
      while (i--) {
        if (this.tabs[i].invisible) out--
      }
      return out * State.tabHeight
    },

    getChildrenCount(i) {
      if (!State.tabsChildCount) return 0
      if (!this.tabs[i].isParent) return 0
      let count = 0
      for (let c = i + 1; c < this.tabs.length; c++) {
        if (this.tabs[c].lvl <= this.tabs[i].lvl) break
        count++
      }
      return count
    },

    /**
     * reCalculate tabs bounds, panel's size and so on...
     */
    updatePanelBounds() {
      if (State.panelIndex !== this.index) return

      const scollEl = this.$refs.scrollBox.getScrollBox()
      const b = scollEl.getBoundingClientRect()
      State.panelTopOffset = b.top
      State.panelLeftOffset = b.left
      State.panelScrollEl = this.getScrollEl()

      if (!this.$refs.tabs) return
      if (!this.$refs.tabs.length) return

      // probe tabs heights
      const compStyle = getComputedStyle(this.$el)
      const thRaw = compStyle.getPropertyValue('--tabs-height')
      const th = Utils.parseCSSNum(thRaw.trim())[0]
      if (th === 0) return
      const half = th >> 1
      const e = (half >> 1) + 2

      let overallHeight = 0
      const bounds = []
      for (let t of this.tabs) {
        if (t.invisible) continue

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

      State.itemSlots = bounds
    },

    /**
     * Return scroll-box element
     */
    getScrollEl() {
      if (!this.$refs.scrollBox) return
      else return this.$refs.scrollBox.getScrollBox()
    },

    /**
     * Recalc scroll wrapper.
     */
    recalcScroll() {
      if (this.index !== State.panelIndex) return
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
     * Create new tab
     */
    createTab() {
      Actions.createTab(this.storeId)
    },
  },
}
</script>
