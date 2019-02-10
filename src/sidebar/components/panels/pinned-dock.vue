<template lang="pug">
.PinnedDock(v-noise:300.g:12:af.a:0:42.s:0:9=""
  :drag-pointed="dragPointed"
  @wheel="onWheel"
  @drop.stop.prevent="onDrop"
  @dragenter="onDragEnter"
  @dragleave="onDragLeave")
  pinned-tab(v-for="t in pinnedTabs"
    :tab="t"
    :ctx="!ctx"
    @start-selection="$emit('start-selection', $event)"
    @stop-selection="$emit('stop-selection')"
    @dragenter="onTabPointed")
  .to-the-end(v-if="pinnedTabs.length", @dragleave.stop="", @dragenter.stop="")
</template>


<script>
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

    onDragEnter() {
      this.dragPointed = true
    },

    onTabPointed(index) {
      this.pointedTabIndex = index
    },

    onDragLeave() {
      this.dragPointed = false
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
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'

// --- Pinned tabs dock
.PinnedDock
  box(relative, flex)
  z-index: 2000
  background-color: var(--bg)
  &:before
    content: ''
    box(absolute)
    pos(0, 0)
    size(100%, same)
    background-color: #00000008

// Per-Panel
#root.-pinned-tabs-panel .PinnedDock
  size(100%, auto)
  flex-wrap: wrap
  flex-direction: row
  box-shadow: inset 0 1px 0 0 #00000024,
              inset 0 -1px 0 0 #00000024,
              inset 0 0 8px 0 #00000032

// Left
#root.-pinned-tabs-left .PinnedDock
  size(auto, 100%)
  flex-direction: column
  padding: 0 1px 0 0
  box-shadow: inset -1px 0 0 0 #00000024,
              inset 0 0 8px 0 #00000032

// Right
#root.-pinned-tabs-right .PinnedDock
  size(auto, 100%)
  flex-direction: column
  padding: 0 0 0 1px
  box-shadow: inset 1px 0 0 0 #00000024,
              inset 0 0 8px 0 #00000032

// Top
#root.-pinned-tabs-top .PinnedDock
  size(100%, auto)
  flex-wrap: wrap
  flex-direction: row
  box-shadow: inset 0 -1px 0 0 #00000024,
              inset 0 0 8px 0 #00000032

// The last drop position
.PinnedDock .to-the-end
  box(relative)
  opacity: 0
  transition: opacity var(--d-fast)
  &:before
    content: ''
    box(absolute)
    pos(0, 0)
    background-color: var(--tabs-update-badge-bg)

#root.-pinned-tabs-panel .PinnedDock .to-the-end
#root.-pinned-tabs-top .PinnedDock .to-the-end
  size(0, 32px)
  &:before
    size(1px, 32px)

#root.-pinned-tabs-left .PinnedDock .to-the-end
#root.-pinned-tabs-right .PinnedDock .to-the-end
  size(32px, 0)
  &:before
    size(32px, 1px)

.PinnedDock[drag-pointed] .to-the-end
  opacity: 1
</style>