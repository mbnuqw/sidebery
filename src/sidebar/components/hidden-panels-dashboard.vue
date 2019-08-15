<template lang="pug">
.Dashboard(v-noise:300.g:12:af.a:0:42.s:0:9="")
  .dash-ctrls(v-if="!$store.state.private")
    .ctrl-panel(
      v-for="(panel, i) in conf.panels"
      :data-color="panel.color"
      :data-active="selected === i"
      :title="panel.name"
      @click="clickHandler(panel.cookieStoreId)")
      svg: use(:xlink:href="'#' + panel.icon")
      .title {{panel.name}}
</template>


<script>
import EventBus from '../../event-bus'
import State from '../store/state'

export default {
  props: {
    conf: Object,
    index: Number,
  },

  data() {
    return {
      selected: 0,
    }
  },

  created() {
    EventBus.$on('selectHiddenPanel', this.onSelectHiddenPanel)
    EventBus.$on('createTabInHiddenPanel', this.onCreateTabInHiddenPanel)
  },

  beforeDestroy() {
    EventBus.$off('selectHiddenPanel', this.onSelectHiddenPanel)
    EventBus.$off('createTabInHiddenPanel', this.onCreateTabInHiddenPanel)
  },

  methods: {
    clickHandler(cookieStoreId) {
      this.$emit('close')
      browser.tabs.create({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        cookieStoreId,
        active: true,
      })
    },

    onSelectHiddenPanel(dir) {
      if (this.selected + dir >= this.conf.panels.length) return
      if (this.selected + dir < 0) {
        this.$emit('close')
        State.panelIndex = State.lastPanelIndex
      }
      this.selected += dir
    },

    onCreateTabInHiddenPanel() {
      let panel = this.conf.panels[this.selected]
      if (!panel || panel.bookmarks) return

      this.$emit('close')
      browser.tabs.create({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        cookieStoreId: panel.cookieStoreId,
        active: true,
      })
    },
  },
}
</script>
