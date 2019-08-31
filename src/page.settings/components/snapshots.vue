<template lang="pug">
.Snapshots
  .wrapper
    .timeline
      .ctrls
        .btn(@click="createSnapshot") {{t('snapshot.btn_create_snapshot')}}
      .cards(v-noise:300.g:12:af.a:0:42.s:0:9="" :data-empty="!snapshots.length")
        .snapshot-card(
          v-for="s in snapshots"
          ref="snapshots"
          :key="s.id"
          :id="s.id"
          :data-type="s.type"
          :data-event="s.event"
          :data-active="activeSnapshot.id === s.id"
          @click="(activeSnapshot = s)")
          .date-time(v-if="s.type === 'base'") {{s.date}} - {{s.time}}
          .info(v-if="s.type === 'base'") {{getSnapInfo(s)}}
          .info(v-if="s.type === 'layer'") {{t('snapshot.event.' + s.event)}}
          .date-time(v-if="s.type === 'layer'") {{s.time}}
    .snapshot
      .ctrls(v-noise:300.g:12:af.a:0:42.s:0:9="" @wheel="onTimelineWheel" :data-empty="!activeSnapshot")
        .title(v-if="activeSnapshot") {{activeSnapshot.date}} - {{activeSnapshot.time}}
        .btn(v-if="activeSnapshot" @click="applySnapshot(activeSnapshot)") {{t('snapshot.btn_apply')}}
        .btn.-warn(v-if="activeSnapshot" @click="removeSnapshot(activeSnapshot)") {{t('snapshot.btn_remove')}}
      .windows(v-if="activeSnapshot" v-noise:300.g:12:af.a:0:42.s:0:9="")
        .window(
          v-for="(win, _, i) in activeSnapshot.windowsById"
          v-if="win.tabs.length"
          :key="win.id")
          .win-ctrls
            .name {{t('snapshot.window_title') + ' #' + (i + 1)}}
            .btn(@click="openWindow(activeSnapshot, win.id)") {{t('snapshot.btn_open')}}
          .tabs
            a.tab(
              v-for="tab in win.tabs"
              target="_blank"
              :title="tab.title"
              :id="tab.id"
              :href="tab.url"
              :data-target="tab.id === activeSnapshot.targetId"
              :data-lvl="tab.lvl"
              :data-pinned="tab.pinned"
              :data-color="getCtrColor(tab.ctr)"
              @click.stop.prevent="onTabClick(tab)")
              .icon
                svg.ctr: use(:xlink:href="'#' + getCtrIcon(tab.ctr)")
                svg.pin(v-if="tab.pinned"): use(xlink:href="#icon_pin")
              .title {{tab.title}}
              .url {{tab.url}}
</template>


<script>
import Utils from '../../utils'
import { translate } from '../../mixins/dict'

const SCROLL_CONF = { behavior: 'smooth', block: 'center' }
const DEFAULT_CTR = {
  id: 'firefox-default',
  name: 'Default',
  icon: 'icon_tabs',
  color: 'default',
}

export default {
  data() {
    return {
      snapshots: [],
      activeSnapshot: null,
    }
  },

  async created() {
    const parsedSnapshots = []
    const { snapshots, snapLayers } = await browser.storage.local.get({
      snapshots: [],
      snapLayers: { global: [], windows: {} },
    })

    // Append snapLayers of previous base-snapshot
    const prevSnapshot = snapshots[snapshots.length - 1]
    if (prevSnapshot) {
      if (!prevSnapshot.layers) prevSnapshot.layers = snapLayers.global
      else prevSnapshot.layers = prevSnapshot.layers.concat(snapLayers.global)

      for (let winId of Object.keys(snapLayers.windows)) {
        const prevSnapWin = prevSnapshot.windows[winId]
        if (!prevSnapWin) continue
        if (!prevSnapWin.layers) prevSnapWin.layers = snapLayers.windows[winId]
        else prevSnapWin.layers = prevSnapWin.layers.concat(snapLayers.windows[winId])
      }
    }

    // Watch 'activeSnapshot' change and scroll to changed target
    const activeSnapshotGetter = Object.getOwnPropertyDescriptor(this, 'activeSnapshot').get
    this.$watch(activeSnapshotGetter, val => {
      if (!val || val.targetId === undefined) return
      const el = document.getElementById(val.targetId)
      if (el) el.scrollIntoView(SCROLL_CONF)
    })

    // Normalize snapshots
    for (let snapshot of snapshots) {
      parsedSnapshots.push(normalizeSnapshot(snapshot, Date.now()))
    }
    parsedSnapshots.reverse()

    this.snapshots = parsedSnapshots
    this.activeSnapshot = parsedSnapshots[0]
  },

  methods: {
    /**
     * Handle wheel event on timeline
     */
    onTimelineWheel(e) {
      e.preventDefault()
      e.stopPropagation()
      let index = this.snapshots.findIndex(s => s.id === this.activeSnapshot.id)

      // Down / Up
      let maxIndex = this.snapshots.length - 1
      if (e.deltaY > 0 && index < maxIndex) index++
      if (e.deltaY < 0 && index > 0) index--

      this.activeSnapshot = this.snapshots[index]

      let target = this.$refs.snapshots.find(el => el.id === this.activeSnapshot.id)
      if (target) target.scrollIntoView(SCROLL_CONF)
    },

    /**
     * Handle click on tab
     */
    async onTabClick(tab) {
      // Try to find this tab among currently open ones
      const tabInfo = await browser.runtime.sendMessage({
        instanceType: 'sidebar',
        action: 'queryTab',
        arg: { url: tab[1], pinned: tab[4], cookieStoreId: tab[5] },
      })
      if (tabInfo) return browser.tabs.update(tabInfo.id, { active: true })

      // or Open this tab in current panel
      const activePanel = await browser.runtime.sendMessage({
        intanceType: 'sidebar',
        action: 'getActivePanel',
      })
      const tabConf = { url: tab[1] }
      if (activePanel && activePanel.tabs) {
        tabConf.cookieStoreId = activePanel.cookieStoreId
      }
      browser.tabs.create(tabConf)
    },

    /**
     * Create new snapshot
     */
    async createSnapshot() {
      const snapshot = await browser.runtime.sendMessage({
        instanceType: 'bg',
        windowId: -1,
        action: 'createSnapshot',
      })
      if (!snapshot) return

      this.snapshots.unshift(normalizeSnapshot(snapshot, Date.now()))

      this.activeSnapshot = this.snapshots[0]
    },

    /**
     * Apply snapshot
     */
    async applySnapshot(snapshot) {
      // TODO: show loading spinner or something...
      await browser.runtime.sendMessage({
        instanceType: 'bg',
        windowId: -1,
        action: 'applySnapshot',
        arg: snapshot,
      })
    },

    /**
     * Open window with listed tabs
     */
    async openWindow(snapshot, winId) {
      await browser.runtime.sendMessage({
        instanceType: 'bg',
        windowId: -1,
        action: 'openSnapshotWindow',
        args: [snapshot, winId],
      })
    },

    /**
     * Remove snapshot
     */
    async removeSnapshot(snapshot) {
      const { snapshots } = await browser.storage.local.get({ snapshots: [] })

      const indexStored = snapshots.findIndex(s => s.id === snapshot.id)
      if (indexStored === -1) return
      snapshots.splice(indexStored, 1)
      browser.storage.local.set({ snapshots })

      let indexLocal = this.snapshots.findIndex(s => s.id === snapshot.id)
      if (indexLocal === -1) return
      this.snapshots.splice(indexLocal, 1)

      if (!this.snapshots.length) {
        this.activeSnapshot = null
        return
      }

      if (this.snapshots[indexLocal]) {
        this.activeSnapshot = this.snapshots[indexLocal]
      } else if (this.snapshots[indexLocal + 1]) {
        this.activeSnapshot = this.snapshots[indexLocal + 1]
      } else if (this.snapshots[indexLocal - 1]) {
        this.activeSnapshot = this.snapshots[indexLocal - 1]
      }
    },

    getCtrColor(id) {
      let container = this.activeSnapshot.containersById[id]
      if (container) return this.activeSnapshot.containersById[id].color
    },

    /**
     * Returns icon id
     */
    getCtrIcon(id) {
      let container = this.activeSnapshot.containersById[id]
      if (container) return this.activeSnapshot.containersById[id].icon
      else return 'icon_tabs'
    },

    /**
     * Get snapshot info
     */
    getSnapInfo(s) {
      return `${s.winCount} ${translate('snapshot.snap_win', s.winCount)} / ` +
        `${s.ctrCount} ${translate('snapshot.snap_ctr', s.ctrCount)} / ` +
        `${s.tabsCount} ${translate('snapshot.snap_tab', s.tabsCount)} / ` +
        `~ ${s.size}`
    },
  },
}

/**
 * Normalize snapshot
 */
function normalizeSnapshot(snapshot, now) {
  let container, tabsCount = 0
  let windowsById = {}

  // Windows
  for (let winId of Object.keys(snapshot.windows)) {
    const window = { id: winId, tabs: [] }
    snapshot.containersById[DEFAULT_CTR.id] = DEFAULT_CTR

    // Items
    for (let item of snapshot.windows[winId].items) {
      // Container / Tab
      if (typeof item === 'string') {
        container = snapshot.containersById[item]
      } else {
        tabsCount++
        // Pinned / Normal tabs
        if (!container) {
          item.pinned = true
          item.lvl = 0
        } else {
          item.pinned = false
          item.ctr = container.id
        }
        window.tabs.push(item)
      }
    }

    windowsById[winId] = window
  }

  return {
    id: snapshot.id,
    type: 'base',
    event: 'init',
    windowsById: Utils.cloneObject(windowsById),
    containersById: Utils.cloneObject(snapshot.containersById),
    date: Utils.uDate(snapshot.time),
    time: Utils.uTime(snapshot.time),
    elapsed: Utils.uElapsed(snapshot.time, now),
    size: Utils.strSize(JSON.stringify(snapshot)),
    winCount: Object.keys(windowsById).length,
    ctrCount: Object.keys(snapshot.containersById).length,
    tabsCount,
  }
}
</script>
