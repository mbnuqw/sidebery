<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{t('bookmarks_menu.title')}}

  .field(
    :opt-true="lockedPanel"
    :title="t('tabs_menu.lock_panel_tooltip')"
    @click="togglePanelLock")
    .label {{t('tabs_menu.lock_panel_label')}}
    .input
      .opt.-true {{t('settings.opt_true')}}
      .opt.-false {{t('settings.opt_false')}}

  .options
    .opt(@click="reloadBookmarks") {{t('bookmarks_menu.reload_bookmarks_tree')}}
    .opt(@click="collapseAll") {{t('bookmarks_menu.collapse_all_folders')}}
</template>


<script>
import EventBus from '../event-bus'
import Store from '../store'
import State from '../store.state'

export default {
  props: {
    conf: Object,
    index: Number,
  },

  data() {
    return {}
  },

  computed: {
    lockedPanel() {
      return State.lockedPanels[this.index]
    },
  },

  methods: {
    togglePanelLock() {
      this.$set(State.lockedPanels, this.index, !State.lockedPanels[this.index])
      Store.dispatch('saveState')
    },

    collapseAll() {
      EventBus.$emit('bookmarks.collapseAll')
      this.$emit('close')
    },

    reloadBookmarks() {
      Store.dispatch('reloadBookmarks')
      this.$emit('close')
    },
  },
}
</script>
