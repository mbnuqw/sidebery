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
        .point
        .event {{t('snapshot.event.' + s.event)}}
        .elapsed {{s.date}} - {{s.time}}
    .snapshot
      .ctrls(v-noise:300.g:12:af.a:0:42.s:0:9="")
        .title(@wheel="onTimelineWheel") {{activeSnapshot.date}} - {{activeSnapshot.time}}
        .btn Apply
        .btn Apply in new window
        .btn.-warn Remove
      .containers(v-if="activeSnapshot" v-noise:300.g:12:af.a:0:42.s:0:9="")
        .container(
          v-for="ctr in activeSnapshot.containers"
          :id="ctr[0]"
          :data-color="ctr[1]"
          :data-target="ctr[0] === activeSnapshot.targetId")
          .info
            .icon: svg: use(:xlink:href="'#' + ctr[2]")
            .name {{ctr[3]}}
          .tabs
            .placeholder(v-if="!ctr[4].length")
            a.tab(
              v-for="tab in ctr[4]"
              target="_blank"
              :title="tab[2]"
              :id="tab[0]"
              :href="tab[1]"
              :data-target="tab[0] === activeSnapshot.targetId"
              :data-lvl="tab[3]"
              :data-pinned="tab[4]"
              @click.stop.prevent="onTabClick(tab)")
              .pin: svg: use(xlink:href="#icon_pin")
              .title {{tab[2]}}
              .url {{tab[1]}}
</template>


<script>
import Utils from '../../utils'

const SCROLL_CONF = { behavior: 'smooth', block: 'center' }

export default {
  data() {
    return {
      snapshots: [],
      activeSnapshot: null,
    }
  },

  async created() {
    const ans = await browser.storage.local.get(['snapshots', 'snapLayers'])
    if (!ans || !ans.snapshots || !ans.snapLayers) return

    // Watch 'activeSnapshot' change and scroll to changed target
    const activeSnapshotGetter = Object.getOwnPropertyDescriptor(this, 'activeSnapshot').get
    this.$watch(activeSnapshotGetter, val => {
      if (!val || val.targetId === undefined) return
      const el = document.getElementById(val.targetId)
      if (el) el.scrollIntoView(SCROLL_CONF)
    })

    // Add layers to the last base-snapshot
    const snapLayer = ans.snapLayers[0]
    if (snapLayer) {
      for (let i = ans.snapshots.length; i--;) {
        if (ans.snapshots[i].id === snapLayer[0]) {
          ans.snapshots[i].layers = ans.snapLayers
          break
        }
      }
    }

    // Normalize snapshots
    const snapshots = []
    const now = Math.trunc(Date.now() / 1000)
    for (let snapshot of ans.snapshots) {
      let container, tabs = [], containers = [], pinnedTabs = []
      for (let item of snapshot.items) {
        if (typeof item[0] === 'string') {
          container = item
          containers.push(container)
        } else {
          if (!container) {
            pinnedTabs.push(item)
            tabs.push(item)
          } else {
            item[4] = false
            tabs.push(item.concat(container))
          }
        }
      }
      for (let pinnedTab of pinnedTabs) {
        const container = containers.find(c => c[0] === pinnedTab[4])
        pinnedTab[4] = true
        pinnedTab.push(...container)
      }

      // Split tabs by containers
      const clonedContainers = Utils.cloneArray(containers)
      for (let ctr of clonedContainers) {
        ctr[4] = Utils.cloneArray(tabs.filter(t => t[5] === ctr[0]))
      }
      
      snapshots.push({
        id: snapshot.id,
        windowId: snapshot.windowId,
        type: 'base',
        event: 'init',
        containers: clonedContainers,
        date: Utils.uDate(snapshot.time),
        time: Utils.uTime(snapshot.time),
        elapsed: Utils.uElapsed(snapshot.time, now)
      })

      if (snapshot.layers) {
        for (let i = 0; i < snapshot.layers.length; i++) {
          let layer = snapshot.layers[i]
          let ctr, tab, event, value = '', targetId
          if (typeof layer[2] === 'number') {

            // Tab Created
            if (layer.length === 9) {
              const ctr = containers.find(c => c[0] === layer[8])
              tab = [
                layer[2], layer[4], layer[5], layer[6], layer[7], // tab info
                ctr[0], ctr[1], ctr[2], ctr[3], // container info
              ]
              tabs.splice(layer[3], 0, tab)
              event = 'tab-created'
            }

            // Tab Removed
            else if (layer.length === 3) {
              const index = tabs.findIndex(t => t[0] === layer[2])
              tabs.splice(index, 1)
              event = 'tab-removed'
            }

            // Tab Moved
            else if (typeof layer[3] === 'number') {
              const index = tabs.findIndex(t => t[0] === layer[2])
              tab = tabs.splice(index, 1)[0]
              tab[3] = layer[4]
              tabs.splice(layer[3], 0, tab)
              event = 'tab-moved'
            }

            // Tab's Url changed
            else if (layer[3] === 'u') {
              tab = tabs.find(t => t[0] === layer[2])
              tab[1] = layer[4]
              event = 'tab-url-changed'
            }

            // Tab's Title changed
            else if (layer[3] === 't') {
              tab = tabs.find(t => t[0] === layer[2])
              tab[2] = layer[4]
              event = 'tab-title-changed'
            }

            // Tab's TreeLevel changed
            else if (layer[3] === 'l') {
              tab = tabs.find(t => t[0] === layer[2])
              tab[3] = layer[4]
              event = 'tab-lvl-changed'
            }

            // Tab pin/unpin
            else if (layer[3] === 'p') {
              tab = tabs.find(t => t[0] === layer[2])
              tab[4] = layer[4]
              event = layer[4] ? 'tab-pin' : 'tab-unpin'
            }
          } else {

            // Container Created
            if (layer.length === 6) {
              ctr = [layer[2], layer[3], layer[4], layer[5]]
              containers.push(ctr)
              event = 'ctr-created'
            }

            // Container Removed
            else if (layer.length === 3) {
              const index = containers.findIndex(c => c[0] === layer[2])
              containers.splice(index, 1)
              event = 'ctr-removed'
            }

            // Container's Color changed
            else if (layer[3] === 'c') {
              ctr = containers.find(c => c[0] === layer[2])
              ctr[1] = layer[4]
              for (let tab of tabs) {
                if (tab[5] === ctr[0]) tab[6] = layer[4]
              }
              event = 'ctr-color-changed'
            }

            // Container's Icon changed
            else if (layer[3] === 'i') {
              ctr = containers.find(c => c[0] === layer[2])
              ctr[2] = layer[4]
              for (let tab of tabs) {
                if (tab[5] === ctr[0]) tab[7] = layer[4]
              }
              event = 'ctr-icon-changed'
            }

            // Container's Name changed
            else if (layer[3] === 'n') {
              ctr = containers.find(c => c[0] === layer[2])
              ctr[3] = layer[4]
              for (let tab of tabs) {
                if (tab[5] === ctr[0]) tab[8] = layer[4]
              }
              event = 'ctr-name-changed'
            }
          }

          // Split tabs by containers
          const clonedContainers = Utils.cloneArray(containers)
          for (let ctr of clonedContainers) {
            ctr[4] = Utils.cloneArray(tabs.filter(t => t[5] === ctr[0]))
          }

          // Get id of target
          if (tab) targetId = tab[0]
          if (ctr) targetId = ctr[0]

          // Append snapshot
          snapshots.push({
            id: layer[0] + i,
            type: 'layer',
            event,
            date: Utils.uDate(layer[1]),
            time: Utils.uTime(layer[1]),
            value,
            containers: clonedContainers,
            targetId,
            elapsed: Utils.uElapsed(layer[1], now)
          })
        }
      }
    }
    snapshots.reverse()

    this.snapshots = snapshots
    this.activeSnapshot = snapshots[0]
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
  },
}
</script>
