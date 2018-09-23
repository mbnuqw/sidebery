<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{conf.name}}

  .field(v-if="!$root.private", :opt-true="syncON", @click="toggleSync")
    .label {{t('tabs_menu.sync_label')}}
    .input
      .opt.-true {{t('settings.opt_true')}}
      .opt.-false {{t('settings.opt_false')}}

  .options
    .opt(v-if="conf.tabs.length > 0", @click="closeAllTabs") {{t('default_tabs_menu.close_all_tabs')}}
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

    closeAllTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      browser.tabs.remove(this.conf.tabs.map(t => t.id))
      this.$emit('close')
    },
  },
}
</script>
