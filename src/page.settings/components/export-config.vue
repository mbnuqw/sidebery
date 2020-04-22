<template lang="pug">
.PanelConfig(@wheel="onWheel")
  h2.title {{t('settings.export_title')}}

  ToggleField(label="settings.export_containers" v-model="containers")
  ToggleField(label="settings.export_panels" v-model="panels")
  ToggleField(label="settings.export_settings" v-model="settings")
  ToggleField(label="settings.export_ctx_menu" v-model="ctxMenu")
  ToggleField(label="settings.export_styles" v-model="styles")
  ToggleField(label="settings.export_snapshots" v-model="snapshots")

  .ctrls
    a.btn(ref="exportData" @mouseenter="genExportData") {{t('settings.help_exp_data')}}
</template>

<script>
import ToggleField from '../../components/toggle-field'

export default {
  name: 'PanelConfig',

  components: {
    ToggleField,
  },

  data() {
    return {
      containers: true,
      panels: true,
      settings: true,
      ctxMenu: true,
      styles: true,
      snapshots: true,
    }
  },

  methods: {
    onWheel(e) {
      let scrollOffset = this.$el.scrollTop
      let maxScrollOffset = this.$el.scrollHeight - this.$el.offsetHeight
      if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
      if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
    },

    selectAll() {
      this.containers = true
      this.panels = true
      this.settings = true
      this.ctxMenu = true
      this.styles = true
      this.snapshots = true
    },

    async genExportData() {
      let toExport = {}
      if (this.containers) toExport.containers_v4 = {}
      if (this.panels) toExport.panels_v4 = []
      if (this.settings) toExport.settings = {}
      if (this.ctxMenu) {
        toExport.tabsMenu = []
        toExport.bookmarksMenu = []
      }
      if (this.styles) {
        toExport.cssVars = {}
        toExport.sidebarCSS = ''
        toExport.groupCSS = ''
      }
      if (this.snapshots) toExport.snapshots_v4 = []

      let data = await browser.storage.local.get(toExport)

      data.ver = browser.runtime.getManifest().version
      let dataJSON = JSON.stringify(data)
      let file = new Blob([dataJSON], { type: 'application/json' })
      let now = Date.now()
      let date = Utils.uDate(now, '.')
      let time = Utils.uTime(now, '.')

      this.$refs.exportData.href = URL.createObjectURL(file)
      this.$refs.exportData.download = `sidebery-data-${date}-${time}.json`
      this.$refs.exportData.title = `sidebery-data-${date}-${time}.json`
    },
  },
}
</script>
