<template lang="pug">
.SubPanel(
  :data-active="state.active"
  @wheel.stop=""
  @mousedown.stop=""
  @mouseup.stop="onMouseUp"
  @dblclick.stop=""
  @mouseleave="onMouseLeave"
  @mouseenter="onMouseEnter")
  .overlay(
    data-dnd-type="tab"
    @dragenter="onDragEnter"
    @click="closeSubPanel"
    @drop="onDrop")
  .sub-panel
    .header
      .title {{titles[state.type]}}
    ClosedTabsSubPanel(v-if="state.panel && isRecentlyClosedTabs" :panel="state.panel")
    BookmarksSubPanel(v-else-if="state.panel && isBookmarks" :panel="state.panel")
</template>

<script lang="ts" setup>
import { MenuType, TabsPanel, SubPanelComponent, SubPanelType, DropType } from 'src/types'
import { reactive, computed } from 'vue'
import { translate } from 'src/dict'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { DnD } from 'src/services/drag-and-drop'
import ClosedTabsSubPanel from './sub-panel.closed-tabs.vue'
import BookmarksSubPanel from './sub-panel.bookmarks.vue'

const state = reactive({
  type: SubPanelType.Null,
  active: false,
  panel: null as TabsPanel | null,
})
const titles: Record<SubPanelType, string> = {
  [SubPanelType.Null]: '',
  [SubPanelType.RecentlyClosedTabs]: translate('sub_panel.rct_panel.title'),
  [SubPanelType.Bookmarks]: translate('sub_panel.bookmarks_panel.title'),
}

const CLOSE_ON_LEAVE_TIMEOUT = 300

const isRecentlyClosedTabs = computed<boolean>(() => {
  return state.type === SubPanelType.RecentlyClosedTabs
})
const isBookmarks = computed<boolean>(() => {
  return state.type === SubPanelType.Bookmarks
})

let closeTimeout: number | undefined
function closeSubPanel(): void {
  state.active = false
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()
  clearTimeout(onMouseLeaveTimeout)

  clearTimeout(closeTimeout)
  closeTimeout = setTimeout(() => {
    state.type = SubPanelType.Null
  }, 500)
}

function open(type: SubPanelType, panel: TabsPanel) {
  clearTimeout(closeTimeout)

  state.type = type
  state.panel = panel
  state.active = !state.active

  if (!state.active) {
    if (Selection.isSet()) Selection.resetSelection()
  }

  if (Menu.isOpen) Menu.close()
}

function onDrop(): void {
  DnD.reactive.dstType = DropType.Tabs
}

function onDragEnter(): void {
  closeSubPanel()
}

function onMouseUp(e: MouseEvent): void {
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()

  if (e.button === 2 && !Settings.state.ctxMenuNative && state.panel) {
    Selection.selectNavItem(state.panel.id)
    Menu.open(MenuType.TabsPanel, e.clientX, e.clientY)
  }
}

let onMouseLeaveTimeout: number | undefined
function onMouseLeave(): void {
  if (Menu.isOpen) return
  if (DnD.items.length) return

  clearTimeout(onMouseLeaveTimeout)
  onMouseLeaveTimeout = setTimeout(() => {
    closeSubPanel()
  }, CLOSE_ON_LEAVE_TIMEOUT)
}

function onMouseEnter(): void {
  clearTimeout(onMouseLeaveTimeout)
}

const publicInterface: SubPanelComponent = {
  open,
  close: closeSubPanel,
}
defineExpose(publicInterface)
</script>
