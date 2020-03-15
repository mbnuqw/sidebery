<template lang="pug">
.PinnedDock(
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
    panelId: String,
  },

  data() {
    return {
      dragPointed: false,
      pointedTabIndex: -1,
    }
  },

  computed: {
    pinnedTabs() {
      if (State.pinnedTabsPosition === 'panel') {
        return this.$store.getters.pinnedTabs.filter(t => t.panelId === this.panelId)
      } else {
        return this.$store.getters.pinnedTabs
      }
    },
  },

  methods: {
    onWheel(e) {
      if (State.pinnedTabsPosition !== 'panel' && State.scrollThroughTabs !== 'none') {
        const globaly = (State.scrollThroughTabs === 'global') ^ e.shiftKey
        const cyclic = State.scrollThroughTabsCyclic ^ e.ctrlKey

        if (e.deltaY > 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, cyclic, 1, true)
        }
        if (e.deltaY < 0) {
          if (State.wheelBlockTimeout) return
          Actions.switchTab(globaly, cyclic, -1, true)
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
      if (this.dragPointed === true) {
        dropIndex = this.pinnedTabs[this.pinnedTabs.length - 1].index + 1
      } else if (this.pointedTabIndex > -1) {
        dropIndex = this.pointedTabIndex
      }

      Actions.dropToTabs(e, dropIndex, -1, State.dragNodes, true)

      if (State.dragNodes) Actions.resetSelection()

      this.pointedTabIndex = -1
      this.dragPointed = false
      State.dragNodes = null
    },
  },
}
</script>
