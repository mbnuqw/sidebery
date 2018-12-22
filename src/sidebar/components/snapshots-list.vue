<template lang="pug">
.SnapshotsList(v-noise:300.g:12:af.a:0:42.s:0:9="", :is-active="active" @click="cancel")
  .title
    .text {{t('settings.snapshots_title')}}
    .close-btn
      svg: use(xlink:href="#icon_remove")
  .header
    .datetime {{t('snapshots.snapshots_time_label')}}
    .tabs {{t('snapshots.snapshots_tabs_label')}}
  scroll-box(ref="scrollBox")
    .box
      .snapshot(
        v-for="s in snapshots"
        :title="firstFiveUrls(s.tabs)"
        @click="applySnapshot(s)")
        .datetime {{uelapsed(s.time)}}
        .tabs.pinned(v-if="tabsCount('pinned', s.tabs)") {{tabsCount('pinned', s.tabs)}}
        .tabs(v-if="tabsCount(null, s.tabs)") {{tabsCount(null, s.tabs)}}
        .tabs(
          v-for="c in s.ctxs"
          v-if="tabsCount(c, s.tabs)"
          :style="{color: c.colorCode}") {{tabsCount(c, s.tabs)}}
    
  //- .ctrls
  //-   .btn {{t('snapshots.snapshots_close_label')}}
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
    ...mapGetters(['winChoosing', 'defaultCtxId']),
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

    /**
     * Get string containing urls of tabs.
     */
    firstFiveUrls(tabs) {
      if (!tabs) return ''
      let out = tabs.length > 7 ? tabs.slice(0, 7) : tabs
      let outStr = out
        .map(t => {
          if (t.url.length <= 36) return t.url
          else return t.url.slice(0, 36) + '...'
        })
        .join('\n')
      if (tabs.length > 7) outStr += '\n...'
      return outStr
    },

    udate: Utils.UDate,
    utime: Utils.UTime,
    uelapsed: Utils.UElapsed,

    /**
     * Get tabs count for provided container
     */
    tabsCount(ctx, tabs) {
      if (ctx === 'pinned') return tabs.filter(t => t.pinned).length
      if (!ctx)
        return tabs.filter(t => {
          return t.cookieStoreId === this.defaultCtxId && !t.pinned
        }).length
      return tabs.filter(t => t.cookieStoreId === ctx.cookieStoreId && !t.pinned).length
    },

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

.SnapshotsList .title
  box(relative, flex)
  justify-content: space-between
  align-items: center
  padding: 8px 8px 8px 12px
  > .text
    box(relative)
    text(s: rem(24))
    color: var(--settings-title-fg)
  > .close-btn
    box(relative)
    size(27px, same)
    cursor: pointer
    &:hover > svg
      fill: #ea4335
    &:active > svg
      transition: none
      fill: #a63626
    > svg
      box(absolute)
      pos(5px, same)
      size(17px, same)
      fill: #a63626
      transition: fill var(--d-fast)


.SnapshotsList .header
  box(relative, flex)
  text(s: rem(18))
  justify-content: space-between
  align-items: center
  color: var(--settings-label-fg)
  padding: 8px 12px

.SnapshotsList .box
  box(relative)
  padding: 0 0 1px

.SnapshotsList .snapshot
  box(relative, flex)
  text(s: rem(13))
  size(100%)
  color: var(--settings-label-fg)
  margin: 0 0 3px
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
