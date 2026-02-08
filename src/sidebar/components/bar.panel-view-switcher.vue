<template lang="pug">
.PanelViewSwitcherBar
  template(v-for="(btn, i) of props.conf" :key="btn.id")
    .btn-sep(v-if="i > 0")
    .view-btn(
      :data-active="props.panel.viewMode === btn.id"
      @click="switchViewMode(btn.id)")
      svg: use(:href="btn.icon")
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import type { BookmarksPanel, HistoryPanel, ViewModeBtn } from 'src/types'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Search from 'src/services/search.fg'

type PanelWithViewSwitcher = BookmarksPanel | HistoryPanel

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

  if (Search.active) Search.search()
}
</script>
