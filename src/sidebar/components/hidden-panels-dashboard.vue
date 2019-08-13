<template lang="pug">
.Dashboard(v-noise:300.g:12:af.a:0:42.s:0:9="")
  .dash-ctrls(v-if="!$store.state.private")
    .ctrl-panel(
      v-for="panel in conf.panels"
      :data-color="panel.color"
      :title="panel.name"
      @click="clickHandler(panel.cookieStoreId)")
      svg: use(:xlink:href="'#' + panel.icon")
      .title {{panel.name}}
</template>


<script>
export default {
  props: {
    conf: Object,
    index: Number,
  },

  data() {
    return {}
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
  },
}
</script>
