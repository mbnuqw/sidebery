<template lang="pug">
.Dashboard(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{t('bookmarks_dashboard.title')}}

  toggle-field(
    label="dashboard.lock_panel_label"
    :title="t('dashboard.lock_panel_tooltip')"
    :value="lockedPanel"
    :inline="true"
    @input="togglePanelLock")

  .delimiter

  .options
    .opt(@click="reloadBookmarks") {{t('bookmarks_dashboard.reload_bookmarks_tree')}}
    .opt(@click="collapseAll") {{t('bookmarks_dashboard.collapse_all_folders')}}
</template>


<script>
import ToggleField from '../../components/toggle-field'
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
    lockedPanel() {
      return this.conf.lockedPanel
    },
  },

  methods: {
    togglePanelLock() {
      this.conf.lockedPanel = !this.conf.lockedPanel
      Actions.savePanels()
    },

    collapseAll() {
      Actions.collapseAllBookmarks()
      this.$emit('close')
    },

    reloadBookmarks() {
      Actions.reloadBookmarks()
      this.$emit('close')
    },
  },
}
</script>
