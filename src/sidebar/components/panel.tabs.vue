<template lang="pug">
.TabsPanel(
  @wheel="onWheel"
  @contextmenu.stop="onNavCtxMenu"
  @mousedown="onMouseDown"
  @mouseup.right="onRightMouseUp"
  @mouseleave="onMouseLeave"
  @dblclick="onDoubleClick"
  @drop="onDrop")
  PinnedTabsBar(v-if="panel.reactive.pinnedTabs.length" :panel="panel")
  ScrollBox(ref="scrollBox" :preScroll="PRE_SCROLL")
    DragAndDropPointer(:panelId="panel.id" :subPanel="false")
    .container(v-if="Settings.state.animations")
      TransitionGroup(name="tab" tag="div" type="transition" class="transition-box")
        TabComponent(
          v-for="tab in visibleTabs"
          :key="tab.id"
          :tab="tab")
        NewTabBar(
          v-if="Settings.state.showNewTabBtns && Settings.state.newTabBarPosition === 'after_tabs'"
          :panel="panel")
        .tab-space-filler(v-for="i in panel.reactive.scrollRetainer" :key="'tsf' + i")
        .bottom-space(:key="-9999999")
    .container(v-else)
      TabComponent(
        v-for="tab in visibleTabs"
        :key="tab.id"
        :tab="tab")
      NewTabBar(
        v-if="Settings.state.showNewTabBtns && Settings.state.newTabBarPosition === 'after_tabs'"
        :panel="panel")
      .tab-space-filler(v-for="i in panel.reactive.scrollRetainer" :key="'tsf' + i")
      .bottom-space(:key="-9999999")

  NewTabBar(
    v-if="Settings.state.showNewTabBtns && Settings.state.newTabBarPosition === 'bottom'"
    :panel="panel")

  .bottom-bar-space(v-if="Settings.state.subPanelRecentlyClosedBar || Settings.state.subPanelBookmarks")

  PanelPlaceholder(
    :isLoading="!panel.reactive.ready"
    :isMsg="isNothingFound"
    :msg="translate('panel.nothing_found')")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DropType, MenuType, ScrollBoxComponent, Tab, TabsPanel, ReactiveTab } from 'src/types'
import { WheelDirection } from 'src/types'
import { PRE_SCROLL } from 'src/defaults'
import { Settings } from 'src/services/settings'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import PinnedTabsBar from './bar.pinned-tabs.vue'
import ScrollBox from 'src/components/scroll-box.vue'
import TabComponent from './tab.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import NewTabBar from './bar.new-tab.vue'
import DragAndDropPointer from './dnd-pointer.vue'

const props = defineProps<{ panel: TabsPanel }>()
const scrollBox = ref<ScrollBoxComponent | null>(null)
let scrollBoxEl: HTMLElement | null = null

const visibleTabs = computed<ReactiveTab[]>(() => {
  if (props.panel.reactive.filteredTabs) return props.panel.reactive.filteredTabs
  return props.panel.reactive.tabs.filter(t => !t.invisible)
})
const isNothingFound = computed<boolean>(() => {
  return !!props.panel.filteredTabs && !props.panel.filteredTabs.length
})

onMounted(() => {
  if (scrollBox.value) {
    Sidebar.setPanelScrollBox(props.panel.id, scrollBox.value)
    scrollBoxEl = scrollBox.value.getScrollBox()
    if (scrollBoxEl) Sidebar.setPanelEls(props.panel.id, { scrollBox: scrollBoxEl })
  }
})

function onDrop(): void {
  DnD.reactive.dstType = DropType.Tabs
}

function onMouseDown(e: MouseEvent): void {
  Mouse.setTarget('panel', props.panel.id)
  if ((e.target as HTMLElement).draggable) return
  if (Selection.isSet()) return

  if (e.button === 0) {
    const la = Settings.state.tabsPanelLeftClickAction
    if (la === 'prev') return Sidebar.switchPanel(-1)
    if (la === 'expand') {
      if (!Settings.state.tabsTree) return
      let targetTab = Tabs.list.find(t => t.active)
      if (!targetTab) return
      if (!targetTab.isParent) targetTab = Tabs.byId[targetTab.parentId]
      if (!targetTab) return
      return Tabs.toggleBranch(targetTab.id)
    }
    if (la === 'parent') {
      if (!Settings.state.tabsTree) return
      const activeTab = Tabs.list.find(t => t.active)
      if (!activeTab || !Tabs.reactive.byId[activeTab.parentId]) return
      browser.tabs.update(activeTab.parentId, { active: true })
    }
  }

  if (e.button === 1) {
    e.preventDefault()
    const ma = Settings.state.tabsPanelMiddleClickAction
    if (ma === 'tab') Tabs.createTabInPanel(props.panel)
    if (ma === 'undo') Tabs.undoRmTab()
    if (ma === 'rm_act_tab') {
      let actTab = Tabs.byId[Tabs.activeId]
      if (actTab && actTab.panelId === props.panel.id && !actTab.pinned) {
        Tabs.removeTabs([Tabs.activeId])
      }
    }
  }

  if (e.button === 2) {
    Menu.blockCtxMenu()
    const ra = Settings.state.tabsPanelRightClickAction
    if (ra === 'next') return Sidebar.switchPanel(1)
    if (ra === 'expand') {
      if (!Settings.state.tabsTree) return
      let targetTab = Tabs.list.find(t => t.active)
      if (!targetTab) return
      if (!targetTab.isParent) targetTab = Tabs.byId[targetTab.parentId]
      if (!targetTab) return
      return Tabs.toggleBranch(targetTab.id)
    }
    if (ra === 'parent') {
      if (!Settings.state.tabsTree) return
      const activeTab = Tabs.list.find(t => t.active)
      if (!activeTab || !Tabs.reactive.byId[activeTab.parentId]) return
      browser.tabs.update(activeTab.parentId, { active: true })
    }
  }
}

function onRightMouseUp(e: MouseEvent): void {
  Mouse.resetTarget()
  if (Mouse.isLocked()) return Mouse.resetClickLock()
  if (Settings.state.tabsPanelRightClickAction !== 'menu') return
  if (Selection.isSet()) return
  e.stopPropagation()

  if (Settings.state.ctxMenuNative) return

  Selection.selectNavItem(props.panel.id)
  Menu.open(MenuType.TabsPanel, e.clientX, e.clientY)
}

function onNavCtxMenu(e: MouseEvent): void {
  if (
    Mouse.isLocked() ||
    !Settings.state.ctxMenuNative ||
    e.ctrlKey ||
    e.shiftKey ||
    Selection.isSet()
  ) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }

  let nativeCtx = { showDefaults: false }
  browser.menus.overrideContext(nativeCtx)

  if (!Selection.isSet()) Selection.selectNavItem(props.panel.id)
  Menu.open(MenuType.TabsPanel)
}

function onDoubleClick(e: MouseEvent) {
  if (!Mouse.isTarget('panel', props.panel.id)) return
  if (Settings.state.tabsPanelLeftClickAction !== 'none') return
  const da = Settings.state.tabsPanelDoubleClickAction
  if (da === 'tab') return Tabs.createTabInPanel(props.panel)
  if (da === 'collapse') {
    const tabs: Tab[] = []
    for (const rTab of props.panel.tabs) {
      const tab = Tabs.byId[rTab.id]
      if (tab && tab.lvl === 0) tabs.push(tab)
    }
    if (tabs.length) return Tabs.foldAllInactiveBranches(tabs)
  }
  if (da === 'undo') Tabs.undoRmTab()
}

const onWheel = Mouse.getWheelDebouncer(WheelDirection.Vertical, (e: WheelEvent) => {
  if (Tabs.blockedScrollPosition) Tabs.resetScrollRetainer(props.panel)
  if (Sidebar.scrollAreaRightX && e.clientX > Sidebar.scrollAreaRightX) return
  if (Sidebar.scrollAreaLeftX && e.clientX < Sidebar.scrollAreaLeftX) return
  if (Selection.isSet()) return
  if (Settings.state.scrollThroughTabs !== 'none') {
    if (scrollBoxEl && Settings.state.scrollThroughTabsExceptOverflow) {
      if (scrollBoxEl.scrollHeight > scrollBoxEl.offsetHeight) return
    }
    e.preventDefault()
    let globaly = (Settings.state.scrollThroughTabs === 'global') !== e.shiftKey
    const cyclic = Settings.state.scrollThroughTabsCyclic !== e.ctrlKey

    if (e.deltaY !== 0) Mouse.blockWheel(WheelDirection.Horizontal)
    if (e.deltaY > 0) Tabs.switchTab(globaly, cyclic, 1, false)
    if (e.deltaY < 0) Tabs.switchTab(globaly, cyclic, -1, false)
  }
})

function onMouseLeave() {
  if (Tabs.blockedScrollPosition) Tabs.resetScrollRetainer(props.panel)
}
</script>
