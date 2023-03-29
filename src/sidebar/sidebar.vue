<template lang="pug">
#root.root.Sidebar(
  ref="rootEl"
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
  :data-pinned-tabs-position="pinnedTabsPosition"
  :data-pinned-tabs-list="Settings.state.pinnedTabsList"
  :data-tabs-tree-lvl-marks="Settings.state.tabsLvlDots"
  :data-tabs-close-btn="Settings.state.tabRmBtn"
  :data-drag="DnD.reactive.isStarted"
  :data-nav-inline="Settings.state.navBarInline"
  :data-nav-layout="navBarLayout"
  :data-search="!!Search.reactive.value"
  :data-sticky-bookmarks="Settings.state.pinOpenedBookmarksFolder"
  :data-colorized-branches="Settings.state.colorizeTabsBranches"
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

  Transition(name="popup" type="transition"): ConfirmPopup(v-if="Sidebar.reactive.confirm")
  Transition(name="popup" type="transition"): WindowsPopup(v-if="Windows.reactive.choosing")
  Transition(name="popup" type="transition"): BookmarksPopup(v-if="Bookmarks.reactive.popup")
  Transition(name="popup" type="transition"): PanelConfigPopup(v-if="Sidebar.reactive.panelConfigPopup")
  Transition(name="popup" type="transition"): ContainerConfigPopup(v-if="Sidebar.reactive.containerConfigPopup")
  Transition(name="popup" type="transition"): GroupConfigPopup(v-if="Sidebar.reactive.groupConfigPopup")
  Transition(name="popup" type="transition"): DialogPopup(v-if="Sidebar.reactive.dialog" :dialog="Sidebar.reactive.dialog")
  Transition(name="popup" type="transition"): NewTabShortcutsPopup(v-if="Sidebar.reactive.newTabShortcutsPopup")
  Transition(name="popup" type="transition"): SiteConfigPopup(v-if="Sidebar.reactive.siteConfigPopup")
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
          v-for="(panel, i) in Sidebar.reactive.panels"
          :key="panel.id"
          :is="getPanelComponent(panel)"
          :data-pos="getPanelPos(i, panel.id)"
          :panel="panel")

      Transition(name="bottom-bar")
        .BottomBar(v-if="bottomBar && Utils.isTabsPanel(activePanel)")
          .tools
            .tool-btn(
              v-if="Settings.state.subPanelRecentlyClosedBar"
              :data-disabled="!Tabs.reactive.recentlyRemoved.length"
              @click="Sidebar.openSubPanel(SubPanelType.RecentlyClosedTabs, activePanel)")
              svg: use(xlink:href="#icon_trash")
            .tool-btn(
              v-if="Settings.state.subPanelBookmarks"
              :data-disabled="!Utils.isTabsPanel(activePanel)"
              @click="Sidebar.openSubPanel(SubPanelType.Bookmarks, activePanel)")
              svg: use(xlink:href="#icon_bookmarks")
            .tool-btn(
              v-if="Settings.state.subPanelHistory"
              :data-disabled="!Utils.isTabsPanel(activePanel)"
              @click="Sidebar.openSubPanel(SubPanelType.History, activePanel)")
              svg: use(xlink:href="#icon_clock")

      SubPanel(ref="subPanel")

    .right-vertical-box(v-if="pinnedTabsBarRight || navBarRight")
      PinnedTabsBar(v-if="pinnedTabsBarRight")
      NavigationBar.-vert(v-if="navBarRight")
  
  UpgradeScreen(v-if="Sidebar.reactive.upgrading?.active")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, Component } from 'vue'
import { PanelType, Panel, MenuType, WheelDirection, SubPanelComponent } from 'src/types'
import { SubPanelType } from 'src/types'
import { Settings } from 'src/services/settings'
import { GroupConfigResult, Sidebar } from 'src/services/sidebar'
import { Styles } from 'src/services/styles'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import { Bookmarks } from 'src/services/bookmarks'
import { Windows } from 'src/services/windows'
import { Search } from 'src/services/search'
import { SwitchingTabScope } from 'src/services/tabs.fg.actions'
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
import SearchBar from './components/bar.search.vue'
import BookmarksPopup from 'src/components/popup.bookmarks.vue'
import PanelConfigPopup from './components/popup.panel-config.vue'
import ContainerConfigPopup from './components/popup.container-config.vue'
import GroupConfigPopup from './components/popup.group-config.vue'
import DialogPopup from './components/popup.dialog.vue'
import NewTabShortcutsPopup from '../components/popup.new-tab-shortcuts.vue'
import SiteConfigPopup from '../components/popup.site-config.vue'
import UpgradeScreen from '../components/upgrade-screen.vue'
import SubPanel from './components/sub-panel.vue'
import * as Utils from 'src/utils'

const rootEl = ref<HTMLElement | null>(null)
const panelBoxEl = ref<HTMLElement | null>(null)
const subPanel = ref<SubPanelComponent | null>(null)

const animations = !Settings.state.animations ? 'none' : Settings.state.animationSpeed || 'fast'
const pinnedTabsBarTop = Settings.state.pinnedTabsPosition === 'top'
const pinnedTabsBarLeft = Settings.state.pinnedTabsPosition === 'left'
const pinnedTabsBarRight = Settings.state.pinnedTabsPosition === 'right'
const navBarHorizontal = Settings.state.navBarLayout === 'horizontal'
const navBarVertical = Settings.state.navBarLayout === 'vertical'
const navBarLayout = navBarVertical ? Settings.state.navBarSide : Settings.state.navBarLayout
const navBarLeft = navBarVertical && Settings.state.navBarSide === 'left'
const navBarRight = navBarVertical && Settings.state.navBarSide === 'right'
const bottomBar =
  Settings.state.subPanelRecentlyClosedBar ||
  Settings.state.subPanelBookmarks ||
  Settings.state.subPanelHistory

const pinnedTabsPosition = computed(() => {
  if (!Tabs.reactive.pinned.length) return 'none'
  return Settings.state.pinnedTabsPosition
})

const activePanel = computed<Panel | undefined>(() => {
  return Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
})

onMounted(() => {
  if (panelBoxEl.value) Sidebar.setPanelsBoxEl(panelBoxEl.value)
  if (rootEl.value) Sidebar.registerRootEl(rootEl.value)
  Sidebar.recalcElementSizes()
  Sidebar.recalcSidebarSize()

  document.addEventListener('keyup', onDocumentKeyup)

  Sidebar.subPanelComponent = subPanel.value
})

function getPanelComponent(panel: Panel): Component | undefined {
  if (panel.type === PanelType.tabs) return TabsPanel
  if (panel.type === PanelType.bookmarks) return BookmarksPanel
  if (panel.type === PanelType.history) return HistoryPanel
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

function onDocumentKeyup(e: KeyboardEvent): void {
  // Close popups
  if (e.code === 'Escape') {
    // Selection (without menu)
    if (!Menu.isOpen && Selection.isSet()) Selection.resetSelection()

    // Context menu
    if (Menu.isOpen) Menu.close()

    // Confirm popup
    if (Sidebar.reactive.confirm) Sidebar.reactive.confirm = null

    // Windows popup
    if (Windows.reactive.choosing) Windows.closeWindowsPopup()

    // Bookmarks popup
    if (Bookmarks.reactive.popup?.close) Bookmarks.reactive.popup.close()

    // Panel config popup
    if (Sidebar.reactive.panelConfigPopup) Sidebar.closePanelPopup()

    // Conatiner config popup
    if (Sidebar.reactive.containerConfigPopup) Sidebar.closeContainerPopup()

    // Group config popup
    if (Sidebar.reactive.groupConfigPopup) {
      Sidebar.reactive.groupConfigPopup.done(GroupConfigResult.Cancel)
      Sidebar.reactive.groupConfigPopup = null
    }

    // Dialog popup
    if (Sidebar.reactive.dialog) Sidebar.reactive.dialog.result(null)

    // Hidden panels popup
    if (Sidebar.reactive.hiddenPanelsPopup) {
      Sidebar.closeHiddenPanelsPopup()
    }

    // New tab shortcuts popup
    if (Sidebar.reactive.newTabShortcutsPopup) {
      Sidebar.closeNewTabShortcutsPopup()
    }

    // Search bar
    if (Search.reactive.barIsShowed) Search.stop()
  }
}

const onWheel = Mouse.getWheelDebouncer(WheelDirection.Horizontal, e => {
  if (Menu.isOpen) Menu.close()

  if (e.deltaX !== 0) Mouse.blockWheel(WheelDirection.Vertical)

  if (Settings.state.hScrollAction === 'switch_panels') {
    if (e.deltaX > 0) return Sidebar.switchPanel(1, true)
    if (e.deltaX < 0) return Sidebar.switchPanel(-1, true)
  } else if (Settings.state.hScrollAction === 'switch_act_tabs') {
    if (e.deltaX > 0) return Tabs.switchToRecentlyActiveTab(SwitchingTabScope.global, 1)
    if (e.deltaX < 0) return Tabs.switchToRecentlyActiveTab(SwitchingTabScope.global, -1)
  }
})

let leaveTimeout: number | undefined
let subPanelTimeout: number | undefined
function onMouseEnter(): void {
  Sidebar.switchPanelBackResetTimeout()

  if (leaveTimeout) {
    clearTimeout(leaveTimeout)
    leaveTimeout = undefined
  }

  clearTimeout(subPanelTimeout)
}

function onMouseLeave(): void {
  if (DnD.dragEndedRecently) return

  Mouse.stopResizing()

  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(activePanel) && activePanel?.tempMode && !Search.reactive.rawValue) {
    Sidebar.switchPanelBack(300)
  }

  if (Bookmarks.reactive.popup) return

  if (Mouse.multiSelectionMode) {
    leaveTimeout = setTimeout(() => {
      Mouse.stopMultiSelection()
    }, 250)
  }

  if (Sidebar.subPanelOpen) {
    clearTimeout(subPanelTimeout)
    subPanelTimeout = setTimeout(() => {
      Sidebar.subPanelComponent?.close()
    }, 300)
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

    Tabs.removeTabs(Selection.get())
  } else if (e.button === 2) {
    let type: MenuType | undefined
    if (Selection.isBookmarks()) type = MenuType.Bookmarks
    if (Selection.isTabs()) type = MenuType.Tabs
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

  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (activePanel && i > activePanel.index) return 'right'
  else return 'left'
}
</script>
