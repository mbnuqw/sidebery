<template lang="pug">
.TabsPanel(
  @contextmenu.prevent.stop=""
  @wheel="onWheel"
  @mousedown="onMouseDown"
  @dblclick="onDoubleClick")
  pinned-dock(v-if="$store.state.pinnedTabsPosition === 'panel'"
    :ctx="storeId"
    @start-selection="$emit('start-selection', $event)"
    @stop-selection="$emit('stop-selection')")
  scroll-box(ref="scrollBox", :lock="scrollLock")
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
import Store from '../../store'
import State from '../../store.state'
import Utils from '../../../libs/utils'
import EventBus from '../../event-bus'
import Tab from './tabs.tab.vue'
import ScrollBox from '../scroll-box.vue'
import PinnedDock from './pinned-dock'

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
    scrollLock() {
      return State.scrollThroughTabs !== 'none'
    },

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

    EventBus.$on('recalcPanelScroll', () => {
      if (this.index !== State.panelIndex) return
      this.recalcScroll()
    })

    EventBus.$on('scrollToActiveTab', (panelIndex, tabId) => {
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
      if (e.button === 0) {
        const la = State.tabsPanelLeftClickAction
        if (la === 'prev') return Store.dispatch('switchPanel', -1)
        if (la === 'expand') {
          if (!State.tabsTree) return
          const activeTab = State.tabs.find(t => t.active)
          if (!activeTab || !activeTab.isParent) return
          return Store.dispatch('toggleBranch', activeTab.id)
        }
      }

      if (e.button === 1) {
        e.preventDefault()
        this.createTab()
      }

      if (e.button === 2) {
        const ra = State.tabsPanelRightClickAction
        if (ra === 'next') return Store.dispatch('switchPanel', 1)
        if (ra === 'dash') return EventBus.$emit('openDashboard', State.panelIndex)
        if (ra === 'expand') {
          if (!State.tabsTree) return
          const activeTab = State.tabs.find(t => t.active)
          if (!activeTab || !activeTab.isParent) return
          return Store.dispatch('toggleBranch', activeTab.id)
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
        const globaly = State.scrollThroughTabs === 'global' || e.shiftKey

        if (e.deltaY > 0) {
          if (State.wheelBlockTimeout) return
          Store.dispatch('switchTab', { globaly, cycle: e.ctrlKey, step: 1 })
        }
        if (e.deltaY < 0) {
          if (State.wheelBlockTimeout) return
          Store.dispatch('switchTab', { globaly, cycle: e.ctrlKey, step: -1 })
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
     * Calculate tabs bounds
     */
    getItemsBounds() {
      if (!this.$refs.tabs) return []
      if (!this.$refs.tabs.length) return []

      // probe tabs heights
      const compStyle = getComputedStyle(this.$el)
      const thRaw = compStyle.getPropertyValue('--tabs-height')
      const th = Utils.ParseCSSNum(thRaw.trim())[0]
      if (th === 0) return []
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
      const scollEl = this.$refs.scrollBox.getScrollBox()
      const b = scollEl.getBoundingClientRect()
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
