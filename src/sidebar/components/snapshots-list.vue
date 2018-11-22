<template lang="pug">
.SnapshotsList(v-noise:300.g:12:af.a:0:42.s:0:9="", :is-active="active" @click="cancel")
  .header
    .datetime Date
    .tabs Tabs
  scroll-box(ref="scrollBox")
    .box
      .snapshot(v-for="s in snapshots", :title="firstFiveUrls(s.tabs)")
        .datetime
          .date {{udate(s.time)}}
          .time {{utime(s.time)}}
        .tabs.pinned {{tabsCount('pinned', s.tabs)}}
        .tabs {{tabsCount(null, s.tabs)}}
        .tabs(v-for="c in s.ctxs", :style="{color: c.colorCode}") {{tabsCount(c, s.tabs)}}
    
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

    /**
     * Close this panel
     */
    cancel() {
      this.close()
    },

    firstFiveUrls(tabs) {
      if (!tabs) return ''
      let out = tabs.length > 7 ? tabs.slice(0, 7) : tabs
      let outStr = out.map(t => {
        if (t.url.length <= 36) return t.url
        else return t.url.slice(0, 36) + '...'
      }).join('\n')
      if (tabs.length > 7) outStr += '\n...'
      return outStr
    },

    udate(sec) {
      if (!sec) return null
      const dt = new Date(sec * 1000)
      let dtday = dt.getDate()
      if (dtday < 10) dtday = '0' + dtday
      let dtmth = dt.getMonth() + 1
      if (dtmth < 10) dtmth = '0' + dtmth
      return `${dt.getFullYear()}.${dtmth}.${dtday}`
    },

    utime(sec) {
      if (!sec) return null
      const dt = new Date(sec * 1000)
      let dtsec = dt.getSeconds()
      if (dtsec < 10) dtsec = '0' + dtsec
      let dtmin = dt.getMinutes()
      if (dtmin < 10) dtmin = '0' + dtmin
      let dthr = dt.getHours()
      if (dthr < 10) dthr = '0' + dthr
      return `${dthr}:${dtmin}:${dtsec}`
    },

    /**
     * Get tabs count for provided container
     */
    tabsCount(ctx, tabs) {
      if (ctx === 'pinned') return tabs.filter(t => t.pinned).length
      if (!ctx) return tabs.filter(t => {
        return t.cookieStoreId === this.defaultCtxId
          && !t.pinned
      }).length
      return tabs.filter(t => t.cookieStoreId === ctx.cookieStoreId).length
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

.SnapshotsList .header
  box(relative, flex)
  text(s: rem(16))
  justify-content: space-between
  align-items: center
  color: var(--settings-label-fg)
  padding: 6px 8px


.SnapshotsList .snapshot
  box(relative, flex)
  text(s: rem(13))
  size(100%)
  color: var(--settings-label-fg)
  margin: 0 0 3px
  padding: 3px 8px
  cursor: pointer
  opacity: .8
  transition: opacity var(--d-fast)
  &:hover
    opacity: 1
  &:active
    opacity: .7

  .datetime
    box(relative)
    margin-right: auto

  .date
    box(relative)
    white-space: nowrap

  .time
    box(relative)
    white-space: nowrap
    opacity: .7

  .tabs
    size(min-w: 12px)
    text-align: right
    margin: 0 0 0 5px
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
