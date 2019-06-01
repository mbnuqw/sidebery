<template lang="pug">
.Dashboard(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{conf.name}}

  toggle-field(
    label="dashboard.lock_panel_label"
    :title="t('dashboard.lock_panel_tooltip')"
    :value="conf.lockedPanel"
    :inline="true"
    @input="togglePanelLock")

  toggle-field(
    label="dashboard.no_empty_label"
    :title="t('dashboard.no_empty_tooltip')"
    :value="conf.noEmpty"
    :inline="true"
    @input="togglePanelNoEmpty")

  .delimiter

  .options
    .opt(v-if="haveTabs", @click="dedupTabs") {{t('tabs_dashboard.dedup_tabs')}}
    .opt(v-if="haveTabs", @click="reloadAllTabs") {{t('tabs_dashboard.reload_all_tabs')}}
    .opt(v-if="haveTabs", @click="closeAllTabs") {{t('tabs_dashboard.close_all_tabs')}}
</template>


<script>
import ToggleField from '../../components/toggle-field'
import State from '../store/state'
import Actions from '../actions'

export default {
  components: {
    ToggleField,
  },

  props: {
    conf: Object,
    index: Number,
  },

  data() {
    return {}
  },

  computed: {
    haveTabs() {
      if (!this.conf.tabs) return false
      return this.conf.tabs.length > 0
    },
  },

  methods: {
    togglePanelLock() {
      this.conf.lockedPanel = !this.conf.lockedPanel
      Actions.savePanels(State)
    },

    async togglePanelNoEmpty() {
      this.conf.noEmpty = !this.conf.noEmpty
      if (this.conf.noEmpty) {
        const defaultId = State.defaultCtxId
        const panel = State.panels.find(p => p.cookieStoreId === defaultId)
        if (panel && panel.tabs && !panel.tabs.length) {
          await browser.tabs.create({
            windowId: State.windowId,
            index: panel.startIndex,
            cookieStoreId: panel.cookieStoreId,
            active: true,
          })
        }
      }
      Actions.savePanels(State)
    },

    dedupTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      const toClose = []
      this.conf.tabs.map((t, i) => {
        for (let j = i + 1; j < this.conf.tabs.length; j++) {
          if (this.conf.tabs[j].url === t.url) toClose.push(this.conf.tabs[j].id)
        }
      })
      browser.tabs.remove(toClose)
      this.$emit('close')
    },

    reloadAllTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      this.conf.tabs.map(t => browser.tabs.reload(t.id))
      this.$emit('close')
    },

    closeAllTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      browser.tabs.remove(this.conf.tabs.map(t => t.id))
      this.$emit('close')
    },
  },
}
</script>
