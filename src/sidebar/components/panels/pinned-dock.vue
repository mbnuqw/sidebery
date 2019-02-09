<template lang="pug">
.PinnedDock(v-noise:300.g:12:af.a:0:42.s:0:9="")
  pinned-tab(v-for="t in pinnedTabs"
    :tab="t"
    :ctx="!ctx"
    @start-selection="$emit('start-selection', $event)"
    @stop-selection="$emit('stop-selection')")
</template>


<script>
import PinnedTab from './pinned-tab'

export default {
  components: {
    PinnedTab,
  },

  props: {
    ctx: String,
  },

  data() {
    return {}
  },

  computed: {
    pinnedTabs() {
      const pinned = this.$store.getters.pinnedTabs
      if (this.ctx) return pinned.filter(t => t.cookieStoreId === this.ctx)
      else return pinned
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
</style>