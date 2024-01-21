<template lang="pug">
.HistoryPanel.panel
  ScrollBox(ref="scrollBox" @bottom="onScrollBottom")
    .history-groups(v-if="!isHidden")
      .group(
        v-for="(day, i) of History.reactive.days"
        :key="day.title"
        :data-folded="!state.expandedHistoryDays[i] && !isFiltering")
        SubListTitle(
          :title="day.title"
          :len="day.visits.length"
          :expanded="!!state.expandedHistoryDays[i] || isFiltering"
          @click="toggleHistoryGroup($event, i)")
        .group-list(v-if="!!state.expandedHistoryDays[i] || isFiltering")
          HistoryItemVue(
            v-for="visitId in day.visits"
            :key="visitId"
            :visit="History.byId[visitId]")
      .controls(:data-loading="state.historyLoading" :data-all-loaded="state.allLoaded")
        .note(@click="onScrollBottom") {{translate('panel.history.load_more')}}

      LoadingDots(v-if="state.historyLoading")

  PanelPlaceholder(
    :isLoading="History.reactive.loading"
    :isNotPerm="!Permissions.reactive.history"
    :permMsg="translate('panel.history.req_perm')"
    perm="history"
    :isMsg="!History.reactive.days.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { ScrollBoxComponent, SubPanelType } from 'src/types'
import { History } from 'src/services/history'
import { Search } from 'src/services/search'
import { Permissions } from 'src/services/permissions'
import { Sidebar } from 'src/services/sidebar'
import ScrollBox from 'src/components/scroll-box.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import HistoryItemVue from './history-item.vue'
import SubListTitle from './sub-list-title.vue'
import * as Logs from 'src/services/logs'

const props = defineProps<{ isSubPanel?: boolean }>()

const scrollBox = ref<ScrollBoxComponent | null>(null)
const state = reactive({
  expandedHistoryDays: [true],
  historyLoading: false,
  allLoaded: false,
})

onMounted(() => {
  if (scrollBox.value) {
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.History) {
      History.subPanelScrollEl = scrollBox.value.getScrollBox()
    } else {
      History.panelScrollEl = scrollBox.value.getScrollBox()
    }
  }
})

// Do not render history panel content if history sub-panel is active
const isHidden = computed(() => {
  return (
    !props.isSubPanel &&
    Sidebar.reactive.subPanelActive &&
    Sidebar.reactive.subPanelType === SubPanelType.History
  )
})

const isFiltering = computed<boolean>(() => !!Search.reactive.value)

function toggleHistoryGroup(e: MouseEvent, index: number): void {
  if (e.altKey) {
    const value = !state.expandedHistoryDays[index]
    for (let i = 0; i < History.reactive.days.length; i++) {
      state.expandedHistoryDays[i] = value
    }
  } else {
    state.expandedHistoryDays[index] = !state.expandedHistoryDays[index]
  }
}

async function onScrollBottom(): Promise<void> {
  if (state.historyLoading || History.allLoaded) return
  if (isFiltering.value) return
  if (!History.ready) return

  state.historyLoading = true
  await Utils.sleep(250)
  await History.loadMore()
  state.historyLoading = false

  if (History.allLoaded) state.allLoaded = true
}
</script>
