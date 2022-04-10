<template lang="pug">
#root.root.Sidebar(
  ref="rootEl"
  :data-native-scrollbar="Settings.reactive.nativeScrollbars"
  :data-native-scrollbars-thin="Settings.reactive.nativeScrollbarsThin"
  :data-theme="Settings.reactive.theme"
  :data-color-scheme="Styles.reactive.colorScheme"
  :data-animations="animations"
  :data-pinned-tabs-position="pinnedTabsPosition"
  :data-pinned-tabs-list="Settings.reactive.pinnedTabsList"
  :data-tabs-tree-lvl-marks="Settings.reactive.tabsLvlDots"
  :data-tabs-close-btn="Settings.reactive.showTabRmBtn"
  :data-drag="DnD.reactive.isStarted"
  :data-nav-inline="Settings.reactive.navBarInline"
  :data-nav-layout="navBarLayout"
  :data-search="!!Search.reactive.value"
  :data-sticky-bookmarks="Settings.reactive.pinOpenedBookmarksFolder"
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

  SearchBar(v-show="Settings.reactive.searchBarMode !== 'none'")
  Transition(name="popup" type="transition"): ConfirmPopup(v-if="Sidebar.reactive.confirm")
  Transition(name="popup" type="transition"): WindowsPopup(v-if="Windows.reactive.choosing")
  Transition(name="popup" type="transition"): BookmarksPopup(v-if="Bookmarks.reactive.popup")
  Transition(name="popup" type="transition"): PanelConfigPopup(v-if="Sidebar.reactive.fastPanelConfig")
  Transition(name="popup" type="transition"): ContainerConfigPopup(v-if="Sidebar.reactive.fastContainerConfig")
  Transition(name="popup" type="transition"): TabsPanelRemovingPopup(v-if="Sidebar.reactive.tabsPanelRemoving")
  CtxMenuPopup
  DragAndDropTooltip
  NotificationsPopup

  .top-horizontal-box(v-if="navBarHorizontal")
    NavigationBar.-top

  .main-box
    .left-vertical-box(v-if="pinnedTabsBarLeft || navBarLeft")
      PinnedTabsBar(v-if="pinnedTabsBarLeft")
      NavigationBar.-vert(v-if="navBarLeft")

    .central-box
      PinnedTabsBar(v-if="pinnedTabsBarTop")
      .panel-box(ref="panelBoxEl" @wheel.passive="onWheel")
        component.panel(
          v-for="(panel, i) in Sidebar.reactive.panels"
          :key="panel.id"
          :is="getPanelComponent(panel)"
          :data-pos="getPanelPos(i, panel.id)"
          :panel="panel")
        DragAndDropPointer

    .right-vertical-box(v-if="pinnedTabsBarRight || navBarRight")
      PinnedTabsBar(v-if="pinnedTabsBarRight")
      NavigationBar.-vert(v-if="navBarRight")
  
  UpgradeScreen(v-if="Sidebar.reactive.upgrading?.active")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, Component } from 'vue'
import { PanelType, Panel, MenuType } from 'src/types'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Styles } from 'src/services/styles'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import { Bookmarks } from 'src/services/bookmarks'
import { Windows } from 'src/services/windows'
import { Search } from 'src/services/search'
import ConfirmPopup from './components/popup.confirm.vue'
import CtxMenuPopup from './components/popup.context-menu.vue'
import DragAndDropTooltip from './components/dnd-tooltip.vue'
import DragAndDropPointer from './components/dnd-pointer.vue'
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
import TabsPanelRemovingPopup from './components/popup.tabs-panel-removing.vue'
import UpgradeScreen from '../components/upgrade-screen.vue'
import Utils from 'src/utils'

const rootEl = ref<HTMLElement | null>(null)
const panelBoxEl = ref<HTMLElement | null>(null)

const pinnedTabsPosition = computed(() => {
  if (!Tabs.reactive.pinned.length) return 'none'
  return Settings.reactive.pinnedTabsPosition
})
const animations = computed(() => {
  if (!Settings.reactive.animations) return 'none'
  else return Settings.reactive.animationSpeed || 'fast'
})
const pinnedTabsBarTop = computed(() => Settings.reactive.pinnedTabsPosition === 'top')
const pinnedTabsBarLeft = computed(() => Settings.reactive.pinnedTabsPosition === 'left')
const pinnedTabsBarRight = computed(() => Settings.reactive.pinnedTabsPosition === 'right')
const navBarLayout = computed(() => {
  if (Settings.reactive.navBarLayout === 'vertical') return Settings.reactive.navBarSide
  return Settings.reactive.navBarLayout
})
const navBarHorizontal = computed(() => Settings.reactive.navBarLayout === 'horizontal')
const navBarLeft = computed(
  () => Settings.reactive.navBarLayout === 'vertical' && Settings.reactive.navBarSide === 'left'
)
const navBarRight = computed(
  () => Settings.reactive.navBarLayout === 'vertical' && Settings.reactive.navBarSide === 'right'
)

onMounted(() => {
  if (panelBoxEl.value) Sidebar.setPanelsBoxEl(panelBoxEl.value)
  if (rootEl.value) Sidebar.registerRootEl(rootEl.value)
  Sidebar.recalcElementSizes()
  Sidebar.recalcSidebarSize()

  document.addEventListener('keyup', onDocumentKeyup)
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
    Selection.resetSelection()
  }
}

function onDocumentKeyup(e: KeyboardEvent): void {
  // Close popups
  if (e.code === 'Escape') {
    // Selection (without menu)
    if (!Menu.isOpen && Selection.isSet) Selection.resetSelection()

    // Context menu
    if (Menu.isOpen) Menu.close()

    // Confirm popup
    if (Sidebar.reactive.confirm) Sidebar.reactive.confirm = null

    // Windows popup
    if (Windows.reactive.choosing) Windows.closeWindowsPopup()

    // Bookmarks popup
    if (Bookmarks.reactive.popup?.close) Bookmarks.reactive.popup.close()

    // Panel config popup
    if (Sidebar.reactive.fastPanelConfig) Sidebar.stopFastEditingOfPanel(false)

    // Conatiner config popup
    if (Sidebar.reactive.fastContainerConfig) Sidebar.stopFastEditingOfContainer(false)

    // Tabs panel removing popup
    if (Sidebar.reactive.tabsPanelRemoving) Sidebar.reactive.tabsPanelRemoving = null

    // Search bar
    if (Search.reactive.barIsShowed) Search.stop()
  }
}

function onWheel(e: WheelEvent): void {
  if (Menu.isOpen) Menu.close()
  // Selection.resetSelection()

  if (Settings.reactive.hScrollThroughPanels) {
    let threshold = e.deltaMode === 0 ? 8 : 1
    if (e.deltaX >= threshold) return Sidebar.switchPanel(1, true)
    if (e.deltaX <= -threshold) return Sidebar.switchPanel(-1, true)
  }
}

let leaveTimeout: number | undefined
function onMouseEnter(): void {
  Sidebar.switchPanelBackResetTimeout()

  if (leaveTimeout) {
    clearTimeout(leaveTimeout)
    leaveTimeout = undefined
  }
}

function onMouseLeave(): void {
  Mouse.stopResizing()

  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(activePanel) && activePanel?.tempMode && !Search.reactive.rawValue) {
    Sidebar.switchPanelBack(250)
  }

  if (Bookmarks.reactive.popup) return

  if (!Menu.isOpen || !Settings.reactive.ctxMenuNative) {
    leaveTimeout = setTimeout(() => {
      Menu.close()
      Selection.resetSelection()
    }, 250)
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
  Mouse.resetTarget()
  Mouse.resetClickLock(120)

  if (e.button === 0 && !e.ctrlKey && !e.shiftKey) {
    Menu.close()
    Selection.resetSelection()
  }

  if (Mouse.multiSelectionMode) Mouse.stopMultiSelection()
  if (e.button === 2) {
    let type: MenuType | undefined
    if (Selection.isBookmarks()) type = MenuType.Bookmarks
    if (Selection.isTabs()) type = MenuType.Tabs
    if (type === undefined) return
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
