<template lang="pug">
.NavigationBar(
  id="nav_bar"
  ref="el"
  tabindex="-1"
  :data-overflowed="overflowed"
  :data-hidden-panels-bar="Sidebar.reactive.hiddenPanelsPopup"
  :data-layout="layout"
  @drop="onDrop")
  .main-items(@wheel.stop.prevent="onNavWheel")
    NavItemComponent(
      v-for="(item, i) in visible"
      :key="item.id"
      :item="item"
      :inlineIndex="getBtnInlineIndex(i)"
      :dndType="'nav-item'"
      @dragstart="onNavDragStart($event, item)"
      @drop="onNavItemDrop(item)"
      @mousedown="onNavMouseDown($event, item)"
      @mouseup="onNavMouseUp($event, item)"
      @contextmenu="onNavCtxMenu($event, item)")

  .static-btns(v-if="staticButtons.length")
    NavItemComponent(
      v-for="(item, i) in staticButtons"
      :key="item.id"
      :item="item"
      :inlineIndex="getBtnInlineIndex(i)"
      :dndType="'nav-item'"
      @dragstart="onNavDragStart($event, item)"
      @drop="onNavItemDrop(item)"
      @mousedown="onNavMouseDown($event, item)"
      @mouseup="onNavMouseUp($event, item)"
      @contextmenu="onNavCtxMenu($event, item)")

  Transition(name="hidden-panels"): .hidden-panels-popup-layer(
    v-if="Sidebar.reactive.hiddenPanelsPopup"
    data-dnd-type="hidden-layer"
    :style="{ '--offset': `${Sidebar.reactive.hiddenPanelsPopupOffset}px` }"
    @mousedown="Sidebar.closeHiddenPanelsPopup()")
    .hidden-panels-popup(:data-offset-side="Sidebar.reactive.hiddenPanelsPopupOffsetSide")
      .hidden-panels-popup-content(@mousedown.stop @mouseup.stop)
        NavItemComponent(
          v-for="(item, i) in hidden"
          :key="item.id"
          :item="item"
          :inlineIndex="getBtnInlineIndex(i)"
          :dndType="'hidden-panel'"
          @dragstart="onNavDragStart($event, item)"
          @drop="onNavItemDrop(item)"
          @mousedown="onNavMouseDown($event, item)"
          @mouseup="onNavMouseUp($event, item, true)"
          @contextmenu="onNavCtxMenu($event, item)")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { BTN_ICONS, COLOR_NAMES } from 'src/defaults'
import { NavItemClass, ButtonTypes, DragType, DropType, Tab } from 'src/types'
import { MenuType, DragInfo, DragItem, PanelType } from 'src/types'
import { ButtonType, SpaceType, NavBtn, NavItem, WheelDirection } from 'src/types'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Bookmarks } from 'src/services/bookmarks'
import { Mouse } from 'src/services/mouse'
import { SetupPage } from 'src/services/setup-page'
import { DnD } from 'src/services/drag-and-drop'
import { Search } from 'src/services/search'
import { Snapshots } from 'src/services/snapshots'
import * as Popups from 'src/services/popups'
import NavItemComponent from './nav-item.vue'

const HIDDEN_PANELS_BTN: NavBtn = {
  id: 'hidden_panels_btn',
  class: NavItemClass.btn,
  type: ButtonType.hidden,
  iconSVG: 'icon_expand',
  name: translate('nav.show_hidden_tooltip'),
  tooltip: translate('nav.show_hidden_tooltip'),
}

let droppedOnPanel = false

const el = ref<HTMLElement | null>(null)

const isInline = Settings.state.navBarLayout === 'horizontal' && Settings.state.navBarInline
let layout = 'none'
if (Settings.state.navBarLayout === 'horizontal') {
  layout = Settings.state.navBarInline ? 'inline' : 'wrap'
} else if (Settings.state.navBarLayout === 'vertical') {
  layout = Settings.state.navBarSide
}

const hidden = computed((): NavItem[] => {
  if (!Settings.state.hideEmptyPanels && !Settings.state.hideDiscardedTabPanels && !isInline) {
    return []
  }
  const result: NavItem[] = []

  for (const id of Sidebar.reactive.nav) {
    const panel = Sidebar.panelsById[id]
    if (Utils.isTabsPanel(panel)) {
      if (Settings.state.hideEmptyPanels && !panel.reactive.len) {
        result.push(panel)
      } else if (Settings.state.hideDiscardedTabPanels && panel.reactive.allDiscarded) {
        result.push(panel)
      }
    }
  }

  return result
})

// Close hidden panels bar if it's empty
watch(
  () => hidden.value.length,
  newHiddenLen => {
    if (!newHiddenLen && Sidebar.reactive.hiddenPanelsPopup) {
      Sidebar.reactive.hiddenPanelsPopup = false
    }
  }
)

const visible = computed((): NavItem[] => {
  const result: NavItem[] = []
  let firstTabsPanelIndex = -1
  let lastTabsPanelIndex = -1

  for (const id of Sidebar.reactive.nav) {
    const panel = Sidebar.panelsById[id]
    if (panel) {
      if (Utils.isTabsPanel(panel)) {
        if (firstTabsPanelIndex === -1) firstTabsPanelIndex = result.length
        if (Settings.state.hideEmptyPanels && panel.reactive.len === 0) continue
        else if (Settings.state.hideDiscardedTabPanels && panel.reactive.allDiscarded) continue
        lastTabsPanelIndex = result.length
      }
      result.push(panel)
    } else if (!isInline) {
      const isSpace = (id as string).startsWith('sp-')
      const isDelimiter = (id as string).startsWith('sd-')
      const isSearch = id === 'search'

      if (isSearch && Settings.state.searchBarMode !== 'dynamic') continue

      if (isSpace) {
        result.push({ id, class: NavItemClass.space, type: SpaceType.dynamic })
      } else if (isDelimiter) {
        result.push({ id, class: NavItemClass.space, type: SpaceType.static })
      } else {
        const type = ButtonTypes[id]
        if (!type) continue

        const name = translate(`nav.btn_${id}`)

        result.push({ id, class: NavItemClass.btn, type, name, iconSVG: BTN_ICONS[id] })
      }
    }
  }

  if (!isInline && hidden.value.length) {
    let hIndex = -1
    if (lastTabsPanelIndex !== -1) hIndex = lastTabsPanelIndex + 1
    else if (firstTabsPanelIndex !== -1) hIndex = firstTabsPanelIndex

    if (hIndex !== -1) result.splice(hIndex, 0, HIDDEN_PANELS_BTN)
    else result.push(HIDDEN_PANELS_BTN)
  }

  return result
})

const staticButtons = computed((): NavBtn[] => {
  if (!isInline) return []
  const result: NavBtn[] = []

  if (hidden.value.length) {
    result.push(HIDDEN_PANELS_BTN)
  }

  for (const id of Sidebar.reactive.nav) {
    if (
      id === 'settings' ||
      id === 'search' ||
      id === 'add_tp' ||
      id === 'collapse' ||
      id === 'create_snapshot' ||
      id === 'remute_audio_tabs'
    ) {
      if (hidden.value.find(ni => ni.id === id)) continue

      const name = translate(`nav.btn_${id}`)
      const type = ButtonTypes[id]
      if (!type) continue

      result.push({ id, class: NavItemClass.btn, type, iconSVG: BTN_ICONS[id], name })
    }
  }

  return result
})

const cap = computed((): number => {
  let availableWidth = Sidebar.reactive.horNavWidth - 2
  let cap = ~~(availableWidth / (Sidebar.reactive.navBtnWidth + 1))
  return cap - staticButtons.value.length
})

const overflowed = computed((): boolean => {
  let spLen = 0
  for (const item of visible.value) {
    if (Utils.isNavSpace(item)) spLen++
  }
  return visible.value.length - spLen >= cap.value
})

onMounted(() => {
  if (el.value && Settings.state.navBarLayout === 'horizontal') {
    Sidebar.registerHorizontalNavBarEl(el.value)
    Sidebar.reactive.horNavWidth = el.value.offsetWidth
  }
})

function getBtnInlineIndex(index: number): number {
  if (!cap.value) return -1
  let activeIndex = visible.value.findIndex(btn => btn.id === Sidebar.reactive.activePanelId)
  if (activeIndex === -1) activeIndex = 0
  const halfCap = Math.floor(cap.value / 2)
  let len = visible.value.length

  if (cap.value >= len) return index
  if (halfCap > activeIndex && index < cap.value) return index
  if (activeIndex + halfCap >= len) {
    if (index < len - cap.value) return -1
    return index - (len - cap.value)
  }

  index -= activeIndex - halfCap
  if (!(cap.value % 2)) index--
  if (index >= 0 && index < cap.value) return index
  else return -1
}

const onNavWheel = Mouse.getWheelDebouncer(WheelDirection.Vertical, (e: WheelEvent) => {
  if (Settings.state.navSwitchPanelsWheel) {
    if (e.deltaY > 0) return Sidebar.switchPanel(1, true)
    if (e.deltaY < 0) return Sidebar.switchPanel(-1, true)
  }
})

function onDrop(e: DragEvent): void {
  if (!droppedOnPanel) DnD.reactive.dstType = DropType.Nowhere
  droppedOnPanel = false
}

/**
 * Handle context menu event
 */
function onNavCtxMenu(e: MouseEvent, item: NavItem) {
  if (!Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  let panel = Sidebar.panelsById[item.id]
  if (!panel) {
    e.preventDefault()
    return
  }

  Menu.blockCtxMenu()

  let nativeCtx = { showDefaults: false }
  browser.menus.overrideContext(nativeCtx)

  let type: MenuType
  if (panel.type === PanelType.bookmarks) type = MenuType.BookmarksPanel
  else if (panel.type === PanelType.tabs) type = MenuType.TabsPanel
  else type = MenuType.Panel

  if (!Selection.isSet()) Selection.selectNavItem(panel.id)
  Menu.open(type)
}

function onNavMouseDown(e: MouseEvent, item: NavItem) {
  if (Utils.isNavSpace(item)) return Mouse.resetTarget()
  Mouse.setTarget('nav', item.id)
  Menu.close()
  Selection.resetSelection()

  // Middle click action
  if (e.button === 1) {
    if (item.type === PanelType.tabs) {
      const panel = Sidebar.panelsById[item.id]
      if (!Utils.isTabsPanel(panel)) return

      // Remove tabs
      if (Settings.state.navTabsPanelMidClickAction === 'rm_all') {
        let toRemove = panel.tabs.map(t => t.id)
        if (Settings.state.pinnedTabsPosition === 'panel') {
          panel.pinnedTabs.forEach(t => toRemove.push(t.id))
        }

        if (toRemove.length) Tabs.removeTabs(toRemove)
      }

      // Remove active tab
      if (Settings.state.navTabsPanelMidClickAction === 'rm_act_tab') {
        let actTab = Tabs.byId[Tabs.activeId]
        if (actTab && actTab.panelId === item.id && !actTab.pinned) {
          Tabs.removeTabs([Tabs.activeId])
        }
      }

      // Discard(unload) tabs
      if (Settings.state.navTabsPanelMidClickAction === 'discard') {
        const ids = panel.tabs.map(t => t.id)
        if (ids.length) Tabs.discardTabs(ids)
      }

      // Save panel to bookmarks
      if (Settings.state.navTabsPanelMidClickAction === 'bookmark') {
        Sidebar.bookmarkTabsPanel(panel.id, true)
      }

      // Convert tabs panel to bookmarks panel
      if (Settings.state.navTabsPanelMidClickAction === 'convert') {
        Sidebar.convertToBookmarksPanel(panel)
      }
    }

    if (item.type === PanelType.bookmarks) {
      const panel = Sidebar.panelsById[item.id]
      if (!Utils.isBookmarksPanel(panel)) return

      // Convert bookmarks panel to tabs panel
      if (Settings.state.navBookmarksPanelMidClickAction === 'convert') {
        Sidebar.convertToTabsPanel(panel, true)
      }
    }

    if (item.type === ButtonType.create_snapshot) SetupPage.open('snapshots')

    if (item.type === ButtonType.remute_audio_tabs) {
      const pausedTabs: Tab[] = []
      const audibleTabs: Tab[] = []
      for (const tab of Tabs.list) {
        if (tab.mediaPaused) pausedTabs.push(tab)
        else if (tab.audible) audibleTabs.push(tab)
      }

      if (audibleTabs.length) Tabs.pauseAllAudibleTabsMedia()
      else if (pausedTabs.length === 1) Tabs.playAllPausedTabsMedia()
    }

    if (item.type === ButtonType.collapse) collapseAll()

    if (item.type === ButtonType.add_tp) addTabsPanel(true)
  }
}

function onNavMouseUp(e: MouseEvent, item: NavItem, inHiddenBar?: boolean) {
  if (Utils.isNavSpace(item)) return
  if (!Mouse.isTarget('nav', item.id)) return

  const isTabs = item.type === PanelType.tabs
  const isBookmarks = item.type === PanelType.bookmarks
  const isHiddenPanels = item.type === ButtonType.hidden
  const isSettings = item.type === ButtonType.settings
  const isSearch = item.type === ButtonType.search
  const isCreateSnapshot = item.type === ButtonType.create_snapshot
  const isRemuteAudioTabs = item.type === ButtonType.remute_audio_tabs
  const isAddTP = item.type === ButtonType.add_tp
  const panel = Sidebar.panelsById[item.id]

  // Left
  if (e.button === 0) {
    if (isHiddenPanels) {
      if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.closeHiddenPanelsPopup()
      else Sidebar.openHiddenPanelsPopup()
      return
    }
    if (isAddTP) return addTabsPanel()
    if (isSettings) {
      if (e.altKey) {
        SetupPage.copyDevtoolsUrl()
        return browser.tabs.create({})
      } else return SetupPage.open()
    }
    if (isSearch) return Search.toggleBar()
    if (isCreateSnapshot) return Snapshots.createSnapshot()
    if (isRemuteAudioTabs) return Tabs.remuteAudibleTabs()
    if (item.type === ButtonType.collapse) collapseAll()
    if (inHiddenBar) {
      Sidebar.closeHiddenPanelsPopup()
      if (Sidebar.reactive.activePanelId !== item.id) Sidebar.switchToPanel(item.id)
      return
    }

    if (Sidebar.reactive.activePanelId !== item.id) {
      if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false
      return Sidebar.switchToPanel(item.id)
    }
    if (isBookmarks) {
      if (Settings.state.navActBookmarksPanelLeftClickAction === 'scroll') {
        return Bookmarks.scrollBookmarksToEdge()
      }
    }
    if (isTabs && panel) {
      if (Settings.state.navActTabsPanelLeftClickAction === 'new_tab') {
        return Tabs.createTabInPanel(panel)
      }
    }
  }

  // Right
  else if (e.button === 2) {
    e.stopPropagation()

    if (Settings.state.ctxMenuNative) return
    if (Selection.isSet()) return Selection.resetSelection()
    if (isRemuteAudioTabs) return Tabs.switchToFirstAudibleTab()

    if (isSettings) {
      Tabs.pringDbgInfo(!e.altKey)
    }

    const panel = Sidebar.panelsById[item.id]
    if (!panel) return

    let type: MenuType
    if (item.type === PanelType.bookmarks) type = MenuType.BookmarksPanel
    else if (item.type === PanelType.tabs) type = MenuType.TabsPanel
    else type = MenuType.Panel

    Selection.selectNavItem(item.id)
    Menu.open(type, e.clientX, e.clientY)
  }
}

function onNavDragStart(e: DragEvent, item: NavItem) {
  Menu.close()
  Selection.resetSelection()

  const panel = Sidebar.panelsById[item.id]
  const isTabsPanel = Utils.isTabsPanel(panel)
  const isBookmarksPanel = Utils.isBookmarksPanel(panel)

  let dndType: DragType
  if (isTabsPanel) dndType = DragType.TabsPanel
  else if (isBookmarksPanel) dndType = DragType.BookmarksPanel
  else dndType = DragType.NavItem

  if (isTabsPanel || isBookmarksPanel) Sidebar.updateBounds()
  Selection.selectNavItem(item.id)

  const contentList = []
  const dragItems: DragItem[] = []
  const dragInfo: DragInfo = {
    type: dndType,
    items: dragItems,
    windowId: Windows.id,
    incognito: Windows.incognito,
    pinnedTabs: false,
    x: e.clientX,
    y: e.clientY,
    index: Sidebar.reactive.nav.indexOf(item.id),
  }

  if (Utils.isTabsPanel(panel)) {
    dragInfo.panelId = panel.id
    for (const rTab of panel.tabs) {
      const tab = Tabs.byId[rTab.id]
      if (!tab) continue
      contentList.push(tab.title)
      contentList.push(tab.url)
      contentList.push('')
      dragItems.push({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        parentId: tab.parentId,
        container: tab.cookieStoreId,
      })
    }
  } else {
    dragItems.push({ id: item.id })
  }

  DnD.start(dragInfo, DropType.NavItem)

  // Set native drag info
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    if (Settings.state.dndOutside === 'data' ? !e.altKey : e.altKey) {
      e.dataTransfer.setData('text/plain', contentList.join('\r\n'))
    }
    const dragImgEl = document.getElementById('drag_image')
    if (dragImgEl) e.dataTransfer.setDragImage(dragImgEl, -3, -3)
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onNavItemDrop(item: NavItem): void {
  droppedOnPanel = true
}

async function addTabsPanel(silent?: boolean): Promise<void> {
  // Find target index
  let index = Utils.findLastIndex(Sidebar.reactive.nav, id => {
    const panel = Sidebar.panelsById[id]
    return Utils.isTabsPanel(panel)
  })
  if (index !== -1) index++
  if (index === -1) index = Sidebar.reactive.nav.indexOf('add_tp')
  if (index === -1) index = 0

  // Start panel creation
  let panel
  if (!silent) {
    const result = await Popups.openPanelPopup({ type: PanelType.tabs }, index)
    if (!result) return

    panel = Sidebar.panelsById[result]
  } else {
    panel = Sidebar.createTabsPanel()
    panel.color = Utils.getRandomFrom(COLOR_NAMES)
    Sidebar.addPanel(index, panel)
    Sidebar.recalcPanels()
    Sidebar.recalcTabsPanels()
    Sidebar.saveSidebar(300)
  }

  if (!panel) return

  Sidebar.activatePanel(panel.id)
  Tabs.createTabInPanel(panel)
}

function collapseAll(): void {
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!activePanel) return

  // Tabs
  if (Utils.isTabsPanel(activePanel)) {
    const tabs: Tab[] = []
    for (const rTab of activePanel.tabs) {
      const tab = Tabs.byId[rTab.id]
      if (tab && tab.lvl === 0) tabs.push(tab)
    }
    Tabs.foldAllInactiveBranches(tabs)
  }

  // Bookmarks
  else if (Utils.isBookmarksPanel(activePanel)) {
    Bookmarks.collapseAllBookmarks(activePanel.id)
  }
}
</script>
