<template lang="pug">
.PanelViewSwitcherBar
  template(v-for="(btn, i) of props.conf" :key="btn.id")
    .btn-sep(v-if="i > 0")
    .view-btn(
      :data-active="props.panel.viewMode === btn.id"
      @click="switchViewMode(btn.id)")
      svg: use(:xlink:href="btn.icon")
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { BookmarksPanel, HistoryPanel, DownloadsPanel, ViewModeBtn } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { Search } from 'src/services/search'

type PanelWithViewSwitcher = BookmarksPanel | HistoryPanel | DownloadsPanel

const props = defineProps({
  panel: { type: Object as PropType<PanelWithViewSwitcher>, required: true },
  conf: { type: Array as PropType<ViewModeBtn[]>, required: true },
  off: String,
})

function switchViewMode(mode: string): void {
  if (!props.panel) return
  if (props.off && mode === props.panel.viewMode) props.panel.viewMode = props.off
  else props.panel.viewMode = mode
  Sidebar.saveSidebar()

  if (Search.reactive.value) Search.search()
}
</script>
