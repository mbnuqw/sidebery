<template lang="pug">
.Tab(
  :id="'tab' + tab.id"
  :data-pin="isPinned"
  :data-active="tab.active"
  :data-loading="loading"
  :data-pending="tab.status === TabStatus.Pending"
  :data-selected="tab.sel"
  :data-audible="tab.mediaAudible"
  :data-muted="tab.mediaMuted"
  :data-paused="tab.mediaPaused"
  :data-discarded="tab.discarded"
  :data-updated="tab.updated"
  :data-lvl="tab.lvl"
  :data-parent="tab.isParent"
  :data-folded="tab.folded && !Search.reactive.value"
  :data-invisible="tab.invisible && !Search.reactive.value"
  :data-color="color"
  :data-unread="tab.unread"
  :title="tooltip"
  @contextmenu.stop="onCtxMenu"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @dblclick.prevent.stop="onDoubleClick"): .body
  //- I can try to completely remove next line (with .complete-fx)
  //- and use .dnd-layer:before or some linear-gradient animation on .body
  Transition(name="tab-complete")
    .complete-fx(v-if="tab.status === TabStatus.Loading && Settings.reactive.animations")
  .dnd-layer(draggable="true" data-dnd-type="tab" :data-dnd-id="tab.id" @dragstart="onDragStart" @dragenter="")
  Transition(name="tab-part")
    .audio(
      v-if="tab.mediaAudible || tab.mediaMuted || tab.mediaPaused"
      @mousedown.stop="onAudioMouseDown($event, tab)")
      svg.-loud: use(xlink:href="#icon_loud_badge")
      svg.-mute: use(xlink:href="#icon_mute_badge")
      svg.-pause: use(xlink:href="#icon_pause_12")
  .fav(@dragstart.stop.prevent)
    Transition(name="tab-part"): svg.fav-icon(v-if="!tab.favIconUrl"): use(:xlink:href="favPlaceholder")
    Transition(name="tab-part"): img.fav-icon(v-if="tab.favIconUrl" :src="tab.favIconUrl" @error="onError")
    .exp(
      v-if="tab.isParent"
      @dblclick.prevent.stop
      @mousedown.stop="onExpandMouseDown"
      @mouseup.left.stop)
      svg: use(xlink:href="#icon_expand")
    .badge
    Transition(name="tab-part"): .progress-spinner(v-if="loading === true")
    .child-count(v-if="tab.folded && tab.branchLen") {{tab.branchLen}}
  .close(
    v-if="Settings.reactive.showTabRmBtn && !isPinned"
    @mousedown.stop="onMouseDownClose"
    @mouseup.stop
    @contextmenu.stop.prevent)
    svg: use(xlink:href="#icon_remove")
  .ctx(v-if="color")
  .t-box(v-if="withTitle"): .title {{tab.title}}
</template>

<script lang="ts" setup>
import { computed, nextTick } from 'vue'
import { DragInfo, DragItem, DragType, DropType, MenuType, ReactiveTab } from 'src/types'
import { TabStatus } from 'src/types'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Containers } from 'src/services/containers'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import { Search } from 'src/services/search'
import { Favicons } from 'src/services/favicons'

const props = defineProps<{ tab: ReactiveTab }>()

const loading = computed((): boolean | 'ok' | 'err' => {
  if (props.tab.status === TabStatus.Loading) return true
  if (props.tab.status === TabStatus.Ok) return 'ok'
  if (props.tab.status === TabStatus.Err) return 'err'
  return false
})
const color = computed((): boolean | string => {
  const container = Containers.reactive.byId[props.tab.cookieStoreId]
  if (container) return container.color
  return false
})
const tooltip = computed((): string => {
  try {
    return `${props.tab.title}\n${decodeURI(props.tab.url)}`
  } catch (err) {
    return `${props.tab.title}\n${props.tab.url}`
  }
})
const favPlaceholder = computed((): string => {
  if (props.tab.warn) return '#icon_warn'
  return Favicons.getFavPlaceholder(props.tab.url)
})
const withTitle = computed((): boolean => {
  if (!props.tab.pinned) return true
  return Settings.reactive.pinnedTabsPosition === 'panel' && Settings.reactive.pinnedTabsList
})
const isPinned = computed<boolean>(() => {
  if (!props.tab.pinned) return false
  if (Settings.reactive.pinnedTabsList && Settings.reactive.pinnedTabsPosition === 'panel') {
    return false
  }
  return true
})

let closeLock = false
function onMouseDownClose(e: MouseEvent): void {
  if (closeLock) return
  Mouse.setTarget('tab.close', props.tab.id)
  if (e.button === 0) {
    Tabs.removeTabs([props.tab.id])
    closeLock = true
  }
  if (e.button === 1) {
    if (Settings.reactive.tabCloseMiddleClick === 'close') {
      Tabs.removeTabs([props.tab.id])
      closeLock = true
    } else if (Settings.reactive.tabCloseMiddleClick === 'discard') {
      Tabs.discardTabs([props.tab.id])
    }
  }
  if (e.button === 2) {
    Tabs.removeBranches([props.tab.id])
    closeLock = true
  }
}

function onMouseDown(e: MouseEvent): void {
  Mouse.setTarget('tab', props.tab.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!props.tab.sel) Selection.selectTab(props.tab.id)
      else Selection.deselectTab(props.tab.id)
      return
    }

    if (e.shiftKey) {
      if (Settings.reactive.shiftSelAct && !Selection.isSet()) {
        Selection.selectTab(Tabs.activeId)
      }
      const tab = Tabs.byId[props.tab.id]
      if (!Selection.isSet()) Selection.selectTab(props.tab.id)
      else if (tab) Selection.selectTabsRange(tab)
      e.preventDefault()
      return
    }

    if (Selection.isSet() && !props.tab.sel) Selection.resetSelection()

    if (!Selection.isSet() && !Settings.reactive.activateOnMouseUp) activate()

    Mouse.startLongClick(e, 'tab', props.tab.id, longClickFeedback)
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    Tabs.removeTabs([props.tab.id])
    Mouse.blockWheel()
    Selection.resetSelection()
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.reactive.ctxMenuNative && !props.tab.sel) {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, props.tab.id)
    }
    Mouse.startLongClick(e, 'tab', props.tab.id, longClickFeedback)
  }
}

function longClickFeedback(): void {
  props.tab.status = TabStatus.Loading
  nextTick(() => {
    props.tab.status = TabStatus.Complete
  })
}

function onMouseUp(e: MouseEvent): void {
  const sameTarget = Mouse.isTarget('tab', props.tab.id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (Mouse.isLocked()) return Mouse.resetClickLock(120)
  if (Mouse.longClickApplied) return

  if (e.button === 0) {
    const withoutMods = !e.ctrlKey && !e.shiftKey
    if (withoutMods && sameTarget) Selection.resetSelection()
    if (Settings.reactive.activateOnMouseUp && withoutMods && sameTarget) activate()
  } else if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    Mouse.stopMultiSelection()
    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.reactive.ctxMenuNative) select()
    if (!Settings.reactive.ctxMenuNative) Menu.open(MenuType.Tabs, e.clientX, e.clientY)
  }
}

function onCtxMenu(e: MouseEvent): void {
  if (
    Mouse.isLocked() ||
    !Settings.reactive.ctxMenuNative ||
    e.ctrlKey ||
    e.shiftKey ||
    Mouse.longClickApplied
  ) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !props.tab.sel) {
    Selection.resetSelection()
  }

  if (Menu.isBlocked()) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  browser.menus.overrideContext({ context: 'tab', tabId: props.tab.id })

  if (!Selection.isSet()) select()

  Menu.open(MenuType.Tabs)

  Mouse.stopLongClick()
}

function onDoubleClick(): void {
  const dc = Settings.reactive.tabDoubleClick
  if (dc === 'reload') Tabs.reloadTabs([props.tab.id])
  if (dc === 'duplicate') Tabs.duplicateTabs([props.tab.id])
  if (dc === 'pin') Tabs.repinTabs([props.tab.id])
  if (dc === 'mute') Tabs.remuteTabs([props.tab.id])
  if (dc === 'clear_cookies') Tabs.clearTabsCookies([props.tab.id])
  if (dc === 'exp' && props.tab.isParent) Tabs.toggleBranch(props.tab.id)
  if (dc === 'new_after') Tabs.createTabAfter(props.tab.id)
  if (dc === 'new_child' && !props.tab.pinned) Tabs.createChildTab(props.tab.id)
  if (dc === 'close') Tabs.removeTabs([props.tab.id])
}

function onDragStart(e: DragEvent): void {
  if (Mouse.isLocked()) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }
  Menu.close()
  const tab = Tabs.byId[props.tab.id]
  if (!tab) return
  if (!Selection.isSet()) Selection.selectTabsBranch(tab)
  Mouse.stopLongClick()
  Sidebar.updateBounds()

  // Check what to drag
  const toDrag = [props.tab.id]
  const dragItems: DragItem[] = []
  const pinned = props.tab.pinned
  const uriList = []
  const links = []
  const urlTitleList = []
  for (const tab of Tabs.list) {
    const inBranch = Settings.reactive.tabsTree && !pinned && toDrag.includes(tab.parentId)
    if (inBranch || Selection.includes(tab.id)) {
      uriList.push(tab.url)
      links.push(`<a href="${tab.url}>${tab.title}</a>`)
      urlTitleList.push(tab.url)
      urlTitleList.push(tab.title)
      toDrag.push(tab.id)
      dragItems.push({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        parentId: tab.parentId,
        container: tab.cookieStoreId,
      })
    }
  }

  const dragInfo: DragInfo = {
    type: DragType.Tabs,
    items: dragItems,
    windowId: Windows.id,
    incognito: Windows.incognito,
    panelId: tab.panelId,
    pinnedTabs: pinned,
    x: e.clientX,
    y: e.clientY,
  }

  DnD.start(dragInfo, DropType.Tabs)

  // Set native drag info
  if (e.dataTransfer) {
    const dragImgEl = document.getElementById('drag_image')
    const uris = uriList.join('\r\n')
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    e.dataTransfer.setData('text/x-moz-url', urlTitleList.join('\r\n'))
    e.dataTransfer.setData('text/uri-list', uris)
    e.dataTransfer.setData('text/plain', uris)
    e.dataTransfer.setData('text/html', links.join('\r\n'))
    if (dragImgEl) e.dataTransfer.setDragImage(dragImgEl, -3, -3)
    e.dataTransfer.effectAllowed = 'copyMove'
  }
}

function onAudioMouseDown(e: MouseEvent, rTab: ReactiveTab): void {
  if (e.button === 0) {
    if (!rTab.mediaPaused) Tabs.remuteTabs([rTab.id])
    else Tabs.playTabMedia(rTab.id)
  }

  if (e.button === 1) {
    if (!rTab.mediaPaused) Tabs.pauseTabMedia(rTab.id)
    else {
      const tab = Tabs.byId[props.tab.id]
      if (tab) {
        tab.mediaPaused = false
        rTab.mediaPaused = false
      }
    }
  }
}

/**
 * Select this tab
 */
function select(): void {
  const tab = Tabs.byId[props.tab.id]
  if (!tab) return
  if (!tab.pinned && tab.isParent && tab.folded) {
    Selection.selectTabsBranch(tab)
  } else {
    Selection.selectTab(tab.id)
  }
}

function activate(): void {
  if (Mouse.longClickApplied) return

  if (Search.reactive.rawValue) {
    Search.stop()
    Selection.resetSelection()
  }

  if (props.tab.id !== Tabs.activeId) browser.tabs.update(props.tab.id, { active: true })
  else if (Settings.reactive.tabsSecondClickActPrev) {
    const history = Tabs.getActiveTabsHistory()
    const prevTabId = history.actTabs[history.actTabs.length - 1]
    if (prevTabId !== undefined) browser.tabs.update(prevTabId, { active: true })
  }
}

function onExpandMouseDown(e: MouseEvent): void {
  Mouse.setTarget('tab.expand', props.tab.id)

  // Fold/Expand branch
  if (e.button === 0) {
    Menu.close()
    Selection.resetSelection()
    Tabs.toggleBranch(props.tab.id)
  }

  // Select whole branch and show menu
  if (e.button === 2 && !e.ctrlKey && !e.shiftKey) {
    const tab = Tabs.byId[props.tab.id]
    if (tab) Selection.selectTabsBranch(tab)
  }
}

function onError(): void {
  props.tab.favIconUrl = undefined

  const tab = Tabs.byId[props.tab.id]
  if (tab) tab.favIconUrl = undefined
}
</script>
