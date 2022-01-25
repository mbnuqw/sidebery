<template lang="pug">
.TrashPanel
  .controls-bar
    PanelViewSwitcherBar(:panel="panel" :conf="viewModes" :off="'all'")
  ScrollBox
    .group(v-for="(group, i) in list" :key="group.title")
      SubListTitle(
        :title="group.title"
        :len="group.items.length"
        :expanded="!!state.expandedGroups[i] || isFiltering"
        @click="toggleGroup(i)")
      .group-list(v-if="!!state.expandedGroups[i] || isFiltering")
        TrashItem(v-for="item in group.items" :key="item.id" :info="item")
    PanelPlaceholder(:isMsg="!list.length" :msg="translate('panel.nothing')")
  PanelPlaceholder(:isLoading="!panel?.ready")
</template>

<script lang="ts" setup>
import { reactive, computed } from 'vue'
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { TrashPanel, RemovedItem } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { Trash } from 'src/services/trash'
import ScrollBox from './scroll-box.vue'
import PanelViewSwitcherBar from './bar.panel-view-switcher.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import TrashItem from './trash-item.vue'
import SubListTitle from './sub-list-title.vue'
import { Search } from 'src/services/search'

interface TrashGroup {
  title: string
  items: RemovedItem[]
}

const viewModes = [
  { id: 'tabs', icon: '#icon_web' },
  { id: 'bookmarks', icon: '#icon_bookmarks' },
  { id: 'windows', icon: '#icon_win' },
]

const state = reactive({ expandedGroups: [true, true] })
const panel = Sidebar.reactive.panelsById.trash as TrashPanel
const isFiltering = computed<boolean>(() => !!Search.reactive.value)
const list = computed<TrashGroup[]>(() => {
  const output: TrashGroup[] = []
  const dayStart = Utils.getDayStartMS()
  let group: TrashGroup | undefined
  let src: RemovedItem[]
  if (Trash.reactive.filtered) {
    src = Trash.reactive.filtered
  } else {
    const tabsSrc: RemovedItem[] = Trash.reactive.tabs
    const bookmarksSrc: RemovedItem[] = Trash.reactive.bookmarks
    const windowsSrc: RemovedItem[] = Trash.reactive.windows

    if (panel.viewMode === 'tabs') src = tabsSrc
    else if (panel.viewMode === 'bookmarks') src = bookmarksSrc
    else if (panel.viewMode === 'windows') src = windowsSrc
    else {
      src = tabsSrc.concat(bookmarksSrc, windowsSrc)
      src.sort((a, b) => b.time - a.time)
    }
  }

  for (const item of src) {
    const gTitle = item.time !== undefined ? Utils.uDate(item.time, '.', dayStart) : '???'
    if (group?.title !== gTitle) {
      group = { title: gTitle, items: [] }
      output.push(group)
    }
    if (group) group.items.push(item)
  }

  return output
})

function toggleGroup(index: number): void {
  state.expandedGroups[index] = !state.expandedGroups[index]
}
</script>
