<template lang="pug">
//- Panel
.nav-item(
  v-if="Utils.isNavPanel(item)"
  draggable="true"
  data-class="panel"
  :data-loading="item.loading"
  :data-updated="isUpdated"
  :data-active="Sidebar.reactive.activePanelId === props.item.id"
  :data-index="inlineIndex"
  :data-color="item.color"
  :data-type="NavItemTypeNames[item.type] ?? item.type"
  :data-sel="item.id === Sidebar.reactive.selectedNavId"
  :data-unloaded="item.ready === false"
  :data-empty="isEmpty(item)"
  :data-audible="audioState === AudioState.Audible"
  :data-paused="audioState === AudioState.Paused"
  :data-muted="audioState === AudioState.Muted"
  :data-drop-mode="dropPointerMode(item.id)"
  :title="item.tooltip || item.name"
  @dragstart="emit('dragstart', $event)"
  @drop="emit('drop', $event)"
  @mousedown.stop="emit('mousedown', $event)"
  @mouseup.stop="emit('mouseup', $event)"
  @contextmenu.stop="emit('contextmenu', $event)")
  .dnd-layer(:data-dnd-type="dndType" :data-dnd-id="item.id")
  svg.bookmarks-badge-icon(v-if="bookmarksBadge")
    use(xlink:href="#icon_bookmarks_badge")
  img.icon(v-if="!!item.iconIMG" :src="item.iconIMG")
  svg.icon(v-else-if="item.iconSVG"): use(:xlink:href="'#' + item.iconSVG")
  .badge
  Transition(name="nav-badge")
    .audio(v-if="audioState !== AudioState.Silent" @mousedown="onAudioMouseDown")
      svg.-audible: use(xlink:href="#icon_loud_badge")
      svg.-paused: use(xlink:href="#icon_pause_12")
      svg.-muted: use(xlink:href="#icon_mute_badge")
  .name-box: .name {{item.name}}
  .progress-spinner
  .len(v-if="Settings.state.navBtnCount && (item.filteredLen ?? item.len)") {{item.filteredLen ?? item.len}}
//- Button
.nav-item(
  v-else-if="Utils.isNavBtn(item)"
  draggable="true"
  data-class="btn"
  :id="item.id as string"
  :data-index="inlineIndex"
  :data-type="NavItemTypeNames[item.type] ?? item.type"
  :data-sel="item.id === Sidebar.reactive.selectedNavId"
  :data-drop-mode="dropPointerMode(item.id)"
  :title="item.tooltip || item.name"
  @dragstart="emit('dragstart', $event)"
  @drop="emit('drop', $event)"
  @mousedown.stop="emit('mousedown', $event)"
  @mouseup.stop="emit('mouseup', $event)"
  @contextmenu.stop="emit('contextmenu', $event)")
  .dnd-layer(:data-dnd-type="dndType" :data-dnd-id="item.id")
  img.icon(v-if="!!item.iconIMG" :src="item.iconIMG")
  svg.icon(v-else-if="item.iconSVG"): use(:xlink:href="'#' + item.iconSVG")
  .name-box: .name {{item.name}}
//- Space
.nav-item(
  v-else-if="Utils.isNavSpace(item)"
  draggable="true"
  data-class="space"
  :data-index="inlineIndex"
  :data-type="NavItemTypeNames[item.type] ?? item.type"
  :data-sel="item.id === Sidebar.reactive.selectedNavId"
  :data-drop-mode="dropPointerMode(item.id)"
  @dragstart="emit('dragstart', $event)"
  @drop="emit('drop', $event)"
  @mousedown="emit('mousedown', $event)"
  @mouseup="emit('mouseup', $event)"
  @contextmenu="emit('contextmenu', $event)")
  .dnd-layer(:data-dnd-type="dndType" :data-dnd-id="item.id")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import * as Utils from 'src/utils'
import { NavItem, PanelType, DropType, ReactiveTab } from 'src/types'
import { NavItemTypeNames, DragType, Panel } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { DnD } from 'src/services/drag-and-drop'
import { Settings } from 'src/services/settings'
import { Tabs } from 'src/services/tabs.fg'

const emit = defineEmits(['dragstart', 'drop', 'mousedown', 'mouseup', 'contextmenu'])

const props = defineProps<{ item: NavItem; dndType: string; inlineIndex?: number }>()

const isUpdated = computed<boolean>(() => {
  if (Utils.isNavPanel(props.item) && Utils.isTabsPanel(props.item)) {
    return Sidebar.reactive.activePanelId !== props.item.id && !!props.item.updatedTabs?.length
  }
  return false
})

const enum AudioState {
  Muted = -1,
  Silent = 0,
  Audible = 1,
  Paused = 2,
}

const bookmarksBadge = computed<boolean>(() => {
  const isBookmarksPanel = props.item.type === PanelType.bookmarks
  return isBookmarksPanel && (props.item.iconSVG !== 'icon_bookmarks' || !!props.item.iconIMG)
})

const audioState = computed<AudioState>(() => {
  if (!Utils.isNavPanel(props.item)) return AudioState.Silent
  if (!Utils.isTabsPanel(props.item)) return AudioState.Silent

  const panel = props.item

  let hasPaused = false
  let hasMuted = false

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const t of panel.pinnedTabs) {
      if (t.mediaAudible && !t.mediaMuted && !t.mediaPaused) return AudioState.Audible
      if (t.mediaPaused) hasPaused = true
      if (t.mediaMuted) hasMuted = true
    }
  }

  if (panel.ready && panel.tabs.length) {
    for (let t of panel.tabs) {
      if (t.mediaAudible && !t.mediaMuted && !t.mediaPaused) return AudioState.Audible
      if (t.mediaPaused) hasPaused = true
      if (t.mediaMuted) hasMuted = true
    }
  }

  if (hasPaused) return AudioState.Paused
  if (hasMuted) return AudioState.Muted

  return AudioState.Silent
})

function isEmpty(panel: Panel): boolean {
  if (Utils.isTabsPanel(panel) && panel.ready && panel.tabs.length) {
    return panel.tabs.every(t => t.discarded)
  }
  return false
}

function dropPointerMode(id: ID): string {
  if (id === DnD.items[0]?.id) return 'none'

  const srcIsNavItem =
    DnD.srcType === DragType.TabsPanel ||
    DnD.srcType === DragType.BookmarksPanel ||
    DnD.srcType === DragType.NavItem
  const dstIsNavItem =
    DnD.reactive.dstType === DropType.TabsPanel ||
    DnD.reactive.dstType === DropType.BookmarksPanel ||
    DnD.reactive.dstType === DropType.NavItem
  const dstId = Sidebar.reactive.nav[DnD.reactive.dstIndex]
  if (dstIsNavItem && dstId === id) {
    if (srcIsNavItem) {
      if (DnD.srcIndex !== -1 && DnD.reactive.dstIndex !== -1) {
        if (DnD.reactive.dstIndex < DnD.srcIndex) return 'before'
        if (DnD.reactive.dstIndex === DnD.srcIndex) return 'none'
        if (DnD.reactive.dstIndex > DnD.srcIndex) return 'after'
      }
      return 'before'
    } else {
      if (DnD.reactive.dstType !== DropType.NavItem || id === 'add_tp') return 'in'
    }
  }
  return 'none'
}

function muteTabs(): void {
  if (!Utils.isNavPanel(props.item)) return
  if (!Utils.isTabsPanel(props.item)) return

  Tabs.muteAudibleTabsOfPanel(props.item.id)
}

function unmuteTabs(): void {
  if (!Utils.isNavPanel(props.item)) return
  if (!Utils.isTabsPanel(props.item)) return

  Tabs.unmuteAudibleTabsOfPanel(props.item.id)
}

function pauseMedia(): void {
  if (!Utils.isNavPanel(props.item)) return
  if (!Utils.isTabsPanel(props.item)) return

  Tabs.pauseTabsMediaOfPanel(props.item.id)
}

function playMedia(): void {
  if (!Utils.isNavPanel(props.item)) return
  if (!Utils.isTabsPanel(props.item)) return

  Tabs.playTabsMediaOfPanel(props.item.id)
}

function activateAudibleTab(): void {
  if (!Utils.isNavPanel(props.item)) return
  if (!Utils.isTabsPanel(props.item)) return

  let audibleTab: ReactiveTab | undefined
  if (Settings.state.pinnedTabsPosition === 'panel') {
    audibleTab = props.item.pinnedTabs.find(t => t.mediaAudible)
  }
  if (!audibleTab) audibleTab = props.item.tabs.find(t => t.mediaAudible)
  if (!audibleTab) return

  const history = Tabs.getActiveTabsHistory()
  const prevTabId = history.actTabs[history.actTabs.length - 1]

  if (audibleTab.id !== Tabs.activeId) {
    browser.tabs.update(audibleTab.id, { active: true })
  } else if (prevTabId) {
    browser.tabs.update(prevTabId, { active: true })
  }
}

function onAudioMouseDown(e: MouseEvent): void {
  e.stopPropagation()

  if (audioState.value === AudioState.Audible) {
    if (e.button === 0) muteTabs()
    else if (e.button === 1) pauseMedia()
    else if (e.button === 2) activateAudibleTab()
  } else if (audioState.value === AudioState.Muted) {
    unmuteTabs()
  } else if (audioState.value === AudioState.Paused) {
    if (e.button === 0) playMedia()
    else if (e.button === 1) Tabs.resetPausedMediaState(props.item.id)
  }
}
</script>
