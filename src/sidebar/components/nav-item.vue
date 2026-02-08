<template lang="pug">
//- Tabs Panel
.nav-item(
  v-if="Utils.isTabsPanel(item)"
  draggable="true"
  data-class="panel"
  data-type="tabs"
  :id="'nav' + item.id"
  :data-updated="isUpdated"
  :data-active="Sidebar.reactive.activePanelId === props.item.id"
  :data-index="inlineIndex"
  :data-color="item.reactive.color"
  :data-sel="item.id === Sidebar.reactive.selectedNavId"
  :data-empty="item.reactive.allDiscarded"
  :data-audible="item.reactive.mediaState === E.MediaState.Audible"
  :data-paused="item.reactive.mediaState === E.MediaState.Paused"
  :data-muted="item.reactive.mediaState === E.MediaState.Muted"
  :data-drop-mode="dropPointerMode(item.id)"
  :title="item.reactive.tooltip || item.reactive.name"
  @dragstart="emit('dragstart', $event)"
  @drop="emit('drop', $event)"
  @mousedown.stop="emit('mousedown', $event)"
  @mouseup.stop="emit('mouseup', $event)"
  @contextmenu.stop="emit('contextmenu', $event)")
  .dnd-layer(:data-dnd-type="dndType" :data-dnd-id="item.id")
  img.icon(v-if="!!item.reactive.iconIMG" :src="item.reactive.iconIMG")
  svg.icon(v-else-if="item.reactive.iconSVG"): use(:href="'#' + item.reactive.iconSVG")
  .badge
  .audio(
    v-if="item.reactive.mediaState !== E.MediaState.Silent"
    @mousedown="onAudioMouseDown($event, item)"
    @mouseup.stop)
    svg.-audible: use(href="#icon_loud_badge")
    svg.-paused: use(href="#icon_pause_12")
    svg.-muted: use(href="#icon_mute_badge")
  .name-box: .name {{item.reactive.name}}
  .len(v-if="Settings.state.navBtnCount && (item.reactive.filteredLen ?? item.reactive.len)") {{item.reactive.filteredLen ?? item.reactive.len}}
//- Bookmarks/History/SyncPanel
.nav-item(
  v-else-if="Utils.isNavPanel(item)"
  draggable="true"
  data-class="panel"
  :id="'nav' + item.id"
  :data-active="Sidebar.reactive.activePanelId === props.item.id"
  :data-index="inlineIndex"
  :data-color="item.reactive.color"
  :data-type="NavItemTypeNames[item.type] ?? item.type"
  :data-sel="item.id === Sidebar.reactive.selectedNavId"
  :data-unloaded="item.reactive.ready === false"
  :data-drop-mode="dropPointerMode(item.id)"
  :title="item.reactive.tooltip || item.reactive.name"
  @dragstart="emit('dragstart', $event)"
  @drop="emit('drop', $event)"
  @mousedown.stop="emit('mousedown', $event)"
  @mouseup.stop="emit('mouseup', $event)"
  @contextmenu.stop="emit('contextmenu', $event)")
  .dnd-layer(:data-dnd-type="dndType" :data-dnd-id="item.id")
  svg.bookmarks-badge-icon(v-if="bookmarksBadge")
    use(href="#icon_bookmarks_badge")
  img.icon(v-if="!!item.reactive.iconIMG" :src="item.reactive.iconIMG")
  svg.icon(v-else-if="item.reactive.iconSVG"): use(:href="'#' + item.reactive.iconSVG")
  .badge
  .name-box: .name {{item.reactive.name}}
  .len(v-if="Settings.state.navBtnCount && (item.reactive.filteredLen ?? item.reactive.len)") {{item.reactive.filteredLen ?? item.reactive.len}}
//- Button
.nav-item(
  v-else-if="Utils.isNavBtn(item)"
  draggable="true"
  data-class="btn"
  :id="item.id as string"
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
  svg.icon(v-else-if="item.iconSVG"): use(:href="'#' + item.iconSVG")
  .name-box: .name {{item.name}}
//- Space
.nav-item(
  v-else-if="Utils.isNavSpace(item)"
  draggable="true"
  data-class="space"
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
import type { NavItem, Tab, TabsPanel } from 'src/types'
import * as E from 'src/enums'
import * as Sidebar from 'src/services/sidebar.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'

const NavItemTypeNames = {
  [E.PanelType.bookmarks]: 'bookmarks',
  [E.PanelType.tabs]: 'tabs',
  [E.PanelType.history]: 'history',
  [E.PanelType.sync]: 'sync',
  [E.ButtonType.settings]: 'settings',
  [E.ButtonType.add_tp]: 'add_tp',
  [E.ButtonType.search]: 'search',
  [E.ButtonType.hidden]: 'hidden',
  [E.ButtonType.create_snapshot]: 'create_snapshot',
  [E.ButtonType.remute_audio_tabs]: 'remute_audio_tabs',
  [E.ButtonType.collapse]: 'collapse',
  [E.SpaceType.dynamic]: 'dynamic',
  [E.SpaceType.static]: 'static',
}

const emit = defineEmits(['dragstart', 'drop', 'mousedown', 'mouseup', 'contextmenu'])

const props = defineProps<{ item: NavItem; dndType: string; inlineIndex?: number }>()

const bookmarksBadge =
  props.item.type === E.PanelType.bookmarks &&
  (props.item.iconSVG !== 'icon_bookmarks' || !!props.item.iconIMG)

const isUpdated = computed<boolean>(() => {
  if (Utils.isTabsPanel(props.item)) {
    return Sidebar.reactive.activePanelId !== props.item.id && props.item.reactive.updated
  }
  return false
})

function dropPointerMode(id: ID): string {
  if (id === DnD.items[0]?.id) return 'none'

  const srcIsNavItem =
    DnD.srcType === E.DragType.TabsPanel ||
    DnD.srcType === E.DragType.BookmarksPanel ||
    DnD.srcType === E.DragType.NavItem
  const dstIsNavItem =
    DnD.reactive.dstType === E.DropType.TabsPanel ||
    DnD.reactive.dstType === E.DropType.BookmarksPanel ||
    DnD.reactive.dstType === E.DropType.SyncPanel ||
    DnD.reactive.dstType === E.DropType.NavItem
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
      if (DnD.reactive.dstType !== E.DropType.NavItem || id === 'add_tp') return 'in'
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

  let mediaTab: Tab | undefined
  const findMedia = (t: Tab) => t.audible || t.mutedInfo?.muted || t.mediaPaused
  if (Settings.state.pinnedTabsPosition === 'panel') {
    mediaTab = props.item.pinnedTabs.find(findMedia)
  }
  if (!mediaTab) mediaTab = props.item.tabs.find(findMedia)
  if (!mediaTab) return

  const history = Tabs.getActiveTabsHistory()
  const prevTabId = history.actTabs[history.actTabs.length - 1]

  if (mediaTab.id !== Tabs.activeId) {
    browser.tabs.update(mediaTab.id, { active: true })
  } else if (prevTabId) {
    browser.tabs.update(prevTabId, { active: true })
  }
}

function onAudioMouseDown(e: MouseEvent, panel: TabsPanel): void {
  e.stopPropagation()

  if (panel.reactive.mediaState === E.MediaState.Audible) {
    if (e.button === 0) muteTabs()
    else if (e.button === 1) pauseMedia()
    else if (e.button === 2) activateAudibleTab()
  } else if (panel.reactive.mediaState === E.MediaState.Muted) {
    if (e.button === 0) unmuteTabs()
    else if (e.button === 1) pauseMedia()
    else if (e.button === 2) activateAudibleTab()
  } else if (panel.reactive.mediaState === E.MediaState.Paused) {
    if (e.button === 0) playMedia()
    else if (e.button === 1) Tabs.resetPausedMediaState(props.item.id)
    else if (e.button === 2) activateAudibleTab()
  }
}
</script>
