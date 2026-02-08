<template lang="pug">
.NavigationBar(
  id="nav_bar"
  ref="el"
  tabindex="-1"
  :data-overflowed="nav?.inlineOverflowed"
  :data-hidden-panels-bar="Sidebar.reactive.hiddenPanelsPopup"
  :data-layout="layout"
  @drop="onDrop")
  .main-items(@wheel="onNavWheel")
    NavItemComponent(
      v-for="(item, i) in nav?.visibleItems"
      :key="item.id"
      :item="item"
      :inlineIndex="getBtnInlineIndex(i)"
      :dndType="'nav-item'"
      @dragstart="onNavDragStart($event, item)"
      @drop="onNavItemDrop(item)"
      @mousedown="onNavMouseDown($event, item)"
      @mouseup="onNavMouseUp($event, item)"
      @contextmenu="onNavCtxMenu($event, item)")

  .static-btns(v-if="nav?.visibleStaticButtons")
    NavItemComponent(
      v-for="(item, i) in nav.visibleStaticButtons"
      :key="item.id"
      :item="item"
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
      .hidden-panels-popup-content(
        ref="hiddenPanelsPopupScrollEl"
        @mousedown.stop
        @mouseup.stop)
        NavItemComponent(
          v-if="nav?.inlineOverflowed"
          v-for="item in nav?.visibleItems.filter((_, i) => getBtnInlineIndex(i) === -1)"
          :key="item.id"
          :item="item"
          :dndType="'hidden-panel'"
          @dragstart="onNavDragStart($event, item)"
          @drop="onNavItemDrop(item)"
          @mousedown="onNavMouseDown($event, item)"
          @mouseup="onNavMouseUp($event, item, true)"
          @contextmenu="onNavCtxMenu($event, item)")
        NavItemComponent(
          v-for="item in nav?.hiddenPanels"
          :key="item.id"
          :item="item"
          :dndType="'hidden-panel'"
          @dragstart="onNavDragStart($event, item)"
          @drop="onNavItemDrop(item)"
          @mousedown="onNavMouseDown($event, item)"
          @mouseup="onNavMouseUp($event, item, true)"
          @contextmenu="onNavCtxMenu($event, item)")
        NavItemComponent(
          v-for="item in nav?.hiddenStaticButtons"
          :key="item.id"
          :item="item"
          :dndType="'nav-item'"
          @dragstart="onNavDragStart($event, item)"
          @drop="onNavItemDrop(item)"
          @mousedown="onNavMouseDown($event, item)"
          @mouseup="onNavMouseUp($event, item, true)"
          @contextmenu="onNavCtxMenu($event, item)")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type * as T from 'src/types'
import * as D from 'src/defaults'
import * as E from 'src/enums'
import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Windows from 'src/services/windows.fg'
import * as Selection from 'src/services/selection.fg'
import * as Menu from 'src/services/menu.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Search from 'src/services/search.fg'
import * as Snapshots from 'src/services/snapshots.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import * as Popups from 'src/services/popups.fg'
import * as Logs from 'src/services/logs'
import * as Sync from 'src/services/sync.fg'
import NavItemComponent from './nav-item.vue'

const HIDDEN_PANELS_BTN: T.NavBtn = {
  id: 'hidden_panels_btn',
  class: E.NavItemClass.btn,
  type: E.ButtonType.hidden,
  iconSVG: 'icon_expand',
  name: translate('nav.show_hidden_tooltip'),
  tooltip: translate('nav.show_hidden_tooltip'),
}
const MIN_INLINE_STATIC_BTNS_LEN = 1

const ButtonTypes: Record<string, E.ButtonType> = {
  settings: E.ButtonType.settings,
  search: E.ButtonType.search,
  add_tp: E.ButtonType.add_tp,
  hidden: E.ButtonType.hidden,
  collapse: E.ButtonType.collapse,
  create_snapshot: E.ButtonType.create_snapshot,
  remute_audio_tabs: E.ButtonType.remute_audio_tabs,
}

let droppedOnPanel = false

const el = ref<HTMLElement | null>(null)
const hiddenPanelsPopupScrollEl = ref<HTMLElement | null>(null)

const isInline = Settings.state.navBarLayout === 'horizontal' && Settings.state.navBarInline
let layout = 'none'
if (Settings.state.navBarLayout === 'horizontal') {
  layout = Settings.state.navBarInline ? 'inline' : 'wrap'
} else if (Settings.state.navBarLayout === 'vertical') {
  layout = Settings.state.navBarSide
}

interface Nav {
  visibleItems: T.NavItem[]
  hiddenPanels?: T.NavItem[]
  visibleStaticButtons?: T.NavBtn[]
  hiddenStaticButtons?: T.NavBtn[]
  inlineOverflowed?: boolean
  visibleItemsMax?: number
}

const nav = computed<Nav | undefined>(() => {
  const ids = Sidebar.reactive.nav
  if (!ids.length) return

  const nav: Nav = { visibleItems: [] }

  let inlineMax = 0
  let staticHiddenPanelsBtnIndex = -1
  let lastPanelIndex = -1

  for (const id of ids) {
    const panel = Sidebar.panelsById[id]
    if (panel) {
      // Check tab panels
      if (Utils.isTabsPanel(panel)) {
        // Hidden tab-panels
        if (
          panel.reactive.hidden ||
          (Settings.state.hideEmptyPanels && panel.reactive.empty) ||
          (Settings.state.hideDiscardedTabPanels && panel.reactive.allDiscarded)
        ) {
          if (!nav.hiddenPanels) nav.hiddenPanels = []
          nav.hiddenPanels.push(panel)
          continue
        }
      }

      // Check other type panels
      else {
        if (panel.reactive.hidden) {
          if (!nav.hiddenPanels) nav.hiddenPanels = []
          nav.hiddenPanels.push(panel)
          continue
        }
      }

      lastPanelIndex = nav.visibleItems.push(panel) - 1
    } else if (!isInline) {
      const isSpace = (id as string).startsWith('sp-')
      const isDelimiter = (id as string).startsWith('sd-')
      const isSearch = id === 'search'

      if (id === 'hdn') {
        staticHiddenPanelsBtnIndex = nav.visibleItems.length
        continue
      }

      if (isSearch && Settings.state.searchBarMode !== 'dynamic') continue

      if (isSpace) {
        nav.visibleItems.push({ id, class: E.NavItemClass.space, type: E.SpaceType.dynamic })
      } else if (isDelimiter) {
        nav.visibleItems.push({ id, class: E.NavItemClass.space, type: E.SpaceType.static })
      } else {
        const type = ButtonTypes[id]
        if (!type) continue

        const name = translate(`nav.btn_${id}`)

        nav.visibleItems.push({
          id,
          class: E.NavItemClass.btn,
          type,
          name,
          iconSVG: D.BTN_ICONS[id],
        })
      }
    }
  }

  if (!isInline && nav.hiddenPanels?.length) {
    if (staticHiddenPanelsBtnIndex !== -1) {
      nav.visibleItems.splice(staticHiddenPanelsBtnIndex, 0, HIDDEN_PANELS_BTN)
    } else if (lastPanelIndex !== -1) {
      nav.visibleItems.splice(lastPanelIndex + 1, 0, HIDDEN_PANELS_BTN)
    } else nav.visibleItems.push(HIDDEN_PANELS_BTN)
  }

  // Inline layout
  if (isInline) {
    const horNavWidth = Sidebar.reactive.horNavWidth
    const navBtnWidth = Sidebar.reactive.navBtnWidth
    const navBtnMargin = Sidebar.reactive.navBtnMargin

    nav.visibleStaticButtons = []
    nav.hiddenStaticButtons = []

    // Calc max count of all elements
    const availableWidth = horNavWidth - navBtnMargin
    inlineMax = ~~(availableWidth / (navBtnWidth + navBtnMargin))

    // Get static buttons
    const hasHiddenPanels = !!nav.hiddenPanels?.length
    const visLen = nav.visibleItems.length
    let max = inlineMax - visLen
    if (hasHiddenPanels) max--
    if (max < MIN_INLINE_STATIC_BTNS_LEN) max = MIN_INLINE_STATIC_BTNS_LEN
    for (let i = ids.length; i--; ) {
      const id = ids[i]

      if (
        id === 'settings' ||
        id === 'search' ||
        id === 'add_tp' ||
        id === 'collapse' ||
        id === 'create_snapshot' ||
        id === 'remute_audio_tabs'
      ) {
        if (nav.hiddenPanels?.find(ni => ni.id === id)) continue

        const name = translate(`nav.btn_${id}`)
        const type = ButtonTypes[id]
        if (!type) continue

        const btn = { id, class: E.NavItemClass.btn, type, iconSVG: D.BTN_ICONS[id], name }
        if (nav.visibleStaticButtons.length < max) nav.visibleStaticButtons.unshift(btn)
        else nav.hiddenStaticButtons.unshift(btn)
      }
    }

    if (hasHiddenPanels || nav.hiddenStaticButtons.length) {
      nav.visibleStaticButtons.unshift(HIDDEN_PANELS_BTN)
    }

    // Calc max count of visible panels
    nav.visibleItemsMax = inlineMax - nav.visibleStaticButtons.length

    // Check if visible items are overflowed
    let spLen = 0
    for (const item of nav.visibleItems) {
      if (Utils.isNavSpace(item)) spLen++
    }
    nav.inlineOverflowed = nav.visibleItems.length - spLen >= nav.visibleItemsMax
  }

  return nav
})

watch(
  () => nav.value?.hiddenPanels?.length,
  newHiddenLen => {
    if (!newHiddenLen && Sidebar.reactive.hiddenPanelsPopup) {
      Sidebar.reactive.hiddenPanelsPopup = false
    }
  }
)

onMounted(() => {
  if (el.value && Settings.state.navBarLayout === 'horizontal') {
    Sidebar.registerHorizontalNavBarEl(el.value)
    Sidebar.reactive.horNavWidth = el.value.offsetWidth
  }
  Sidebar.setSelectPanelFn(selectPanel)
  Sidebar.setScrollHiddenPanelsPopupToFn(scrollHiddenPanelsPopupTo)
})

function selectPanel(dir: 1 | -1) {
  if (Settings.state.navBarLayout === 'hidden') return
  if (!nav.value) return

  let selPanelId: ID | undefined
  if (Selection.isNavItem()) {
    const firstSelId = Selection.ids()[0]
    if (Sidebar.panelsById[firstSelId]) selPanelId = firstSelId
  }
  if (selPanelId === undefined || !Sidebar.panelsById[selPanelId]) {
    selPanelId = Sidebar.activePanelId
  }

  const selectedPanel: T.Panel | undefined = Sidebar.panelsById[selPanelId]
  if (!selectedPanel) return

  Menu.close()
  Selection.resetSelection()

  // Get list of visible and hidden elements
  const list: { id: ID; hidden: boolean }[] = []
  const overflowed: { id: ID; hidden: boolean }[] = []
  const isOverflowedInline = isInline && !!nav.value.inlineOverflowed
  const visLength = nav.value.visibleItems.length
  let hiddenPanelsAdded = false
  for (let el, i = 0; i < visLength; i++) {
    el = nav.value.visibleItems[i]
    if (el.id === 'hidden_panels_btn' && nav.value.hiddenPanels) {
      nav.value.hiddenPanels.forEach(hel => list.push({ id: hel.id, hidden: true }))
      hiddenPanelsAdded = true
      continue
    }
    if (el.class !== E.NavItemClass.panel) continue
    if (isOverflowedInline && getBtnInlineIndex(i) === -1) {
      overflowed.push({ id: el.id, hidden: true })
    } else {
      list.push({ id: el.id, hidden: false })
    }
  }
  overflowed.forEach(oel => list.push({ id: oel.id, hidden: true }))
  if (!hiddenPanelsAdded && nav.value.hiddenPanels) {
    nav.value.hiddenPanels.forEach(hel => list.push({ id: hel.id, hidden: true }))
  }

  // Find the next selected element
  let currentSelElIsHidden = false
  let afterSel = false
  let nextBtn = findNext(list, dir, btn => {
    if (afterSel) return true
    if (btn.id === selPanelId) {
      if (btn.hidden && !currentSelElIsHidden) currentSelElIsHidden = true
      afterSel = true
    }
  })

  // Open/Close hidden panels popup
  const hppIsOpen = Sidebar.reactive.hiddenPanelsPopup
  const btnToSelHidden = nextBtn ? nextBtn.hidden : currentSelElIsHidden
  if (btnToSelHidden && !hppIsOpen) Sidebar.openHiddenPanelsPopup()
  else if (!btnToSelHidden && hppIsOpen) Sidebar.reactive.hiddenPanelsPopup = false

  // Select btn
  const btnIdToSel = nextBtn?.id ?? selPanelId
  Selection.selectNavItem(btnIdToSel)

  // Scroll to selected btn
  scrollHiddenPanelsPopupTo(btnIdToSel)
}

function findNext<T>(arr: T[], dir: 1 | -1, pre: (v: T) => boolean | undefined): T | undefined {
  if (dir === 1) return arr.find(pre)
  else return arr.findLast(pre)
}

const PRE_SCROLL = 1
const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
async function scrollHiddenPanelsPopupTo(id: ID) {
  const justOpen = !hiddenPanelsPopupScrollEl.value

  await nextTick()

  if (!hiddenPanelsPopupScrollEl.value) return

  const scrollEl = hiddenPanelsPopupScrollEl.value
  const btnId = 'nav' + id
  const btnEl = document.querySelector('.hidden-panels-popup-content #' + btnId)
  // const btnEl = document.getElementById(btnId)
  if (!btnEl || !(btnEl instanceof HTMLElement)) return

  const pH = scrollEl.offsetHeight
  const pS = scrollEl.scrollTop
  const tH = btnEl.offsetHeight
  const tY = btnEl.offsetTop

  if (justOpen) scrollConf.behavior = 'instant'
  else scrollConf.behavior = 'smooth'

  if (tY < pS + PRE_SCROLL) {
    if (pS > 0) {
      let y = tY - PRE_SCROLL
      if (y < 0) y = 0
      scrollConf.top = y
      scrollEl.scroll(scrollConf)
    }
  } else if (tY + tH > pS + pH - PRE_SCROLL) {
    scrollConf.top = tY + tH - pH + PRE_SCROLL
    scrollEl.scroll(scrollConf)
  }
}

function getBtnInlineIndex(index: number): number {
  if (!isInline) return -1

  const visMax = nav.value?.visibleItemsMax
  if (!visMax) return -1

  const visItems = nav.value?.visibleItems
  const activePanelId = Sidebar.reactive.activePanelId
  let activeIndex = visItems.findIndex(btn => btn.id === activePanelId)
  if (activeIndex === -1) activeIndex = 0
  const halfCap = Math.floor(visMax / 2)
  let len = visItems?.length ?? 0

  if (visMax >= len) return index
  if (halfCap > activeIndex && index < visMax) return index
  if (activeIndex + halfCap >= len) {
    if (index < len - visMax) return -1
    return index - (len - visMax)
  }

  index -= activeIndex - halfCap
  if (!(visMax % 2)) index--
  if (index >= 0 && index < visMax) return index
  else return -1
}

const onNavWheel = Mouse.getWheelDebouncer(E.WheelDirection.Vertical, (e: WheelEvent) => {
  if (Settings.state.navSwitchPanelsWheel) {
    if (e.deltaY > 0) return Sidebar.switchPanel(1, true)
    if (e.deltaY < 0) return Sidebar.switchPanel(-1, true)
  }
})

function onDrop(e: DragEvent): void {
  if (!droppedOnPanel) DnD.reactive.dstType = E.DropType.Nowhere
  droppedOnPanel = false
}

/**
 * Handle context menu event
 */
function onNavCtxMenu(e: MouseEvent, item: T.NavItem) {
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

  let type: E.MenuType
  if (panel.type === E.PanelType.bookmarks) type = E.MenuType.BookmarksPanel
  else if (panel.type === E.PanelType.tabs) type = E.MenuType.TabsPanel
  else type = E.MenuType.Panel

  if (!Selection.isSet()) Selection.selectNavItem(panel.id)
  Menu.open(type)
}

async function onNavMouseDown(e: MouseEvent, item: T.NavItem) {
  if (Utils.isNavSpace(item)) return Mouse.resetTarget()
  Mouse.setTarget('nav', item.id)
  Menu.close()
  Selection.resetSelection()

  // Middle click action
  if (e.button === 1) {
    if (item.type === E.PanelType.tabs) {
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

      // Remove tabs and remove panel
      if (Settings.state.navTabsPanelMidClickAction === 'rm_rmp') {
        Sidebar.removePanel(panel.id, { tabsMode: 'close' })
      }

      // Hide panel
      if (Settings.state.navTabsPanelMidClickAction === 'hide') {
        Sidebar.hidePanel(panel.id)
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
        const ids: ID[] = []
        panel.pinnedTabs.forEach(t => ids.push(t.id))
        panel.tabs.forEach(t => ids.push(t.id))
        if (ids.length) Tabs.discardTabs(ids)
      }

      // Save panel to bookmarks
      if (Settings.state.navTabsPanelMidClickAction === 'bookmark') {
        Sidebar.bookmarkTabsPanel(panel.id, true)
      }

      // Save panel to bookmarks and remove panel
      if (Settings.state.navTabsPanelMidClickAction === 'bkm_rmp') {
        await Sidebar.bookmarkTabsPanel(panel.id, true, true)
        Sidebar.removePanel(panel.id, { tabsMode: 'close' })
      }

      // Convert tabs panel to bookmarks panel
      if (Settings.state.navTabsPanelMidClickAction === 'convert') {
        Sidebar.convertToBookmarksPanel(panel)
      }

      // Convert tabs panel to bookmarks panel and hide
      if (Settings.state.navTabsPanelMidClickAction === 'conv_hide') {
        const bookmarksPanel = await Sidebar.convertToBookmarksPanel(panel)
        if (bookmarksPanel) Sidebar.hidePanel(bookmarksPanel.id)
      }
    }

    if (item.type === E.PanelType.bookmarks) {
      const panel = Sidebar.panelsById[item.id]
      if (!Utils.isBookmarksPanel(panel)) return

      // Convert bookmarks panel to tabs panel
      if (Settings.state.navBookmarksPanelMidClickAction === 'convert') {
        const panelId = await Sidebar.convertToTabsPanel(panel, true)
        const tabsPanel = Sidebar.panelsById[panelId]
        if (tabsPanel?.hidden) Sidebar.showPanel(panelId)
      }
    }

    // TODO: tmp shit, remove/update later
    if (item.type === E.PanelType.sync) {
      Sync.openSyncPopup()
    }

    if (item.type === E.ButtonType.create_snapshot) SetupPage.open('snapshots')

    if (item.type === E.ButtonType.remute_audio_tabs) {
      const pausedTabs: T.Tab[] = []
      const audibleTabs: T.Tab[] = []
      for (const tab of Tabs.list) {
        if (tab.mediaPaused) pausedTabs.push(tab)
        else if (tab.audible) audibleTabs.push(tab)
      }

      if (audibleTabs.length) Tabs.pauseAllAudibleTabsMedia()
      else if (pausedTabs.length === 1) Tabs.playAllPausedTabsMedia()
    }

    if (item.type === E.ButtonType.collapse) collapseAll()

    if (item.type === E.ButtonType.add_tp) addTabsPanel(true)
  }
}

function onNavMouseUp(e: MouseEvent, item: T.NavItem, inHiddenBar?: boolean) {
  if (Utils.isNavSpace(item)) return
  if (!Mouse.isTarget('nav', item.id)) return

  const isTabs = item.type === E.PanelType.tabs
  const isBookmarks = item.type === E.PanelType.bookmarks
  const isHiddenPanels = item.type === E.ButtonType.hidden
  const isSettings = item.type === E.ButtonType.settings
  const isSearch = item.type === E.ButtonType.search
  const isCreateSnapshot = item.type === E.ButtonType.create_snapshot
  const isRemuteAudioTabs = item.type === E.ButtonType.remute_audio_tabs
  const isAddTP = item.type === E.ButtonType.add_tp
  const panel = Sidebar.panelsById[item.id]

  // Left
  if (e.button === 0) {
    const isSwitchingPanel = !!panel && Sidebar.activePanelId !== item.id

    if (isHiddenPanels) {
      if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.closeHiddenPanelsPopup()
      else Sidebar.openHiddenPanelsPopup()
      return
    }
    if (inHiddenBar) Sidebar.closeHiddenPanelsPopup(isSwitchingPanel)
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
    if (item.type === E.ButtonType.collapse) collapseAll()

    if (isSwitchingPanel) {
      if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false
      return Sidebar.switchToPanel(item.id)
    }
    if (isBookmarks) {
      if (Settings.state.navActBookmarksPanelLeftClickAction === 'scroll') {
        return Sidebar.scrollPanelToEdge()
      }
    }
    if (isTabs && panel) {
      if (Settings.state.navActTabsPanelLeftClickAction === 'new_tab') {
        return Tabs.createTabInPanel(panel, {
          position: Settings.state.navActTabsPanelLeftClickTabPos,
        })
      } else if (Settings.state.navActTabsPanelLeftClickAction === 'scroll') {
        return Sidebar.scrollPanelToEdge()
      }
    }
    if (item.type === E.PanelType.sync) {
      Sync.reload()
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

    let type: E.MenuType
    if (item.type === E.PanelType.bookmarks) type = E.MenuType.BookmarksPanel
    else if (item.type === E.PanelType.tabs) type = E.MenuType.TabsPanel
    else type = E.MenuType.Panel

    Selection.selectNavItem(item.id)
    Menu.open(type, e.clientX, e.clientY)
  }
}

function onNavDragStart(e: DragEvent, item: T.NavItem) {
  Menu.close()
  Selection.resetSelection()

  const panel = Sidebar.panelsById[item.id]
  const isTabsPanel = Utils.isTabsPanel(panel)
  const isBookmarksPanel = Utils.isBookmarksPanel(panel)

  let dndType: E.DragType
  if (isTabsPanel) dndType = E.DragType.TabsPanel
  else if (isBookmarksPanel) dndType = E.DragType.BookmarksPanel
  else dndType = E.DragType.NavItem

  if (isTabsPanel || isBookmarksPanel) Sidebar.updateBounds()
  Selection.selectNavItem(item.id)

  const contentList = []
  const dragItems: T.DragItem[] = []
  const dragInfo: T.DragInfo = {
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
    for (const tab of panel.tabs) {
      contentList.push(tab.title)
      contentList.push(tab.url)
      contentList.push('')
      dragItems.push({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        parentId: tab.parentId,
        container: tab.cookieStoreId,
        customColor: tab.customColor,
        customTitle: tab.customTitle,
        folded: tab.folded,
      })
    }
  } else {
    dragItems.push({ id: item.id })
  }

  DnD.broadcastDragInfo(dragInfo)
  DnD.start(dragInfo, E.DropType.NavItem)

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

function onNavItemDrop(item: T.NavItem): void {
  droppedOnPanel = true
}

async function addTabsPanel(silent?: boolean): Promise<void> {
  // Find target index
  let index = Sidebar.reactive.nav.findLastIndex(id => {
    const panel = Sidebar.panelsById[id]
    return Utils.isTabsPanel(panel)
  })
  if (index !== -1) index++
  if (index === -1) index = Sidebar.reactive.nav.indexOf('add_tp')
  if (index === -1) index = 0

  // Start panel creation
  let panel
  if (!silent) {
    const result = await Popups.openPanelPopup({ type: E.PanelType.tabs }, index)
    if (!result) return

    panel = Sidebar.panelsById[result]
  } else {
    const name = Sidebar.getPanelAutoName(E.PanelType.tabs)
    panel = Sidebar.createTabsPanel({ name, color: Utils.getRandomFrom(D.COLOR_NAMES) })
    Sidebar.addPanel(index, panel)
    Sidebar.recalcPanels()
    Sidebar.recalcTabsPanels()
    Sidebar.saveSidebar(300)
  }

  if (!panel) return

  Sidebar.activatePanel(panel.id)

  if (!Tabs.ready) await Tabs.load()

  Tabs.createTabInPanel(panel)
}

function collapseAll(): void {
  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!activePanel) return

  // Tabs
  if (Utils.isTabsPanel(activePanel)) {
    const tabs: T.Tab[] = []
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
