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
      .snapshot-content(v-if="activeSnapshot" v-noise:300.g:12:af.a:0:42.s:0:9="")
        //- h2 Containers
        //- .containers
        //-   .container(
        //-     v-for="container of activeSnapshot.containersById"
        //-     :key="container.id"
        //-     :data-color="container.color")
        //-     .container-icon
        //-       svg: use(:xlink:href="'#' + container.icon")
        //-     .container-name {{container.name}}
        //-     .container-ctrls
        //-       .btn Create
        //- h2 Panels
        //- .containers
        //-   .container(
        //-     v-for="panel of activeSnapshot.panels"
        //-     :key="panel.id"
        //-     :data-color="panel.color")
        //-     .container-icon
        //-       img(v-if="panel.customIcon" :src="panel.customIcon")
        //-       svg(v-else): use(:xlink:href="'#' + panel.icon")
        //-     .container-name {{panel.name}}
        //-     .container-ctrls
        //-       .btn Create
        //- h2 Tabs
        .windows
          .window(
            v-for="(win, _, i) in activeSnapshot.windowsById"
            v-if="win.panels.length"
            :key="win.id")
            .win-ctrls
              .name {{t('snapshot.window_title') + ' #' + (i + 1)}}
              .btn(@click="openWindow(activeSnapshot, win.id)") {{t('snapshot.btn_open')}}
            .panels
              .panel(
                v-for="panel in win.panels"
                v-if="panel.tabs.length"
                :key="panel.id")
                .panel-info(:data-color="panel.color")
                  .panel-icon
                    img(v-if="panel.customIcon" :src="panel.customIcon")
                    svg(v-else): use(:xlink:href="'#' + panel.icon")
                  .panel-name {{panel.name}}
                .tabs
                  a.tab(
                    v-for="tab in panel.tabs"
                    target="_blank"
                    :key="tab.id"
                    :title="tab.title"
                    :id="tab.id"
                    :href="tab.url"
                    :data-target="tab.id === activeSnapshot.targetId"
                    :data-lvl="tab.lvl"
                    :data-pinned="tab.pinned"
                    :data-color="tab.ctrColor"
                    @click.stop.prevent="onTabClick(tab)")
                    .icon
                      svg.ctr(v-if="tab.ctrIcon"): use(:xlink:href="'#' + tab.ctrIcon")
                      .hm(v-else) {{tab.flof}}
                      svg.pin(v-if="tab.pinned"): use(xlink:href="#icon_pin")
                    .title {{tab.title}}
                    .url {{tab.url}}
</template>


<script>
import Utils from '../../utils'
import { translate } from '../../mixins/dict'
import { DEFAULT_CTX } from '../../defaults'
import { DEFAULT_TABS_PANEL } from '../../defaults'
import State from '../store/state'
import Actions from '../actions'

const SCROLL_CONF = { behavior: 'smooth', block: 'center' }
const DEFAULT_CTR = {
  id: DEFAULT_CTX,
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
      parsedSnapshots.push(normalizeSnapshot(snapshot))
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

      if (this.$refs.snapshots) {
        let target = this.$refs.snapshots.find(el => el.id === this.activeSnapshot.id)
        if (target) target.scrollIntoView(SCROLL_CONF)
      }
    },

    /**
     * Handle click on tab
     */
    async onTabClick(tab) {
      // Try to find this tab among currently open ones
      const tabInfo = await browser.runtime.sendMessage({
        instanceType: 'sidebar',
        action: 'queryTab',
        arg: { url: tab.url, pinned: tab.pinned, cookieStoreId: tab.ctr },
      })
      if (tabInfo) return browser.tabs.update(tabInfo.id, { active: true })

      // or Open this tab in current panel
      const activePanel = await browser.runtime.sendMessage({
        intanceType: 'sidebar',
        action: 'getActivePanel',
      })
      const tabConf = {
        url: Utils.normalizeUrl(tab.url),
        windowId: State.windowId,
      }
      if (activePanel && activePanel.tabs && activePanel.newTabCtx !== 'none') {
        tabConf.cookieStoreId = activePanel.newTabCtx
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

      this.snapshots.unshift(normalizeSnapshot(snapshot))

      this.activeSnapshot = this.snapshots[0]
    },

    /**
     * Apply snapshot
     */
    async applySnapshot(snapshot) {
      // TODO: show loading spinner or something...
      snapshot = Utils.cloneObject(snapshot)
      await this.restoreContainers(snapshot.containersById)
      await this.restorePanels(snapshot)
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
      snapshot = Utils.cloneObject(snapshot)
      await this.restoreContainers(snapshot.containersById)
      await this.restorePanels(snapshot)
      browser.runtime.sendMessage({
        instanceType: 'bg',
        windowId: -1,
        action: 'openSnapshotWindow',
        args: [snapshot, winId],
      })
    },

    async restoreContainers(containers) {
      let ffContainers = await browser.contextualIdentities.query({})

      for (let ctr of Object.values(containers)) {
        let localCtr = ffContainers.find(c => {
          return c.name === ctr.name && c.icon === ctr.icon && c.color === ctr.color
        })
        if (localCtr) {
          ctr.newId = localCtr.cookieStoreId
        } else {
          let newCtr = await browser.contextualIdentities.create({
            name: ctr.name,
            color: ctr.color,
            icon: ctr.icon,
          })
          ctr.newId = newCtr.cookieStoreId
        }
      }
    },

    async restorePanels(snapshot) {
      let { panels } = await browser.storage.local.get({ panels: [] })

      for (let snapPanel of snapshot.panels) {
        let localPanel = panels.find(p => p.id === snapPanel.id)
        if (localPanel) continue

        let panel = Utils.cloneObject(snapPanel)
        State.panels.push(panel)
        State.panelsMap[panel.id] = panel
        Actions.savePanelsDebounced()
      }


      for (let win of Object.values(snapshot.windowsById)) {
        let normPanels = []
        for (let panel of State.panels) {
          let snapPanel = win.panels.find(p => p.id === panel.id)
          if (!snapPanel) continue
          normPanels.push(snapPanel)
        }
        win.panels = normPanels
      }
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
function normalizeSnapshot(snapshot) {
  let tabsCount = 0
  let windowsById = {}

  // Conatiners
  let containersById = {}
  for (let ctrId of Object.keys(snapshot.containersById)) {
    if (ctrId === DEFAULT_CTX) continue
    containersById[ctrId] = snapshot.containersById[ctrId]
  }

  // Panels
  let panels = []
  for (let panel of snapshot.panels) {
    if (panel.id === DEFAULT_CTX) continue
    if (panel.type === 'bookmarks') continue
    panels.push(panel)
  }

  // Windows
  for (let winId of Object.keys(snapshot.windows)) {
    const window = { id: winId, panels: [] }
    snapshot.containersById[DEFAULT_CTR.id] = DEFAULT_CTR

    // Normalize tabs
    for (let item of snapshot.windows[winId].items) {
      if (!item.lvl) item.lvl = 0
      if (!item.ctr) item.ctr = DEFAULT_CTR.id
      if (!item.panel) item.panel = DEFAULT_CTR.id
      let flofi = item.url.indexOf('//')
      if (flofi !== -1) item.flof = item.url[flofi + 2].toUpperCase()
      else item.flof = item.url[0].toUpperCase()
    }

    // Normalize panels
    let defaultTabs = snapshot.panels.find(p => p.type === 'default')
    if (!defaultTabs) {
      snapshot.panels.unshift(Utils.cloneObject(DEFAULT_TABS_PANEL))
    }
    for (let panel of snapshot.panels) {
      if (panel.type !== 'default' && panel.type !== 'tabs') continue
      let tabs = []

      // Tabs
      for (let tab of snapshot.windows[winId].items) {
        if (panel.id !== tab.panel) continue
        if (tab.ctr !== DEFAULT_CTR.id) {
          tab.ctrIcon = snapshot.containersById[tab.ctr].icon
          tab.ctrColor = snapshot.containersById[tab.ctr].color
        }
        tabs.push(tab)
        tabsCount++
      }

      window.panels.push({
        id: panel.id,
        name: panel.name,
        icon: panel.icon,
        color: panel.color,
        customIcon: panel.customIcon,
        tabs: tabs,
      })
    }

    windowsById[winId] = window
  }

  return {
    id: snapshot.id,
    type: 'base',
    event: 'init',
    windowsById: Utils.cloneObject(windowsById),
    containersById: Utils.cloneObject(containersById),
    panels: Utils.cloneArray(panels),
    date: Utils.uDate(snapshot.time),
    time: Utils.uTime(snapshot.time),
    size: Utils.strSize(JSON.stringify(snapshot)),
    winCount: Object.keys(windowsById).length,
    ctrCount: Object.keys(containersById).length,
    tabsCount,
  }
}
</script>
