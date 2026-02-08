<template lang="pug">
.HistoryPanel.panel
  ScrollBox(ref="scrollBox" @bottom="onScrollBottom")
    .history-groups(v-if="!isHidden")
      .group(
        v-for="(day, i) of History.reactive.days"
        :key="day.title"
        :data-folded="!History.reactive.expandedHistoryDays[i] && !isFiltering")
        SubListTitle(
          :title="day.title"
          :len="day.visits.length"
          :expanded="!!History.reactive.expandedHistoryDays[i] || isFiltering"
          @click="toggleHistoryGroup($event, i)")
        .group-list(v-if="!!History.reactive.expandedHistoryDays[i] || isFiltering")
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
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import type { ScrollBoxComponent } from 'src/types'
import { SubPanelType } from 'src/enums'
import * as History from 'src/services/history.fg'
import * as Search from 'src/services/search.fg'
import * as Permissions from 'src/services/permissions.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import ScrollBox from 'src/components/scroll-box.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import HistoryItemVue from './history-item.vue'
import SubListTitle from './sub-list-title.vue'
import * as Logs from 'src/services/logs'

const props = defineProps<{ isSubPanel?: boolean }>()

const scrollBox = ref<ScrollBoxComponent | null>(null)
const state = reactive({
  historyLoading: false,
  allLoaded: false,
})

onMounted(() => {
  if (scrollBox.value) {
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.History) {
      History.setSubPanelScrollEl(scrollBox.value.getScrollBox())
    } else {
      History.setPanelScrollEl(scrollBox.value.getScrollBox())
    }
  }

  if (props.isSubPanel && History.ready) {
    const spId = `${Sidebar.activePanelId}history`
    const sbEl = scrollBox.value?.getScrollBox() ?? undefined
    const prevScrollPosition = Sidebar.scrollPositions[spId]
    if (sbEl && prevScrollPosition) sbEl.scrollTop = prevScrollPosition
  }
})

onBeforeUnmount(() => {
  if (props.isSubPanel) {
    const spId = `${Sidebar.activePanelId}history`
    const sbEl = scrollBox.value?.getScrollBox()
    if (sbEl?.scrollTop !== undefined) {
      Sidebar.scrollPositions[spId] = sbEl.scrollTop
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

const isFiltering = computed<boolean>(() => Search.reactive.active && !History.reactive.loading)

function toggleHistoryGroup(e: MouseEvent, index: number): void {
  if (e.altKey) {
    const value = !History.reactive.expandedHistoryDays[index]
    for (let i = 0; i < History.reactive.days.length; i++) {
      History.reactive.expandedHistoryDays[i] = value
    }
  } else {
    History.reactive.expandedHistoryDays[index] = !History.reactive.expandedHistoryDays[index]
  }
}

async function onScrollBottom(): Promise<void> {
  if (state.historyLoading) return
  if (History.allLoaded) {
    state.allLoaded = true
    return
  }
  if (!History.ready) return

  const contentBoxEl = scrollBox.value?.getScrollableBox()
  const contentHeight = contentBoxEl?.offsetHeight

  state.historyLoading = true
  await Utils.sleep(250)
  await History.loadMore()
  state.historyLoading = false

  // If the scroll height has not changed, scroll up a little bit
  // to trigger the next "onScrollBottom" event.
  if (contentHeight) {
    const newContentHeight = contentBoxEl?.offsetHeight
    if (newContentHeight === contentHeight) {
      const scrollBoxEl = scrollBox.value?.getScrollBox()
      if (scrollBoxEl) {
        scrollBoxEl.scrollTop = scrollBoxEl.scrollTop - 1
      }
    }
  }

  if (History.allLoaded) state.allLoaded = true
}
</script>
