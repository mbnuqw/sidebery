<template lang="pug">
.HistoryPanel.panel
  ScrollBox(ref="scrollBox" @bottom="onScrollBottom")
    .history-groups(ref="groupsListEl" v-if="!isHidden")
      .group(
        v-for="(group, i) of historyList"
        :key="group.title"
        :data-folded="!state.expandedHistoryGroups[i] && !isFiltering")
        SubListTitle(
          :title="group.title"
          :len="group.items.length"
          :expanded="!!state.expandedHistoryGroups[i] || isFiltering"
          @click="toggleHistoryGroup($event, i)")
        .group-list(v-if="!!state.expandedHistoryGroups[i] || isFiltering")
          HistoryItemVue(v-for="item in group.items" :key="item.lastVisitTime" :item="item")
      .controls(:data-loading="state.historyLoading" :data-all-loaded="state.allLoaded")
        .note(@click="onScrollBottom") {{translate('panel.history.load_more')}}

      LoadingDots(v-if="state.historyLoading")

  PanelPlaceholder(
    :isLoading="!History.reactive.ready"
    :isNotPerm="!Permissions.reactive.history"
    :permMsg="translate('panel.history.req_perm')"
    perm="history"
    :isMsg="!historyList.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onUpdated, onMounted } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { HistoryItem, ScrollBoxComponent, SubPanelType } from 'src/types'
import { Favicons } from 'src/services/favicons'
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

interface HistoryGroup {
  title: string
  items: HistoryItem[]
}

const props = defineProps<{ isSubPanel?: boolean }>()

const scrollBox = ref<ScrollBoxComponent | null>(null)
const groupsPositions: number[] = []
const groupsListEl = ref<HTMLElement | null>(null)
onUpdated(() => {
  if (!groupsListEl.value) return
  const len = groupsListEl.value.children.length
  for (let el: HTMLElement, i = 0; i < len; i++) {
    el = groupsListEl.value.children[i] as HTMLElement
    groupsPositions[i] = el.offsetTop
  }
})
const state = reactive({
  expandedHistoryGroups: [true],
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

const historyList = computed((): HistoryGroup[] => {
  const groups: HistoryGroup[] = []
  const dayStart = Utils.getDayStartMS()
  let group: HistoryGroup | undefined
  let lastGroupTitle = ''

  const list = History.reactive.filtered ?? History.reactive.list

  for (const item of list) {
    const itemPreview: HistoryItem = Utils.cloneObject(item)
    const gTitle = getGroupTitle(itemPreview.lastVisitTime, dayStart)

    if (lastGroupTitle !== gTitle || !group) {
      lastGroupTitle = gTitle
      group = { title: gTitle, items: [] }
      groups.push(group)
    }

    if (itemPreview.url) {
      try {
        itemPreview.info = decodeURI(itemPreview.url)
      } catch (err) {
        Logs.warn('History panel: Cannot decodeURI:', itemPreview.url)
        itemPreview.info = itemPreview.url
      }
      const domain = Utils.getDomainOf(itemPreview.url)
      itemPreview.favicon = Favicons.reactive.list[Favicons.reactive.domains[domain]]

      if (!itemPreview.title) {
        const prevItem = group.items[group.items.length - 1]
        if (prevItem) {
          prevItem.info += `\n  ${itemPreview.info}`
          prevItem.tooltip += `\n  ${itemPreview.info}`
        }
        continue
      }
    }

    itemPreview.timeStr = getItemTime(itemPreview.lastVisitTime)

    itemPreview.tooltip = ''
    if (itemPreview.title) itemPreview.tooltip += itemPreview.title
    if (itemPreview.tooltip) itemPreview.tooltip += '\n'
    if (itemPreview.info) itemPreview.tooltip += itemPreview.info

    group.items.push(itemPreview)
  }

  return groups
})

function getItemTime(time?: number): string {
  if (!time) return '??:??'
  const dt = new Date(time)
  const h = dt.getHours().toString()
  const m = dt.getMinutes().toString()
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

function getGroupTitle(time?: number, dayStartTime?: number): string {
  if (time === undefined) return '???'
  if (!dayStartTime) dayStartTime = Utils.getDayStartMS()
  return Utils.uDate(time, '.', dayStartTime)
}

function toggleHistoryGroup(e: MouseEvent, index: number): void {
  if (e.altKey) {
    const value = !state.expandedHistoryGroups[index]
    for (let i = 0; i < historyList.value.length; i++) {
      state.expandedHistoryGroups[i] = value
    }
  } else {
    state.expandedHistoryGroups[index] = !state.expandedHistoryGroups[index]
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
