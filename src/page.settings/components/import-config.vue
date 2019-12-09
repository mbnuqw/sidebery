<template lang="pug">
.PanelConfig(v-noise:300.g:12:af.a:0:42.s:0:9="" @wheel="onWheel")
  h2.title Select what to import

  toggle-field(
    label="settings.export_containers"
    v-model="containers"
    :inactive="containersInactive")
  toggle-field(
    label="settings.export_panels"
    v-model="panels"
    :inactive="panelsInactive")
  toggle-field(
    label="settings.export_settings"
    v-model="settings"
    :inactive="settingsInactive")
  toggle-field(
    label="settings.export_ctx_menu"
    v-model="ctxMenu"
    :inactive="ctxMenuInactive")
  toggle-field(
    label="settings.export_styles"
    v-model="styles"
    :inactive="stylesInactive")
  toggle-field(
    label="settings.export_snapshots"
    v-model="snapshots"
    :inactive="snapshotsInactive")

  .ctrls(:data-inactive="importInactive")
    a.btn(@click="importData") Import data
</template>


<script>
import { DEFAULT_CONTAINER } from '../../../addon/defaults'
import { DEFAULT_PANELS } from '../../defaults'
import { BOOKMARKS_PANEL } from '../../defaults'
import { DEFAULT_TABS_PANEL } from '../../defaults'
import { TABS_PANEL } from '../../defaults'
import Utils from '../../utils'
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import TextField from '../../components/text-field'
import State from '../store/state'

export default {
  name: 'PanelConfig',

  components: {
    TextField,
    ToggleField,
    SelectField,
  },

  data() {
    return {
      containers: false,
      panels: false,
      settings: false,
      ctxMenu: false,
      styles: false,
      snapshots: false,
    }
  },

  computed: {
    containersInactive() {
      return !State.importConfig.containers ||
        !Object.keys(State.importConfig.containers).length
    },
    panelsInactive() {
      return !State.importConfig.panels || !State.importConfig.panels.length
    },
    settingsInactive() {
      return !State.importConfig.settings
    },
    ctxMenuInactive() {
      return !State.importConfig.tabsMenu && !State.importConfig.bookmarksMenu
    },
    stylesInactive() {
      return !State.importConfig.cssVars &&
        !State.importConfig.sidebarCSS &&
        !State.importConfig.groupCSS
    },
    snapshotsInactive() {
      return !State.importConfig.snapshots
    },
    importInactive() {
      return !this.containers &&
        !this.panels &&
        !this.settings &&
        !this.ctxMenu &&
        !this.styles &&
        !this.snapshots
    },
  },

  mounted() {
    if (!this.containersInactive) this.containers = true
    if (!this.panelsInactive) this.panels = true
    if (!this.settingsInactive) this.settings = true
    if (!this.ctxMenuInactive) this.ctxMenu = true
    if (!this.stylesInactive) this.styles = true
    if (!this.snapshotsInactive) this.snapshots = true
  },

  methods: {
    onWheel(e) {
      let scrollOffset = this.$el.scrollTop
      let maxScrollOffset = this.$el.scrollHeight - this.$el.offsetHeight
      if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
      if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
    },

    async importData() {
      let data = State.importConfig
      let toStore = {}
      let atLeastOne = false

      if (this.containers && data.containers) {
        atLeastOne = true
        await this.importContainers(data, toStore)
      }

      if (this.panels && data.panels && data.panels.length) {
        atLeastOne = true
        await this.importPanels(data, toStore)
      }

      if (this.settings && data.settings) {
        atLeastOne = true
        toStore.settings = Utils.cloneObject(data.settings)
      }

      if (this.ctxMenu) {
        atLeastOne = true
        if (data.tabsMenu) toStore.tabsMenu = Utils.cloneArray(data.tabsMenu)
        if (data.bookmarksMenu) {
          toStore.bookmarksMenu = Utils.cloneArray(data.bookmarksMenu)
        }
      }

      if (this.styles) {
        atLeastOne = true
        if (data.cssVars) toStore.cssVars = Utils.cloneObject(data.cssVars)
        if (data.sidebarCSS) toStore.sidebarCSS = data.sidebarCSS
        if (data.groupCSS) toStore.groupCSS = data.groupCSS
      }

      if (this.snapshots && data.snapshots) {
        atLeastOne = true
        toStore.snapshots = Utils.cloneArray(data.snapshots)
      }

      if (!atLeastOne) return

      browser.storage.local.set(toStore)
      State.importConfig = false
      browser.runtime.reload()
    },

    async importContainers(data, storage) {
      let ffContainers = await browser.contextualIdentities.query({})
      let { containers } = await browser.storage.local.get({ containers: {} })

      for (let ctr of Object.values(Utils.cloneObject(data.containers))) {
        let ffCtr = ffContainers.find(c => {
          return c.name === ctr.name &&
            c.icon === ctr.icon &&
            c.color === ctr.color
        })

        ctr = Utils.normalizeObject(ctr, DEFAULT_CONTAINER)

        if (!ffCtr) {
          let newCtr = await browser.contextualIdentities.create({
            name: ctr.name,
            color: ctr.color,
            icon: ctr.icon,
          })
          ctr.id = newCtr.cookieStoreId
        } else {
          ctr.id = ffCtr.cookieStoreId
        }

        containers[ctr.id] = ctr
      }

      storage.containers = containers
    },

    async importPanels(data, storage) {
      let { panels } = await browser.storage.local.get({ panels: DEFAULT_PANELS })

      for (let panel of Utils.cloneArray(data.panels)) {
        let index = panels.findIndex(p => p.id === panel.id)

        let DFLT
        if (panel.type === 'bookmarks') DFLT = BOOKMARKS_PANEL
        else if (panel.type === 'default') DFLT = DEFAULT_TABS_PANEL
        else if (panel.type === 'tabs') DFLT = TABS_PANEL
        panel = Utils.normalizeObject(panel, DFLT)

        if (index > -1) panels.splice(index, 1, panel)
        else panels.push(panel)
      }

      storage.panels = panels
    },
  },
}
</script>
