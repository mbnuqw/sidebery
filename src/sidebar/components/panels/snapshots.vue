<template lang="pug">
.SnapshotsList
  scroll-box(ref="scrollBox")
    .box
      .snapshot(
        v-for="(s, i) in $store.state.snapshots")
        .datetime {{uelapsed(s.time)}}
        .panel-info(v-if="s.tabs.find(t => t.pinned)")
          .url.pinned(
            v-for="t in s.tabs.filter(t => t.pinned)"
            :title="t.url"
            @mousedown.prevent.stop="openTab($event, t)") {{t.title}}
        .panel-info(v-if="s.tabs.find(t => !t.pinned && t.cookieStoreId === defaultCtxId)")
          .url(
            v-for="t in s.tabs.filter(t => !t.pinned && t.cookieStoreId === defaultCtxId)"
            :title="t.url"
            :tree-lvl="t.lvl"
            @mousedown.prevent.stop="openTab($event, t)") {{t.title}}
        .panel-info(
          v-for="c in s.ctxs"
          v-if="s.tabs.find(t => !t.pinned && t.cookieStoreId === c.cookieStoreId)")
          .url(
            v-for="t in s.tabs.filter(t => !t.pinned && t.cookieStoreId === c.cookieStoreId)"
            :style="{color: c.colorCode}"
            :title="t.url"
            :tree-lvl="t.lvl"
            @mousedown.prevent.stop="openTab($event, t)") {{t.title}}
        .ctrls
          .btn(@click="applySnapshot(s)") {{t('settings.apply_snapshot')}}
          .btn.-warn(@click="removeSnapshot(i)") {{t('settings.rm_snapshot')}}
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../../libs/utils'
import Store from '../../store'
import State from '../../store.state'
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
    ...mapGetters(['defaultCtxId']),
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

    /**
     * Remove snapshot
     */
    removeSnapshot(index) {
      Store.dispatch('removeSnapshot', index)
    },

    /**
     * Try to open tab
     */
    openTab(e, tab) {
      const panels = Store.getters.panels
      if (!panels) return
      const panel = panels.find(p => p.cookieStoreId === tab.cookieStoreId)
      if (!panel || !panel.tabs) return

      const targetTab = panel.tabs.find(t => t.url === tab.url)
      if (targetTab) browser.tabs.update(targetTab.id, { active: true })
      else browser.tabs.create({
        windowId: State.windowId,
        url: tab.url,
        cookieStoreId: tab.cookieStoreId,
        active: !e.ctrlKey && e.button === 0,
      })
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

  .datetime
    box(relative)
    text(s: rem(18), w: 600)
    padding: 5px 0
    margin-right: auto

  .panel-info
    box(relative)
    margin-top: 6px

  .url
    box(relative)
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap
    padding: 2px 0 2px 8px
    cursor: pointer
    opacity: .8
    &.pinned
      color: var(--settings-snapshot-counter-pinned-fg)
    &:hover
      opacity: 1
    &:active
      opacity: .7
    &[tree-lvl="0"]
      margin-left: 0
    &[tree-lvl="1"]
      margin-left: 10px
    &[tree-lvl="2"]
      margin-left: 20px
    &[tree-lvl="3"]
      margin-left: 30px
    &[tree-lvl="4"]
      margin-left: 40px
    &[tree-lvl="5"]
      margin-left: 50px
    &[tree-lvl="6"]
      margin-left: 60px
    &[tree-lvl="7"]
      margin-left: 70px
    &[tree-lvl="8"]
      margin-left: 80px
    &[tree-lvl="9"]
      margin-left: 90px
    &[tree-lvl="10"]
      margin-left: 100px

.SnapshotsList .ctrls
  box(relative, flex)
  justify-content: flex-end
  align-items: center
  grid-gap: 0px 8px
  padding: 8px 0

.SnapshotsList .ctrls > .btn
  background-color: #00000000
  box-shadow: none
  color: var(--true-fg)
  opacity: .8
  transition: opacity var(--d-fast)
  &.-warn
    color: var(--false-fg)
  &:hover
    opacity: 1
  &:active
    transition: none
    opacity: .7
  
</style>
