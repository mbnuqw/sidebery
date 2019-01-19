<template lang="pug">
.SnapshotsList
  scroll-box(ref="scrollBox")
    .box
      .snapshot(
        v-for="s in $store.state.snapshots"
        @click="applySnapshot(s)")
        .datetime {{uelapsed(s.time)}}
        .panel-info(v-if="s.tabs.find(t => t.pinned)")
          .url.pinned(
            v-for="t in s.tabs.filter(t => t.pinned)"
            :title="t.url") - {{t.title}}
        .panel-info(v-if="s.tabs.find(t => !t.pinned && t.cookieStoreId === defaultCtxId)")
          .url(
            v-for="t in s.tabs.filter(t => !t.pinned && t.cookieStoreId === defaultCtxId)"
            :title="t.url") - {{t.title}}
        .panel-info(
          v-for="c in s.ctxs"
          v-if="s.tabs.find(t => !t.pinned && t.cookieStoreId === c.cookieStoreId)")
          .url(
            v-for="t in s.tabs.filter(t => !t.pinned && t.cookieStoreId === c.cookieStoreId)"
            :style="{color: c.colorCode}"
            :title="t.url") - {{t.title}}
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../../libs/utils'
import Store from '../../store'
import ScrollBox from '../scroll-box'

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
    ...mapGetters(['winChoosing', 'defaultCtxId']),
  },

  beforeDestroy() {
    Store.dispatch('unloadSnapshots')
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
      this.snapshots.reverse()
      await this.$nextTick()
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    /**
     * Close this panel
     */
    async close() {
      this.active = false
      await Utils.Sleep(120)
      this.snapshots = []
    },

    udate: Utils.UDate,
    utime: Utils.UTime,
    uelapsed: Utils.UElapsed,

    /**
     * Apply snapshot
     */
    applySnapshot(snapshot) {
      Store.dispatch('applySnapshot', snapshot)
    },
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'

.SnapshotsList
  box(absolute, flex)
  pos(0, 0)
  size(100%, same)
  flex-direction: column

.SnapshotsList .box
  box(relative)
  padding: 0 0 1px

.SnapshotsList .snapshot
  box(relative, flex)
  text(s: rem(13))
  size(100%)
  flex-direction: column
  color: var(--label-fg)
  margin: 0 0 8px
  padding: 3px 12px
  cursor: pointer
  opacity: .8
  transition: opacity var(--d-fast)
  &:hover
    opacity: 1
  &:active
    opacity: .7

  .datetime
    box(relative)
    text(s: rem(14))
    margin-right: auto

  .panel-info
    box(relative)
    margin-top: 6px

  .url
    box(relative)
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap
    padding: 0 0 0 8px
    &.pinned
      color: var(--settings-snapshot-counter-pinned-fg)

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
