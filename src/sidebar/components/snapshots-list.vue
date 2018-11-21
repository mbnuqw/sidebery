<template lang="pug">
.SnapshotsList(v-noise:300.g:12:af.a:0:42.s:0:9="", :is-active="active" @click="cancel")
  scroll-box(ref="scrollBox")
    .box
      .snapshot(v-for="s in snapshots") sss
    
  .ctrls
    .btn Close
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../libs/utils'
import EventBus from '../event-bus'
import Store from '../store'
import ScrollBox from './scroll-box'

export default {
  components: {
    ScrollBox,
  },

  data() {
    return {
      active: false,
      snapshots: [],
    }
  },

  computed: {
    ...mapGetters(['winChoosing']),
  },

  created() {
    EventBus.$on('toggle-snapshots-list', () => this.toggle())
  },

  methods: {
    /**
     * Toggle this panel
     */
    async toggle() {
      if (this.active) this.close()
      else this.open()
    },

    /**
     * Open this panel
     */
    async open() {
      this.active = true
      this.snapshots = await Store.dispatch('loadAllSnapshots')
    },

    /**
     * Close this panel
     */
    async close() {
      this.active = false
      await Utils.Sleep(120)
      this.snapshots = []
    },

    /**
     * Close this panel
     */
    cancel() {
      this.close()
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.SnapshotsList
  box(absolute, flex)
  pos(0, 0)
  size(100%, same)
  flex-direction: column
  z-index: -1
  background-color: var(--bg)
  opacity: 0
  transition: opacity var(--d-fast), z-index var(--d-fast)
.SnapshotsList[is-active]
  opacity: 1
  z-index: 1500


.SnapshotsList .ctrls
  box(relative, flex)
  size(100%, 48px)
  justify-content: center
  align-items: center

.SnapshotsList .ctrls > .btn
  text(s: rem(14))
  padding: 3px 10px
  margin: 0 8px
</style>
