<template lang="pug">
#root.root.Sidebar(
  ref="rootEl"
  :key="rrc"
  :data-native-scrollbar="Settings.state.nativeScrollbars"
  :data-native-scrollbars-thin="Settings.state.nativeScrollbarsThin"
  :data-native-scrollbars-left="Settings.state.nativeScrollbarsLeft"
  :data-theme="Settings.state.theme"
  :data-density="Settings.state.density"
  :data-frame-color-scheme="Styles.reactive.frameColorScheme"
  :data-toolbar-color-scheme="Styles.reactive.toolbarColorScheme"
  :data-act-el-color-scheme="Styles.reactive.actElColorScheme"
  :data-popup-color-scheme="Styles.reactive.popupColorScheme"
  :data-animations="animations"
  :data-pinned-tabs-position="Settings.state.pinnedTabsPosition"
  :data-pinned-tabs-list="Settings.state.pinnedTabsList"
  :data-tabs-tree-lvl-marks="Settings.state.tabsLvlDots"
  :data-tabs-close-btn="Settings.state.tabRmBtn"
  :data-drag="DnD.reactive.isStarted"
  :data-nav-inline="Settings.state.navBarInline"
  :data-nav-layout="navBarLayout"
  :data-search="Search.reactive.active"
  :data-sticky-bookmarks="Settings.state.pinOpenedBookmarksFolder"
  :data-colorized-branches="Settings.state.colorizeTabsBranches"
  :data-syncing="Sync.reactive.syncing"
  :data-new-tab-btns="Settings.state.showNewTabBtns"
  @dragend="DnD.onDragEnd"
  @dragenter="DnD.onDragEnter"
  @dragleave="DnD.onDragLeave"
  @dragover.prevent="DnD.onDragMove"
  @drop.stop.prevent="DnD.onDrop"
  @contextmenu.stop.prevent
  @mouseenter="onMouseEnter"
  @mouseleave="onMouseLeave"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mousemove.passive="Mouse.onMouseMove"
  @focusin="onFocusIn"
  @focusout="onFocusOut")

  Transition(name="popup" type="transition"): ConfirmPopup(v-if="Popups.reactive.confirm")
  Transition(name="popup" type="transition"): WindowsPopup(v-if="Windows.reactive.choosing")
  Transition(name="popup" type="transition"): BookmarksPopup(v-if="Bookmarks.reactive.popup")
  Transition(name="popup" type="transition"): PanelConfigPopup(v-if="Popups.reactive.panelConfigPopup")
  Transition(name="popup" type="transition"): ContainerConfigPopup(v-if="Popups.reactive.containerConfigPopup")
  Transition(name="popup" type="transition"): GroupConfigPopup(v-if="Popups.reactive.groupConfigPopup")
  Transition(name="popup" type="transition"): DialogPopup(v-if="Popups.reactive.dialog" :dialog="Popups.reactive.dialog")
  Transition(name="popup" type="transition"): NewTabShortcutsPopup(v-if="Popups.reactive.newTabShortcutsPopup")
  Transition(name="popup" type="transition"): SiteConfigPopup(v-if="Popups.reactive.siteConfigPopup")
  Transition(name="popup" type="transition"): ProcessingTabsPopup(v-if="Popups.reactive.processingTabsPopup")
  CtxMenuPopup
  DragAndDropTooltip
  NotificationsPopup

  .top-horizontal-box(v-if="navBarHorizontal")
    NavigationBar.-top

  SearchBar(v-if="navBarHorizontal" v-show="Settings.state.searchBarMode !== 'none'")

  .main-box
    .left-vertical-box(v-if="pinnedTabsBarLeft || navBarLeft")
      PinnedTabsBar(v-if="pinnedTabsBarLeft")
      NavigationBar.-vert(v-if="navBarLeft")

    .central-box
      PinnedTabsBar(v-if="pinnedTabsBarTop")
      SearchBar(v-if="!navBarHorizontal" v-show="Settings.state.searchBarMode !== 'none'")
      .panel-box(ref="panelBoxEl" @wheel.passive="onWheel")
        component.panel(
          v-for="(panel, i) in panels"
          :key="panel.id"
          :is="getPanelComponent(panel)"
          :data-pos="getPanelPos(i, panel.id)"
          :panel="panel")

      Transition(name="bottom-bar")
        .BottomBar(
          v-if="bottomBar && Utils.isTabsPanel(activePanel)"
          @dragover.prevent.stop=""
          :data-drop-target-bookmarks="DnD.reactive.dstType === E.DropType.BookmarksSubPanelBtn && DnD.reactive.dstPanelId === activePanel.id"
          :data-drop-target-sync="DnD.reactive.dstType === E.DropType.SyncSubPanelBtn")
          .tool-btn(
            v-if="Settings.state.subPanelRecentlyClosedBar"
            :data-disabled="!Tabs.reactive.recentlyRemovedLen"
            @click="Sidebar.openSubPanel(E.SubPanelType.RecentlyClosedTabs, activePanel)")
            svg: use(href="#icon_trash")
          .tool-btn.-bookmarks(
            v-if="Settings.state.subPanelBookmarks"
            @dragleave="onBSPBDragLeave"
            @click="Sidebar.openSubPanel(E.SubPanelType.Bookmarks, activePanel)")
            .dnd-layer(data-dnd-type="bspb")
            svg: use(href="#icon_bookmarks")
          .tool-btn(
            v-if="Settings.state.subPanelHistory"
            @click="Sidebar.openSubPanel(E.SubPanelType.History, activePanel)")
            svg: use(href="#icon_clock")
          .tool-btn.-sync(
            v-if="Settings.state.subPanelSync"
            @dragleave="onSSPBDragLeave"
            @click="Sidebar.openSubPanel(E.SubPanelType.Sync, activePanel)")
            .dnd-layer(data-dnd-type="sspb")
            svg: use(href="#icon_sync")

      SubPanel

    .right-vertical-box(v-if="pinnedTabsBarRight || navBarRight")
      PinnedTabsBar(v-if="pinnedTabsBarRight")
      NavigationBar.-vert(v-if="navBarRight")

  teleport(
    v-if="Settings.state.selLen && Sidebar.reactive.selLenBadgeTarget && Sidebar.reactive.selLen"
    :to="Sidebar.reactive.selLenBadgeTarget")
    .sel-len-teleported {{Sidebar.reactive.selLen}}
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Panel } from 'src/types'
import * as E from 'src/enums'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Styles from 'src/services/styles.fg'
import * as Selection from 'src/services/selection.fg'
import * as Menu from 'src/services/menu.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Windows from 'src/services/windows.fg'
import * as Search from 'src/services/search.fg'
import * as Sync from 'src/services/sync.fg'
import * as Info from 'src/services/info'
import * as Utils from 'src/utils'
import * as Popups from 'src/services/popups.fg'
import * as Logs from 'src/services/logs'
import * as Preview from 'src/services/tabs.fg.preview'
import ConfirmPopup from './components/popup.confirm.vue'
import CtxMenuPopup from './components/popup.context-menu.vue'
import DragAndDropTooltip from './components/dnd-tooltip.vue'
import PinnedTabsBar from './components/bar.pinned-tabs.vue'
import NotificationsPopup from './components/popup.notifications.vue'
import NavigationBar from './components/bar.navigation.vue'
import WindowsPopup from './components/popup.windows.vue'
import TabsPanel from './components/panel.tabs.vue'
import BookmarksPanel from './components/panel.bookmarks.vue'
import HistoryPanel from './components/panel.history.vue'
import SyncPanel from './components/panel.sync.vue'
import SearchBar from './components/bar.search.vue'
import BookmarksPopup from 'src/components/popup.bookmarks.vue'
import PanelConfigPopup from './components/popup.panel-config.vue'
import ContainerConfigPopup from './components/popup.container-config.vue'
import GroupConfigPopup from './components/popup.group-config.vue'
import DialogPopup from 'src/components/popup.dialog.vue'
import NewTabShortcutsPopup from '../components/popup.new-tab-shortcuts.vue'
import SiteConfigPopup from '../components/popup.site-config.vue'
import ProcessingTabsPopup from './components/popup.processing-tabs.vue'
import SubPanel from './components/sub-panel.vue'

const rootEl = ref<HTMLElement | null>(null)
const panelBoxEl = ref<HTMLElement | null>(null)
const rrc = ref(0)

let animations = !Settings.state.animations ? 'none' : Settings.state.animationSpeed || 'fast'
let pinnedTabsBarTop = Settings.state.pinnedTabsPosition === 'top'
let pinnedTabsBarLeft = Settings.state.pinnedTabsPosition === 'left'
let pinnedTabsBarRight = Settings.state.pinnedTabsPosition === 'right'
let navBarHorizontal = Settings.state.navBarLayout === 'horizontal'
let navBarVertical = Settings.state.navBarLayout === 'vertical'
let navBarLayout = navBarVertical ? Settings.state.navBarSide : Settings.state.navBarLayout
let navBarLeft = navBarVertical && Settings.state.navBarSide === 'left'
let navBarRight = navBarVertical && Settings.state.navBarSide === 'right'
let bottomBar =
  Settings.state.subPanelRecentlyClosedBar ||
  Settings.state.subPanelBookmarks ||
  Settings.state.subPanelHistory ||
  Settings.state.subPanelSync

function recalcStaticVars() {
  animations = !Settings.state.animations ? 'none' : Settings.state.animationSpeed || 'fast'
  pinnedTabsBarTop = Settings.state.pinnedTabsPosition === 'top'
  pinnedTabsBarLeft = Settings.state.pinnedTabsPosition === 'left'
  pinnedTabsBarRight = Settings.state.pinnedTabsPosition === 'right'
  navBarHorizontal = Settings.state.navBarLayout === 'horizontal'
  navBarVertical = Settings.state.navBarLayout === 'vertical'
  navBarLayout = navBarVertical ? Settings.state.navBarSide : Settings.state.navBarLayout
  navBarLeft = navBarVertical && Settings.state.navBarSide === 'left'
  navBarRight = navBarVertical && Settings.state.navBarSide === 'right'
  bottomBar =
    Settings.state.subPanelRecentlyClosedBar ||
    Settings.state.subPanelBookmarks ||
    Settings.state.subPanelHistory ||
    Settings.state.subPanelSync
}

Sidebar.setReMountSidebarFn(() => {
  Sidebar.rememberActivePanelScrollPosition()
  recalcStaticVars()
  rrc.value++
  nextTick(updSidebarEls)
})

const activePanel = computed<Panel | undefined>(() => {
  return Sidebar.panelsById[Sidebar.reactive.activePanelId]
})

const panels = computed<Panel[]>(() => {
  const output = []
  for (const id of Sidebar.reactive.nav) {
    const panel = Sidebar.panelsById[id]
    if (panel) output.push(panel)
  }
  return output
})

function updSidebarEls() {
  if (panelBoxEl.value) Sidebar.setPanelsBoxEl(panelBoxEl.value)
  if (rootEl.value) Sidebar.registerRootEl(rootEl.value)
  Sidebar.recalcElementSizes()
  Sidebar.recalcSidebarSize()
  Sidebar.restoreActivePanelScrollPosition()
}

onMounted(() => {
  updSidebarEls()
  document.addEventListener('keydown', onDocumentKeydown)
})

function getPanelComponent(panel: Panel): Component | undefined {
  if (panel.type === E.PanelType.tabs) return TabsPanel
  if (panel.type === E.PanelType.bookmarks) return BookmarksPanel
  if (panel.type === E.PanelType.history) return HistoryPanel
  if (panel.type === E.PanelType.sync) return SyncPanel
}

function onFocusIn(e: FocusEvent): void {
  // if (Search.reactive.barIsShowed && !Selection.isSet()) Search.focus()
}

function onFocusOut(e: FocusEvent): void {
  if ((e as MozFocusEvent).explicitOriginalTarget === e.target && !DnD.reactive.isStarted) {
    if (Menu.isOpen) Menu.close()
    Selection.resetSelection()
    if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.closeHiddenPanelsPopup(true)
  }
}

function onDocumentKeydown(e: KeyboardEvent): void {
  // Close popups
  if (e.code === 'Escape') {
    Sidebar.resetOrCancelInteraction()
  }

  // Confirm popups
  if (e.code === 'Enter') {
    // Confirm popup
    if (Popups.reactive.confirm?.ok) Popups.reactive.confirm.ok()
  }

  // Paste
  if (e.code === 'KeyV' && (Info.reactive.os === 'mac' ? e.metaKey : e.ctrlKey)) {
    if (e.target instanceof HTMLInputElement) return

    let actPanel
    if (Sidebar.subPanelActive) actPanel = Sidebar.subPanels.bookmarks
    else actPanel = Sidebar.panelsById[Sidebar.activePanelId]

    if (Utils.isTabsPanel(actPanel)) {
      if (Selection.isTabs()) {
        Tabs.pasteAfter(Selection.ids())
      } else {
        Tabs.paste({ panelId: Sidebar.activePanelId })
      }
    } else if (Utils.isBookmarksPanel(actPanel)) {
      if (Selection.isBookmarks()) {
        const target = Bookmarks.byId.get(Selection.getLast())
        if (!target) return Logs.warn('Sidebar.onDocumentKeyup: Paste bkm: No sel target')
        if (target.type === E.BkmType.Folder) Bookmarks.pasteIn(target.id)
        else Bookmarks.pasteAfter(target.id)
      } else {
        Bookmarks.pasteIn(actPanel.rootId)
      }
    }
  }
}

let lastDir: number | undefined
const onWheel = Mouse.getWheelDebouncer(E.WheelDirection.Horizontal, e => {
  if (Menu.isOpen) Menu.close()

  if (e.deltaX !== 0) Mouse.blockWheel(E.WheelDirection.Vertical)
  else return

  if (Settings.state.hScrollAction === 'switch_panels') {
    const dir = e.deltaX > 0 ? 1 : -1

    // Restart debouncer if direction is the same
    const restartDebouncer =
      Settings.state.onePanelSwitchPerScroll && (lastDir === undefined || lastDir === dir)
    lastDir = dir

    return Sidebar.switchPanel(dir, true, false, restartDebouncer)
  } else if (Settings.state.hScrollAction === 'switch_act_tabs') {
    if (e.deltaX > 0) return Tabs.switchToRecentlyActiveTab(Tabs.SwitchingTabScope.global, 1)
    if (e.deltaX < 0) return Tabs.switchToRecentlyActiveTab(Tabs.SwitchingTabScope.global, -1)
  }
})

let leaveTimeout: number | undefined
let subPanelTimeout: number | undefined
function onMouseEnter(): void {
  Mouse.setMouseInState(true)

  Sidebar.switchPanelBackResetTimeout()

  if (leaveTimeout) {
    clearTimeout(leaveTimeout)
    leaveTimeout = undefined
  }

  clearTimeout(subPanelTimeout)
}

function onMouseLeave(): void {
  if (
    Preview.state.status === Preview.Status.Open ||
    Preview.state.status === Preview.Status.Opening
  ) {
    Preview.closePreview()
  }

  // Detect if this event was fired right after drop/dragend
  // so the mouse cursor might actually still be inside the sidebar
  if (DnD.dragEndedRecently || DnD.droppedRecently) return

  Mouse.setMouseInState(false)
  Mouse.stopResizing()

  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(activePanel) && activePanel?.tempMode && !Search.active) {
    Sidebar.switchPanelBack(300)
  }

  if (Bookmarks.reactive.popup) return

  if (Mouse.multiSelectionMode) {
    leaveTimeout = setTimeout(() => {
      Mouse.stopMultiSelection()
    }, 250)
  }

  if (Sidebar.subPanelActive && !Search.active && !Menu.isOpen && !DnD.items.length) {
    Sidebar.closeSubPanel()
  }

  if (Sidebar.switchOnMouseLeave) Sidebar.switchPanelOnMouseLeave()
  if (Sidebar.scrollOnMouseLeave) Sidebar.scrollPanelOnMouseLeave()

  if (Tabs.activateSelectedOnMouseLeave && Selection.isTabs()) {
    Tabs.setActivateSelectedOnMouseLeaveState(false)

    const id = Selection.ids()[0]
    const targetTab = Tabs.byId[id]
    if (!targetTab || targetTab.id === Tabs.activeId) return Selection.resetSelection()

    browser.tabs.update(id, { active: true }).catch(err => {
      Logs.err('MouseLeave: Cannot activate tab on mouseleave:', err)
    })
  }
}

function onMouseDown(e: MouseEvent): void {
  Selection.resetSelection()

  if (e.button === 1) {
    Mouse.blockWheel()
    e.preventDefault()
  }
}

function onMouseUp(e: MouseEvent): void {
  Mouse.resetClickLock(120)

  if (e.button === 0 && !e.ctrlKey && !e.shiftKey) {
    Menu.close()
    Selection.resetSelection()
    if (Sidebar.reactive.hiddenPanelsPopup) {
      Sidebar.closeHiddenPanelsPopup()
    }
  }

  const inMultiSelectionMode = Mouse.multiSelectionMode
  if (inMultiSelectionMode) Mouse.stopMultiSelection()

  if (e.button === 1) {
    if (!Settings.state.multipleMiddleClose) return

    if (inMultiSelectionMode && !Settings.state.autoMenuMultiSel && Selection.getLength() > 1) {
      return
    }

    Tabs.removeTabs(Selection.ids())
  } else if (e.button === 2) {
    let type: E.MenuType | undefined
    if (Selection.isBookmarks()) type = E.MenuType.Bookmarks
    if (Selection.isTabs()) type = E.MenuType.Tabs
    if (type === undefined) return
    if (inMultiSelectionMode && !Settings.state.autoMenuMultiSel && Selection.getLength() > 1) {
      return
    }
    Menu.open(type, e.clientX, e.clientY)
  }
}

type PanelPosition = 'left' | 'center' | 'right'
function getPanelPos(i: number, panelId: ID): PanelPosition {
  if (panelId === Sidebar.reactive.activePanelId) return 'center'
  if (i === -1) return 'right'

  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (activePanel && i > activePanel.index) return 'right'
  else return 'left'
}

let onBSPBDragLeaveTimeout: number | undefined
function onBSPBDragLeave() {
  if (Sidebar.subPanelActive) DnD.reactive.dstType = E.DropType.Bookmarks
  else DnD.reactive.dstType = E.DropType.Nowhere

  clearTimeout(onBSPBDragLeaveTimeout)
  onBSPBDragLeaveTimeout = setTimeout(() => {
    if (Sidebar.subPanelActive) Sidebar.updateBounds()
  }, 120)
}

function onSSPBDragLeave() {
  DnD.reactive.dstType = E.DropType.Nowhere
}
</script>
