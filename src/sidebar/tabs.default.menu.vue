<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{conf.name}}

  .field(v-if="!$root.private", :opt-true="syncON", @click="toggleSync")
    .label {{t('tabs_menu.sync_label')}}
    .input
      .opt.-true {{t('settings.opt_true')}}
      .opt.-false {{t('settings.opt_false')}}

  .options
    .opt(v-if="haveTabs", @click="dedupTabs") {{t('tabs_menu.dedup_tabs')}}
    .opt(v-if="haveTabs", @click="reloadAllTabs") {{t('tabs_menu.reload_all_tabs')}}
    .opt(v-if="haveTabs", @click="closeAllTabs") {{t('default_tabs_menu.close_all_tabs')}}
</template>


<script>
export default {
  props: {
    conf: Object,
  },

  data() {
    return {}
  },

  computed: {
    syncON() {
      if (this.conf.pinned) return !!this.$root.syncPanels.find(p => p === 'pinned')
      else return !!this.$root.syncPanels.find(p => p === this.$root.defaultCtx)
    },

    haveTabs() {
      if (!this.conf.tabs) return false
      return this.conf.tabs.length > 0
    },
  },

  methods: {
    toggleSync() {
      let id = this.conf.pinned ? 'pinned' : this.$root.defaultCtx
      let pi = this.$root.syncPanels.findIndex(p => p === id)
      if (pi !== -1) this.$root.syncPanels.splice(pi, 1)
      else this.$root.syncPanels.push(id)
      this.$root.resyncPanels()
      this.$root.saveState()
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
