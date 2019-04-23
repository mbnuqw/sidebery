<template lang="pug">
.SnapshotsList
  h1 Snapshots
  .snapshot(v-for="(s, i) in $store.state.snapshots")
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
import Utils from '../libs/utils'
import Store from '../sidebar/store'
import State from '../sidebar/store.state'

export default {
  data() {
    return {
      active: false,
      snapshots: [],
    }
  },

  computed: {
    ...mapGetters(['defaultCtxId']),
  },

  methods: {
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
      // Remove
      if (State.snapshots[index]) {
        State.snapshots.splice(index, 1)
      }

      // Store snapshots
      const snapshots = JSON.parse(JSON.stringify(State.snapshots)).reverse()
      browser.storage.local.set({ snapshots })
    },

    /**
     * Try to open tab
     */
    async openTab(e, tab) {
      const windowId = browser.windows.WINDOW_ID_CURRENT
      const tabs = await browser.tabs.query({ windowId })

      // Find target tab
      const targetTab = tabs.find(t => {
        return t.url === tab.url && t.cookieStoreId === tab.cookieStoreId
      })

      // Activate target tab or create new
      if (targetTab) {
        browser.tabs.update(targetTab.id, { active: true })
      } else {
        browser.tabs.create({
          windowId: State.windowId,
          url: tab.url,
          cookieStoreId: tab.cookieStoreId,
          active: !e.ctrlKey && e.button === 0,
        })
      }
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

.SnapshotsList
  box(relative)
  size(100%, max-w: 400px)
  flex-grow: 1
  flex-wrap: wrap
  justify-content: flex-start
  align-items: flex-start

.SnapshotsList h1
  box(relative)
  size(100%)
  text(s: 2.5rem, w: 700)
  padding: 30px 0
  color: var(--label-fg)
  text-align: center

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
