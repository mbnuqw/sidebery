<template lang="pug">
.DownloadsPanel.panel
  ScrollBox
    .group(v-for="(group, i) in list" :key="group.title")
      SubListTitle(
        :title="group.title"
        :len="group.items.length"
        :expanded="!!state.expandedGroups[i] || isFiltering"
        @click="toggleGroup(i)")
      .group-list(v-if="!!state.expandedGroups[i] || isFiltering")
        DownloadCard(v-for="download in group.items" :key="download.id" :info="download")

  PanelPlaceholder(
    :isLoading="!panel?.ready"
    :isNotPerm="!Permissions.reactive.downloads"
    :permMsg="translate('panel.downloads.req_perm')"
    perm="downloads"
    :isMsg="!list.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { reactive, computed } from 'vue'
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { DownloadItem } from 'src/types'
import { Downloads } from 'src/services/downloads'
import { Sidebar } from 'src/services/sidebar'
import { Permissions } from 'src/services/permissions'
import ScrollBox from './scroll-box.vue'
import DownloadCard from './download-card.vue'
import SubListTitle from './sub-list-title.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import { Search } from 'src/services/search'

interface DownloadsGroup {
  title: string
  items: DownloadItem[]
}

const state = reactive({ expandedGroups: [true, true] })
const panel = Sidebar.reactive.panelsById.downloads
const isFiltering = computed<boolean>(() => !!Search.reactive.value)
const list = computed<DownloadsGroup[]>(() => {
  const downloadsList: DownloadsGroup[] = []
  const dayStartTime = Utils.getDayStartMS()

  let lastGTitle = ''
  let group: DownloadsGroup | undefined

  for (const item of Downloads.reactive.filtered || Downloads.reactive.list) {
    const gTitle = getGroupTitle(item, dayStartTime)
    if (lastGTitle !== gTitle) {
      group = { title: gTitle, items: [] }
      downloadsList.push(group)
      lastGTitle = gTitle
    }
    if (group) group.items.push(item)
  }

  return downloadsList
})

function getGroupTitle(item: DownloadItem, dayStartTime?: number): string {
  const time = item.endMS ?? item.startMS
  if (time === undefined) return '???'

  if (!dayStartTime) dayStartTime = Utils.getDayStartMS()
  return Utils.uDate(time, '.', dayStartTime)
}

function toggleGroup(index: number): void {
  state.expandedGroups[index] = !state.expandedGroups[index]
}
</script>
