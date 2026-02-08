<template lang="pug">
.SubPanel(
  :data-active="Sidebar.reactive.subPanelActive"
  @wheel.stop=""
  @mousedown.stop=""
  @mouseup.stop="onMouseUp"
  @dblclick.stop="")
  .overlay(
    data-dnd-type="tab"
    @dragenter="onDragEnter"
    @click="onOverlayClick"
    @drop="onDrop")
  .sub-panel
    .header
      .header-btn(v-if="isSync" @click="Sync.reload")
        svg.icon.-sync(): use(href="#icon_sync")
      .title {{titles[Sidebar.reactive.subPanelType]}}
      .space-filler(v-if="isSync")
    ClosedTabsSubPanel(v-if="isRecentlyClosedTabs")
    BookmarksSubPanel(v-else-if="isBookmarks && Sidebar.subPanels.bookmarks" :bookmarksPanel="Sidebar.subPanels.bookmarks")
    HistoryPanel(v-else-if="isHistory" :isSubPanel="true")
    SyncPanel(v-else-if="isSync" :isSubPanel="true")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { SubPanelType, DropType } from 'src/enums'
import { translate } from 'src/dict'
import * as Menu from 'src/services/menu.fg'
import * as Selection from 'src/services/selection.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Search from 'src/services/search.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Sync from 'src/services/sync.fg'
import ClosedTabsSubPanel from './sub-panel.closed-tabs.vue'
import BookmarksSubPanel from './sub-panel.bookmarks.vue'
import HistoryPanel from './panel.history.vue'
import SyncPanel from './panel.sync.vue'

const titles: Record<SubPanelType, string> = {
  [SubPanelType.Null]: '',
  [SubPanelType.RecentlyClosedTabs]: translate('sub_panel.rct_panel.title'),
  [SubPanelType.Bookmarks]: translate('sub_panel.bookmarks_panel.title'),
  [SubPanelType.History]: translate('sub_panel.history_panel.title'),
  [SubPanelType.Sync]: 'Sync',
}

const isRecentlyClosedTabs = computed<boolean>(() => {
  return Sidebar.reactive.subPanelType === SubPanelType.RecentlyClosedTabs
})
const isBookmarks = computed<boolean>(() => {
  return Sidebar.reactive.subPanelType === SubPanelType.Bookmarks
})
const isHistory = computed<boolean>(() => Sidebar.reactive.subPanelType === SubPanelType.History)
const isSync = computed<boolean>(() => Sidebar.reactive.subPanelType === SubPanelType.Sync)

function onDrop(): void {
  DnD.reactive.dstType = DropType.Tabs
}

function onDragEnter(): void {
  if (Search.active) Search.stop()
  Sidebar.closeSubPanel()
}

function onOverlayClick() {
  if (Search.active) Search.stop()
  Sidebar.closeSubPanel()
}

function onMouseUp(e: MouseEvent): void {
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()
}
</script>
