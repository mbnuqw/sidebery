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
import { ref, computed, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import { ScrollBoxComponent, SubPanelType } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import ScrollBox from 'src/components/scroll-box.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import SyncEntryComp from './panel.sync.entry.vue'
import { Sync } from 'src/services/_services'

const props = defineProps<{ isSubPanel?: boolean }>()

const scrollBox = ref<ScrollBoxComponent | null>(null)
const state = reactive({
  expandedHistoryDays: [true],
  syncLoading: false,
  allLoaded: false,
})

onMounted(() => {
  if (scrollBox.value) {
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.Sync) {
      Sync.state.subPanelScrollEl = scrollBox.value.getScrollBox()
    } else {
      Sync.state.panelScrollEl = scrollBox.value.getScrollBox()
    }
  }
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
