<template lang="pug">
.SyncPanel.panel
  ScrollBox(ref="scrollBox")
    .content(v-if="!isHidden")
      SyncEntryComp(v-for="entry in Sync.reactive.entries" :key="entry.id" :entry="entry")
      LoadingDots(v-if="state.syncLoading")

  PanelPlaceholder(
    :isLoading="Sync.reactive.loading"
    :isMsg="!Sync.reactive.entries.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { ref, computed, reactive } from 'vue'
import { translate } from 'src/dict'
import type { ScrollBoxComponent } from 'src/types'
import { SubPanelType } from 'src/enums'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Sync from 'src/services/sync.fg'
import ScrollBox from 'src/components/scroll-box.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import SyncEntryComp from './panel.sync.entry.vue'

const props = defineProps<{ isSubPanel?: boolean }>()

const scrollBox = ref<ScrollBoxComponent | null>(null)
const state = reactive({
  expandedHistoryDays: [true],
  syncLoading: false,
  allLoaded: false,
})

// Do not render sync panel content if sync sub-panel is active
const isHidden = computed(() => {
  return (
    !props.isSubPanel &&
    Sidebar.reactive.subPanelActive &&
    Sidebar.reactive.subPanelType === SubPanelType.Sync
  )
})
</script>
