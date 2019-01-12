<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{conf.name}}

  toggle-field(
    label="tabs_menu.lock_panel_label"
    :title="t('tabs_menu.lock_panel_tooltip')"
    :value="lockedPanel"
    :inline="true"
    @input="togglePanelLock")

  toggle-field(
    v-if="!isPrivate"
    label="tabs_menu.sync_label"
    :value="syncON"
    :inline="true"
    @input="toggleSync")

  .options
    .opt(v-if="haveTabs", @click="dedupTabs") {{t('tabs_menu.dedup_tabs')}}
    .opt(v-if="haveTabs", @click="reloadAllTabs") {{t('tabs_menu.reload_all_tabs')}}
    .opt(v-if="haveTabs", @click="closeAllTabs") {{t('default_tabs_menu.close_all_tabs')}}
</template>


<script>
import {mapGetters} from 'vuex'
import Store from '../store'
import State from '../store.state'
import ToggleField from './field.toggle'

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
    ...mapGetters(['isPrivate']),

    lockedPanel() {
      return State.lockedPanels[this.index]
    },

    syncON() {
      return State.syncedPanels[this.index]
    },

    haveTabs() {
      if (!this.conf.tabs) return false
      return this.conf.tabs.length > 0
    },
  },

  methods: {
    togglePanelLock() {
      this.$set(State.lockedPanels, this.index, !State.lockedPanels[this.index])
      Store.dispatch('saveState')
    },

    toggleSync() {
      this.$set(State.syncedPanels, this.index, !State.syncedPanels[this.index])
      // let id = this.conf.pinned ? 'pinned' : State.defaultCtx
      // let pi = State.syncPanels.findIndex(p => p === id)
      // if (pi !== -1) State.syncPanels.splice(pi, 1)
      // else State.syncPanels.push(id)
      Store.dispatch('resyncPanels')
      Store.dispatch('saveState')
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
