<template lang="pug">
.SubPanel(
  :data-active="Sidebar.reactive.subPanelActive"
  :data-search-active="Search.reactive.barIsActive"
  @wheel.stop=""
  @mousedown.stop=""
  @mouseup.stop="onMouseUp"
  @dblclick.stop="")
  .overlay(
    data-dnd-type="tab"
    @dragenter="onDragEnter"
    @click="Sidebar.closeSubPanel"
    @drop="onDrop")
  .sub-panel
    .header
      .title {{titles[Sidebar.reactive.subPanelType]}}
    ClosedTabsSubPanel(v-if="isRecentlyClosedTabs")
    BookmarksSubPanel(v-else-if="isBookmarks && Sidebar.subPanels.bookmarks" :bookmarksPanel="Sidebar.subPanels.bookmarks")
    HistoryPanel(v-else-if="isHistory")
</template>

<script lang="ts" setup>
import { MenuType, SubPanelType, DropType } from 'src/types'
import { computed } from 'vue'
import { translate } from 'src/dict'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { DnD } from 'src/services/drag-and-drop'
import { Search } from 'src/services/search'
import { Sidebar } from 'src/services/sidebar'
import ClosedTabsSubPanel from './sub-panel.closed-tabs.vue'
import BookmarksSubPanel from './sub-panel.bookmarks.vue'
import HistoryPanel from './panel.history.vue'

const titles: Record<SubPanelType, string> = {
  [SubPanelType.Null]: '',
  [SubPanelType.RecentlyClosedTabs]: translate('sub_panel.rct_panel.title'),
  [SubPanelType.Bookmarks]: translate('sub_panel.bookmarks_panel.title'),
  [SubPanelType.History]: translate('sub_panel.history_panel.title'),
}

const isRecentlyClosedTabs = computed<boolean>(() => {
  return Sidebar.reactive.subPanelType === SubPanelType.RecentlyClosedTabs
})
const isBookmarks = computed<boolean>(() => {
  return Sidebar.reactive.subPanelType === SubPanelType.Bookmarks
})
const isHistory = computed<boolean>(() => Sidebar.reactive.subPanelType === SubPanelType.History)

function onDrop(): void {
  DnD.reactive.dstType = DropType.Tabs
}

function onDragEnter(): void {
  Sidebar.closeSubPanel()
}

function onMouseUp(e: MouseEvent): void {
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()

  const panel = Sidebar.subPanelHost

  if (e.button === 2 && !Settings.state.ctxMenuNative && panel) {
    Selection.selectNavItem(panel.id)
    Menu.open(MenuType.TabsPanel, e.clientX, e.clientY)
  }
}
</script>
