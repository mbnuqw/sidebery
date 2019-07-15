<template lang="pug">
.Snapshots
  .wrapper(v-if="activeSnapshot")
    .timeline(v-noise:300.g:12:af.a:0:42.s:0:9="")
      .snapshot-card(
        v-for="s in snapshots"
        ref="snapshots"
        :key="s.id"
        :id="s.id"
        :title="s.date + ' - ' + s.time"
        :data-type="s.type"
        :data-event="s.event"
        :data-active="activeSnapshot.id === s.id"
        @click="activeSnapshot = s")
        .date-time(v-if="s.type === 'base'") {{s.date}} - {{s.time}}
        .info(v-if="s.type === 'base'") {{s.winCount}} windows - {{s.tabsCount}} tabs
        .info(v-if="s.type === 'layer'") {{t('snapshot.event.' + s.event)}}
        .date-time(v-if="s.type === 'layer'") {{s.time}}
    .snapshot
      .ctrls(v-noise:300.g:12:af.a:0:42.s:0:9="" @wheel="onTimelineWheel")
        .title {{activeSnapshot.date}} - {{activeSnapshot.time}}
        .btn Apply
        .btn Apply in new window
        .btn.-warn Remove
      .windows(v-if="activeSnapshot" v-noise:300.g:12:af.a:0:42.s:0:9="")
        .window(
          v-for="(win, _, i) in activeSnapshot.windowsById"
          v-if="win.tabs.length"
          :key="win.id")
          .name Window {{'#' + (i + 1)}}
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
              :data-color="activeSnapshot.containersById[tab.ctr].color"
              @click.stop.prevent="onTabClick(tab)")
              .icon
                svg.ctr: use(:xlink:href="'#' + getCtrIcon(tab.ctr)")
                svg.pin(v-if="tab.pinned"): use(xlink:href="#icon_pin")
              .title {{tab.title}}
              .url {{tab.url}}
</template>


<script>
import Utils from '../../utils'

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

      for (let winId in snapLayers.windows) {
        if (!snapLayers.windows.hasOwnProperty(winId)) continue
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
    const now = Math.trunc(Date.now() / 1000)
    for (let snapshot of snapshots) {
      let windowsById = {}
      let layers = snapshot.layers || []
      let tabsCount = 0
      let container

      // Windows
      for (let winId in snapshot.windows) {
        if (!snapshot.windows.hasOwnProperty(winId)) continue

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

        for (let layer of snapshot.windows[winId].layers) {
          layer.winId = winId
        }
        layers = layers.concat(snapshot.windows[winId].layers)

        windowsById[winId] = window
      }

      const time = Math.trunc(snapshot.time/1000)
      parsedSnapshots.push({
        id: snapshot.id,
        type: 'base',
        event: 'init',
        windowsById: Utils.cloneObject(windowsById),
        containersById: Utils.cloneObject(snapshot.containersById),
        date: Utils.uDate(time),
        time: Utils.uTime(time),
        elapsed: Utils.uElapsed(time, now),
        winCount: Object.keys(windowsById).length,
        tabsCount,
      })

      layers.sort((a, b) => a.t - b.t)
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        // const winId = layer.winId
        let event = layer.key
        let ctr, tab, targetId

        if (typeof layer.id === 'number') {
          if (!windowsById[layer.winId]) break
          let tabs = windowsById[layer.winId].tabs

          // Tab Created
          if (layer.key === 'tab') {
            tab = layer
            tabs.splice(layer.index, 0, tab)
          }

          // Tab Removed
          else if (layer.key === undefined) {
            const index = tabs.findIndex(t => t.id === layer.id)
            tabs.splice(index, 1)
            event = 'tab-rm'
          }

          // Tab Moved
          else if (layer.key === 'tab-mv') {
            const index = tabs.findIndex(t => t.id === layer.id)
            tab = tabs.splice(index, 1)[0]
            tab.lvl = layer.lvl
            tabs.splice(layer.index, 0, tab)
          }

          // ...
          else {
            tab = tabs.find(t => t.id === layer.id)
            if (layer.key === 'tab-url') tab.url = layer.val
            if (layer.key === 'tab-title') tab.title = layer.val
            if (layer.key === 'tab-lvl') tab.lvl = layer.val
            if (layer.key === 'tab-pin') tab.pinned = true
            if (layer.key === 'tab-unpin') tab.pinned = false
          }
        } else {
          // Container Created
          if (layer.key === 'ctr') {
            ctr = layer
            snapshot.containersById[layer.id] = ctr
          }

          // Container Removed
          else if (layer.key === undefined) {
            delete snapshot.containersById[layer.id]
            event = 'ctr-rm'
          }

          // ...
          else {
            ctr = snapshot.containersById[layer.id]
            if (layer.key === 'ctr-color') ctr.color = layer.val
            if (layer.key === 'ctr-icon') ctr.icon = layer.val
            if (layer.key === 'ctr-name') ctr.name = layer.val
          }
        }

        // Get id of target
        if (tab) targetId = tab.id
        if (ctr) targetId = ctr.id

        // Append snapshot
        let time = Math.trunc(layer.t/1000)
        parsedSnapshots.push({
          id: snapshot.id + i,
          type: 'layer',
          event,
          date: Utils.uDate(time),
          time: Utils.uTime(time),
          targetId,
          elapsed: Utils.uElapsed(time, now),
          windowsById: Utils.cloneObject(windowsById),
          containersById: Utils.cloneObject(snapshot.containersById),
        })
      }
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
     * Returns icon id
     */
    getCtrIcon(id) {
      return this.activeSnapshot.containersById[id].icon
    }
  },
}
</script>
