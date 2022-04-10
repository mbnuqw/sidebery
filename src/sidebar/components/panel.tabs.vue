<template lang="pug">
.TabsPanel(
  @wheel="onWheel"
  @contextmenu.stop="onNavCtxMenu"
  @mousedown="onMouseDown"
  @mouseup.right="onRightMouseUp"
  @dblclick="onDoubleClick"
  @drop="onDrop")
  PinnedTabsBar(v-if="panel.pinnedTabs.length" :panel="panel")
  ScrollBox(ref="scrollBox")
    .container
      TransitionGroup(name="tab" tag="div" type="transition")
        TabComponent(v-for="tab in visibleTabs" :key="tab.id" :tab="tab")
        NewTabBar(
          v-if="Settings.reactive.showNewTabBtns && Settings.reactive.newTabBarPosition === 'after_tabs'"
          :panel="panel")

  NewTabBar(
    v-if="Settings.reactive.showNewTabBtns && Settings.reactive.newTabBarPosition === 'bottom'"
    :panel="panel")

  BookmarksSubPanel(v-if="panel.bookmarksFolderId !== NOID" :tabsPanel="panel")

  PanelPlaceholder(
    :isLoading="!props.panel.ready"
    :isMsg="isNothingFound"
    :msg="translate('panel.nothing_found')")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DropType, MenuType, ScrollBoxComponent, Tab, TabsPanel, ReactiveTab } from 'src/types'
import { NOID } from 'src/defaults'
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
import BookmarksSubPanel from './sub-panel.bookmarks.vue'

const props = defineProps<{ panel: TabsPanel }>()
const scrollBox = ref<ScrollBoxComponent | null>(null)
let scrollBoxEl: HTMLElement | null = null

const visibleTabs = computed<ReactiveTab[]>(() => {
  if (props.panel.filteredTabs) return props.panel.filteredTabs
  return props.panel.tabs.filter(t => !t.invisible)
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
    const la = Settings.reactive.tabsPanelLeftClickAction
    if (la === 'prev') return Sidebar.switchPanel(-1)
    if (la === 'expand') {
      if (!Settings.reactive.tabsTree) return
      let targetTab = Tabs.list.find(t => t.active)
      if (!targetTab) return
      if (!targetTab.isParent) targetTab = Tabs.byId[targetTab.parentId]
      if (!targetTab) return
      return Tabs.toggleBranch(targetTab.id)
    }
    if (la === 'parent') {
      if (!Settings.reactive.tabsTree) return
      const activeTab = Tabs.list.find(t => t.active)
      if (!activeTab || !Tabs.reactive.byId[activeTab.parentId]) return
      browser.tabs.update(activeTab.parentId, { active: true })
    }
  }

  if (e.button === 1) {
    e.preventDefault()
    const ma = Settings.reactive.tabsPanelMiddleClickAction
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
    const ra = Settings.reactive.tabsPanelRightClickAction
    if (ra === 'next') return Sidebar.switchPanel(1)
    if (ra === 'expand') {
      if (!Settings.reactive.tabsTree) return
      let targetTab = Tabs.list.find(t => t.active)
      if (!targetTab) return
      if (!targetTab.isParent) targetTab = Tabs.byId[targetTab.parentId]
      if (!targetTab) return
      return Tabs.toggleBranch(targetTab.id)
    }
    if (ra === 'parent') {
      if (!Settings.reactive.tabsTree) return
      const activeTab = Tabs.list.find(t => t.active)
      if (!activeTab || !Tabs.reactive.byId[activeTab.parentId]) return
      browser.tabs.update(activeTab.parentId, { active: true })
    }
  }
}

function onRightMouseUp(e: MouseEvent): void {
  Mouse.resetTarget()
  if (Mouse.isLocked()) return Mouse.resetClickLock()
  if (Settings.reactive.tabsPanelRightClickAction !== 'menu') return
  if (Selection.isSet()) return
  e.stopPropagation()

  if (Settings.reactive.ctxMenuNative) return

  Selection.selectNavItem(props.panel.id)
  Menu.open(MenuType.TabsPanel, e.clientX, e.clientY)
}

function onNavCtxMenu(e: MouseEvent): void {
  if (
    Mouse.isLocked() ||
    !Settings.reactive.ctxMenuNative ||
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

function onDoubleClick(e: MouseEvent): void {
  if (Settings.reactive.tabsPanelLeftClickAction !== 'none') return
  if (!(e.target as HTMLElement).className) return
  const da = Settings.reactive.tabsPanelDoubleClickAction
  if (da === 'tab') return Tabs.createTabInPanel(props.panel)
  if (da === 'collapse') {
    const panelTabs = props.panel.tabs?.map(rt => Tabs.byId[rt.id] as Tab) ?? []
    if (panelTabs.length) return Tabs.foldAllInactiveBranches(panelTabs)
  }
  if (da === 'undo') Tabs.undoRmTab()
}

function onWheel(e: WheelEvent): void {
  if (Settings.reactive.scrollThroughTabs !== 'none') {
    if (scrollBoxEl && Settings.reactive.scrollThroughTabsExceptOverflow) {
      if (scrollBoxEl.scrollHeight > scrollBoxEl.offsetHeight) return
    }
    e.preventDefault()
    let globaly = (Settings.reactive.scrollThroughTabs === 'global') !== e.shiftKey
    const cyclic = Settings.reactive.scrollThroughTabsCyclic !== e.ctrlKey

    if (e.deltaY > 0) {
      if (Mouse.isWheelBlocked) return
      Tabs.switchTab(globaly, cyclic, 1, false)
    }
    if (e.deltaY < 0) {
      if (Mouse.isWheelBlocked) return
      Tabs.switchTab(globaly, cyclic, -1, false)
    }
  }
}
</script>
