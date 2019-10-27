<template lang="pug">
.PinnedDock(
  v-noise:300.g:12:af.a:0:42.s:0:9=""
  tabindex="-1"
  :data-empty="pinnedTabs.length === 0"
  :data-drag-pointed="dragPointed"
  @wheel="onWheel"
  @drop.stop.prevent="onDrop"
  @dragenter="onDragEnter"
  @dragleave="onDragLeave")
  pinned-tab(
    v-for="(t, i) in pinnedTabs"
    :key="t.id"
    :tab="t"
    :ctx="!ctx"
    @remove="removeTab(i, $event)"
    @dragenter="onTabPointed")
  .to-the-end(v-if="pinnedTabs.length" @dragleave.stop="" @dragenter.stop="")
</template>


<script>
import State from '../store/state'
import Actions from '../actions'
import PinnedTab from './pinned-tab'

export default {
  components: {
    PinnedTab,
  },

  props: {
    ctx: String,
    panelType: String,
  },

  data() {
    return {
      dragPointed: false,
      pointedTabIndex: -1,
    }
  },

  computed: {
    pinnedTabs() {
      let pinned = this.$store.getters.pinnedTabs
      if (this.panelType === 'ctx' && this.ctx) {
        return pinned.filter(t => t.cookieStoreId === this.ctx)
      }
      if (this.panelType === 'default' || this.panelType === 'tabs') {
        return pinned.filter(t => {
          let ctxPanel = State.panels.find(p => {
            return p.type === 'ctx' && p.cookieStoreId === t.cookieStoreId
          })
          return !ctxPanel
        })
      }
      return pinned
    },
  },

  methods: {
    onWheel(e) {
      if (State.pinnedTabsPosition !== 'panel' && State.scrollThroughTabs !== 'none') {
        const globaly = State.scrollThroughTabs === 'global' || e.shiftKey

        if (e.deltaY > 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, e.ctrlKey, 1, true)
        }
        if (e.deltaY < 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, e.ctrlKey, -1, true)
        }
      }
    },
  
    onDragEnter(e) {
      if (e.srcElement === this.$el) this.dragPointed = true
    },

    onTabPointed(index) {
      this.pointedTabIndex = index
    },

    onDragLeave(e) {
      if (e.srcElement === this.$el) this.dragPointed = false
    },

    onDrop(e) {
      // Get drop index
      let dropIndex = 0
      if (this.dragPointed === true) dropIndex = this.pinnedTabs[this.pinnedTabs.length - 1].index + 1
      else if (this.pointedTabIndex > -1) dropIndex = this.pointedTabIndex

      Actions.dropToTabs(e, dropIndex, -1, State.dragNodes, true)

      if (State.dragNodes) Actions.resetSelection()

      this.pointedTabIndex = -1
      this.dragPointed = false
      State.dragNodes = null
    },

    async removeTab(index, tab) {
      // Activate another pinned tab or first tab of panel
      if (tab.active) {
        let toActivate = this.pinnedTabs[index + 1] || this.pinnedTabs[index - 1]
        if (!toActivate) {
          let panel = State.panels[State.panelIndex]
          if (!panel || !panel.tabs) panel = State.panels[State.lastPanelIndex]
          if (panel && panel.tabs) toActivate = panel.tabs[0]
        }

        if (toActivate) await browser.tabs.update(toActivate.id, { active: true })
      }

      browser.tabs.remove(tab.id)
    },
  },
}
</script>
