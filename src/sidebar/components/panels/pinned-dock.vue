<template lang="pug">
.PinnedDock(
  v-noise:300.g:12:af.a:0:42.s:0:9=""
  :data-empty="pinnedTabs.length === 0"
  :data-drag-pointed="dragPointed"
  @wheel="onWheel"
  @drop.stop.prevent="onDrop"
  @dragenter="onDragEnter"
  @dragleave="onDragLeave")
  pinned-tab(v-for="(t, i) in pinnedTabs"
    :tab="t"
    :ctx="!ctx"
    @remove="removeTab(i, $event)"
    @stop-selection="$emit('stop-selection')"
    @dragenter="onTabPointed")
  .to-the-end(v-if="pinnedTabs.length", @dragleave.stop="", @dragenter.stop="")
</template>


<script>
import Store from '../../store'
import State from '../../store.state'
import EventBus from '../../event-bus'
import PinnedTab from './pinned-tab'

export default {
  components: {
    PinnedTab,
  },

  props: {
    ctx: String,
  },

  data() {
    return {
      dragPointed: false,
      pointedTabIndex: -1,
    }
  },

  computed: {
    pinnedTabs() {
      const pinned = this.$store.getters.pinnedTabs
      if (this.ctx) return pinned.filter(t => t.cookieStoreId === this.ctx)
      else return pinned
    },
  },

  methods: {
    onWheel(e) {
      if (State.pinnedTabsPosition !== 'panel' && State.scrollThroughTabs !== 'none') {
        const globaly = State.scrollThroughTabs === 'global' || e.shiftKey

        if (e.deltaY > 0) {
          if (State.wheelBlockTimeout) return
          this.$store.dispatch('switchTab', { globaly, cycle: e.ctrlKey, step: 1, pinned: true })
        }
        if (e.deltaY < 0) {
          if (State.wheelBlockTimeout) return
          this.$store.dispatch('switchTab', { globaly, cycle: e.ctrlKey, step: -1, pinned: true })
        }
      }
    },

    onDragEnter(e) {
      // console.log('[DEBUG] PinnedDock onDragEnter');
      if (e.srcElement === this.$el) this.dragPointed = true
    },

    onTabPointed(index) {
      this.pointedTabIndex = index
    },

    onDragLeave(e) {
      // console.log('[DEBUG] PinnedDock onDragLeave');
      if (e.srcElement === this.$el) this.dragPointed = false
    },

    onDrop(e) {
      // Get drop index
      let dropIndex = 0
      if (this.dragPointed === true) dropIndex = this.pinnedTabs[this.pinnedTabs.length - 1].index + 1
      else if (this.pointedTabIndex > -1) dropIndex = this.pointedTabIndex

      this.$store.dispatch('dropToTabs', {
        event: e,
        dropIndex: dropIndex,
        dropParent: -1,
        nodes: State.dragNodes,
        pin: true,
      })

      if (State.dragNodes) {
        if (State.dragNodes[0].type === 'tab') EventBus.$emit('deselectTab')
        else EventBus.$emit('deselectBookmark')
      }

      this.pointedTabIndex = -1
      this.dragPointed = false
    },

    async removeTab(index, tab) {
      // Activate another pinned tab or first tab of panel
      if (tab.active) {
        let toActivate = this.pinnedTabs[index + 1] || this.pinnedTabs[index - 1]
        if (!toActivate) {
          let panel = Store.getters.panels[State.panelIndex]
          if (!panel || !panel.tabs) panel = Store.getters.panels[State.lastPanelIndex]
          if (panel && panel.tabs) toActivate = panel.tabs[0]
        }

        if (toActivate) await browser.tabs.update(toActivate.id, { active: true })
      }

      browser.tabs.remove(tab.id)
    },
  },
}
</script>
