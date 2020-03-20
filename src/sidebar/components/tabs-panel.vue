<template lang="pug">
.TabsPanel(
  @wheel="onWheel"
  @contextmenu.stop="onNavCtxMenu"
  @mousedown="onMouseDown"
  @mouseup.right="onRightMouseUp"
  @dblclick="onDoubleClick")
  pinned-dock(
    v-if="$store.state.pinnedTabsPosition === 'panel'"
    :panel-type="panel.type"
    :panel-id="panel.id"
    :ctx="storeId")
  scroll-box(ref="scrollBox")
    .container
      transition-group(name="tab" tag="div"): tab(
        v-for="(t, i) in tabs"
        v-if="!t.invisible"
        ref="tabs"
        :key="t.id"
        :child-count="getChildrenCount(i)"
        :tab="t")
  //- .dbg.
  //-   ID: {{panel.id}}
  //-   Type: {{panel.type}}
  //-   CID: {{panel.cookieStoreId}}
  //-   Tabs count: {{panel.tabs.length}}
  //-   Start index: {{panel.startIndex}}
  //-   End index: {{panel.endIndex}}
</template>

<script>
import EventBus from '../../event-bus'
import { PRE_SCROLL } from '../../../addon/defaults'
import State from '../store/state'
import Actions from '../actions'
import ScrollBox from './scroll-box'
import PinnedDock from './pinned-tabs-dock'
import Tab from './tab'

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
    panel: Object,
  },

  data() {
    return {
      selection: null,
      selectionMenuEl: null,
      drag: null,
      dragTabs: [],
      dragEls: [],
    }
  },

  mounted() {
    this.scrollBoxEl = this.$refs.scrollBox.getScrollBox()

    EventBus.$on('recalcPanelScroll', this.recalcScroll)
    EventBus.$on('updatePanelBounds', this.updatePanelBounds)
    EventBus.$on('scrollToTab', this.scrollToTab)
  },

  beforeDestroy() {
    EventBus.$off('recalcPanelScroll', this.recalcScroll)
    EventBus.$off('updatePanelBounds', this.updatePanelBounds)
    EventBus.$off('scrollToTab', this.scrollToTab)
  },

  methods: {
    scrollToTab(panelIndex, tabId) {
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
    },

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
        const ma = State.tabsPanelMiddleClickAction
        if (ma === 'tab') Actions.createTabInPanel(this.panel)
        if (ma === 'undo') Actions.undoRmTab()
        if (ma === 'rm_act_tab') {
          let actTab = State.tabsMap[State.activeTabId]
          if (actTab && actTab.panelId === this.panel.id && !actTab.pinned) {
            Actions.removeTabs([State.activeTabId])
          }
        }
      }

      if (e.button === 2) {
        Actions.blockCtxMenu()
        const ra = State.tabsPanelRightClickAction
        if (ra === 'next') return Actions.switchPanel(1)
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

    onRightMouseUp(e) {
      if (State.tabLongClickFired) return
      if (State.tabsPanelRightClickAction !== 'menu') return
      if (State.selected.length) return

      let panel = State.panels[this.index]
      if (!panel) return

      e.stopPropagation()

      if (State.ctxMenuNative) return

      let type
      if (panel.type === 'bookmarks') type = 'bookmarksPanel'
      else if (panel.type === 'default') type = 'tabsPanel'
      else if (panel.type === 'tabs') type = 'tabsPanel'

      State.selected = [panel]
      Actions.openCtxMenu(type, e.clientX, e.clientY)
    },

    /**
     * Handle context menu event
     */
    onNavCtxMenu(e) {
      if (
        State.tabLongClickFired ||
        !State.ctxMenuNative ||
        e.ctrlKey ||
        e.shiftKey ||
        typeof State.selected[0] === 'number' ||
        typeof State.selected[0] === 'string'
      ) {
        State.tabLongClickFired = false
        e.stopPropagation()
        e.preventDefault()
        return
      }

      let panel = State.panels[this.index]
      if (!panel) return

      let nativeCtx = { showDefaults: false }
      browser.menus.overrideContext(nativeCtx)

      let type
      if (panel.type === 'bookmarks') type = 'bookmarksPanel'
      else if (panel.type === 'default') type = 'tabsPanel'
      else if (panel.type === 'tabs') type = 'tabsPanel'
      if (!State.selected.length) State.selected = [panel]

      Actions.openCtxMenu(type)
    },

    onDoubleClick(e) {
      if (State.tabsPanelLeftClickAction !== 'none') return
      if (!e.target.className) return
      const da = State.tabsPanelDoubleClickAction
      if (da === 'tab') return Actions.createTabInPanel(this.panel)
      if (da === 'collapse') {
        let panel = State.panels[this.index]
        if (panel) return Actions.foldAllInactiveBranches(panel.tabs)
      }
      if (da === 'undo') Actions.undoRmTab()
    },

    onWheel(e) {
      if (State.scrollThroughTabs !== 'none') {
        if (this.scrollBoxEl && State.scrollThroughTabsExceptOverflow) {
          if (this.scrollBoxEl.scrollHeight > this.scrollBoxEl.offsetHeight) return
        }
        e.preventDefault()
        const globaly = (State.scrollThroughTabs === 'global') ^ e.shiftKey
        const cyclic = State.scrollThroughTabsCyclic ^ e.ctrlKey

        if (e.deltaY > 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, cyclic, 1)
        }
        if (e.deltaY < 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, cyclic, -1)
        }
      }
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

      const b = this.$refs.scrollBox.$el.getBoundingClientRect()
      State.panelTopOffset = b.top
      State.panelLeftOffset = b.left
      State.panelRightOffset = b.right
      State.panelScrollEl = this.getScrollEl()

      if (!this.$refs.tabs || !this.$refs.tabs.length) {
        State.itemSlots = []
        return
      }

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
          lvl: t.lvl,
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
  },
}
</script>
