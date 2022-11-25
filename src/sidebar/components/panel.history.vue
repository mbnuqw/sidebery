<template lang="pug">
.HistoryPanel.panel
  ScrollBox(ref="scrollBox" @bottom="onScrollBottom")
    .history-groups(ref="groupsListEl")
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
    :isLoading="!panel?.ready"
    :isNotPerm="!Permissions.reactive.history"
    :permMsg="translate('panel.history.req_perm')"
    perm="history"
    :isMsg="!historyList.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onUpdated } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { ScrollBoxComponent, HistoryItem } from 'src/types'
import { Favicons } from 'src/services/favicons'
import { History } from 'src/services/history'
import { Sidebar } from 'src/services/sidebar'
import { Search } from 'src/services/search'
import { Permissions } from 'src/services/permissions'
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
const scrollBox = ref<ScrollBoxComponent | null>(null)
const state = reactive({
  expandedHistoryGroups: [true],
  historyLoading: false,
  allLoaded: false,
})

const panel = Sidebar.reactive.panelsById.history

const isFiltering = computed<boolean>(() => !!Search.reactive.value)

const historyList = computed((): HistoryGroup[] => {
  const groups: HistoryGroup[] = []
  const dayStart = Utils.getDayStartMS()
  let group: HistoryGroup | undefined
  let lastGroupTitle = ''

  const list = History.reactive.filtered ?? History.reactive.list

  for (const item of list) {
    const gTitle = getGroupTitle(item.lastVisitTime, dayStart)

    if (lastGroupTitle !== gTitle || !group) {
      lastGroupTitle = gTitle
      group = { title: gTitle, items: [] }
      groups.push(group)
    }

    if (item.url) {
      try {
        item.info = decodeURI(item.url)
      } catch (err) {
        Logs.warn('History panel: Cannot decodeURI:', item.url)
        item.info = item.url
      }
      const domain = Utils.getDomainOf(item.url)
      item.favicon = Favicons.reactive.list[Favicons.reactive.domains[domain]]

      if (!item.title) {
        const prevItem = group.items[group.items.length - 1]
        if (prevItem) {
          prevItem.info += `\n  ${item.info}`
          prevItem.tooltip += `\n  ${item.info}`
        }
        continue
      }
    }

    item.timeStr = getItemTime(item.lastVisitTime)

    item.tooltip = ''
    if (item.title) item.tooltip += item.title
    if (item.tooltip) item.tooltip += '\n'
    if (item.info) item.tooltip += item.info

    group.items.push(item)
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

function getCurrentTime(): string {
  const dt = new Date()
  const h = dt.getHours().toString().padStart(2, '0')
  const m = dt.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function getGroupTitle(time?: number, dayStartTime?: number): string {
  if (time === undefined) return '???'
  const dt = new Date(time)

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
  if (!panel.ready || Sidebar.reactive.activePanelId !== panel.id) return

  state.historyLoading = true
  await Utils.sleep(250)
  await History.loadMore()
  state.historyLoading = false

  if (History.allLoaded) state.allLoaded = true
}
</script>
