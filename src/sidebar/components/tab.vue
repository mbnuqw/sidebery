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
  :data-group="tab.isGroup"
  :data-parent="tab.isParent"
  :data-folded="tab.folded && !Search.reactive.value"
  :data-invisible="tab.invisible && !Search.reactive.value"
  :data-color="containerColor"
  :data-colorized="!!tabColor"
  :data-unread="tab.unread"
  :title="tooltip"
  @contextmenu.stop="onCtxMenu"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @dblclick.prevent.stop="onDoubleClick")
  .body
    .color-layer(
      v-if="tabColor" :style="{ '--tab-color': tabColor }")
    .flash-fx(v-if="tab.flash")
    .dnd-layer(draggable="true" data-dnd-type="tab" :data-dnd-id="tab.id" @dragstart="onDragStart")
    .audio(
      v-if="tab.mediaAudible || tab.mediaMuted || tab.mediaPaused"
      @mousedown.stop="onAudioMouseDown($event, tab)"
      @mouseup.stop="")
      svg.-loud: use(xlink:href="#icon_loud_badge")
      svg.-mute: use(xlink:href="#icon_mute_badge")
      svg.-pause: use(xlink:href="#icon_pause_12")
    .fav(@dragstart.stop.prevent)
      svg.fav-icon(v-if="!tab.favIconUrl"): use(:xlink:href="favPlaceholder")
      img.fav-icon(v-if="tab.favIconUrl" :src="tab.favIconUrl" @error="onError")
      .exp(
        v-if="tab.isParent"
        @dblclick.prevent.stop
        @mousedown.stop="onExpandMouseDown"
        @mouseup.left.stop)
        svg: use(xlink:href="#icon_expand")
      .badge
      .progress-spinner(v-if="loading === true")
      .child-count(v-if="tab.folded && tab.branchLen") {{tab.branchLen}}
    .close(
      v-if="Settings.state.showTabRmBtn && !isPinned"
      @mousedown.stop="onMouseDownClose"
      @mouseup.stop
      @contextmenu.stop.prevent)
      svg: use(xlink:href="#icon_remove")
    .ctx(v-if="containerColor")
    .t-box(v-if="withTitle"): .title {{tab.title}}
    .unread-mark(v-if="tab.unread")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
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
const containerColor = computed((): boolean | string => {
  const container = Containers.reactive.byId[props.tab.cookieStoreId]
  if (container) return container.color
  return false
})
const tabColor = computed<string>(() => {
  if (
    Settings.state.colorizeTabsBranches &&
    props.tab.branchColor &&
    (props.tab.isParent || props.tab.lvl > 0)
  ) {
    return props.tab.branchColor
  } else if (Settings.state.colorizeTabs && props.tab.color) {
    return props.tab.color
  } else {
    return ''
  }
})
const tooltip = computed((): string => {
  let decodedUrl
  try {
    decodedUrl = decodeURI(props.tab.url)
  } catch (err) {
    decodedUrl = props.tab.url
  }

  let str = `${props.tab.title}`
  if (Settings.state.tabsUrlInTooltip === 'full') {
    str += `\n${decodedUrl}`
  } else if (Settings.state.tabsUrlInTooltip === 'stripped') {
    str += `\n${decodedUrl.split('?')[0]}`
  }
  return str
})
const favPlaceholder = computed((): string => {
  if (props.tab.warn) return '#icon_warn'
  return Favicons.getFavPlaceholder(props.tab.url)
})
const withTitle = computed((): boolean => {
  if (!props.tab.pinned) return true
  return Settings.state.pinnedTabsPosition === 'panel' && Settings.state.pinnedTabsList
})
const isPinned = computed<boolean>(() => {
  if (!props.tab.pinned) return false
  if (Settings.state.pinnedTabsList && Settings.state.pinnedTabsPosition === 'panel') {
    return false
  }
  return true
})

let closeLock = false
let tempLockCloseBtnTimeout: number | undefined
function tempLockCloseBtn(): void {
  closeLock = true
  clearTimeout(tempLockCloseBtnTimeout)
  tempLockCloseBtnTimeout = setTimeout(() => {
    closeLock = false
  }, 1000)
}
function onMouseDownClose(e: MouseEvent): void {
  if (closeLock) return
  Mouse.setTarget('tab.close', props.tab.id)
  if (e.button === 0) {
    Tabs.removeTabs([props.tab.id])
    tempLockCloseBtn()
  }
  if (e.button === 1) {
    if (Settings.state.tabCloseMiddleClick === 'close') {
      Tabs.removeTabs([props.tab.id])
      tempLockCloseBtn()
    } else if (Settings.state.tabCloseMiddleClick === 'discard') {
      Tabs.discardTabs([props.tab.id])
    }
    e.preventDefault()
  }
  if (e.button === 2) {
    Tabs.removeBranches([props.tab.id])
    tempLockCloseBtn()
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
      if (Settings.state.shiftSelAct && !Selection.isSet()) {
        Selection.selectTab(Tabs.activeId)
      }
      const tab = Tabs.byId[props.tab.id]
      if (!Selection.isSet()) Selection.selectTab(props.tab.id)
      else if (tab) Selection.selectTabsRange(tab)
      e.preventDefault()
      return
    }

    if (Selection.isSet() && !props.tab.sel) Selection.resetSelection()

    if (!Selection.isSet() && !Settings.state.activateOnMouseUp) activate()

    Mouse.startLongClick(e, 'tab', props.tab.id, longClickFeedback)
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    Mouse.blockWheel()
    if (Settings.state.multipleMiddleClose) {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, props.tab.id)
    } else {
      Tabs.removeTabs([props.tab.id])
      Selection.resetSelection()
    }
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !props.tab.sel) {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, props.tab.id)
    }
    Mouse.startLongClick(e, 'tab', props.tab.id, longClickFeedback)
  }
}

function longClickFeedback(): void {
  Tabs.triggerFlashAnimation(props.tab)
}

function onMouseUp(e: MouseEvent): void {
  const sameTarget = Mouse.isTarget('tab', props.tab.id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (Mouse.isLocked()) return Mouse.resetClickLock(120)
  if (Mouse.longClickApplied) return

  if (e.button === 0) {
    const withoutMods = !e.ctrlKey && !e.shiftKey
    if (sameTarget) {
      if (withoutMods) Selection.resetSelection()
      if (Settings.state.activateOnMouseUp && withoutMods) activate()
      if (
        Settings.state.tabsSecondClickActPrev &&
        props.tab.id === Tabs.activeId &&
        withoutMods &&
        !activating
      ) {
        const history = Tabs.getActiveTabsHistory()
        const prevTabId = history.actTabs[history.actTabs.length - 1]
        if (prevTabId !== undefined) browser.tabs.update(prevTabId, { active: true })
      }
    }
    activating = false
  } else if (e.button === 1) {
    if (!Settings.state.multipleMiddleClose) return

    const inMultiSelectionMode = Mouse.multiSelectionMode
    Mouse.stopMultiSelection()

    if (inMultiSelectionMode && !Settings.state.autoMenuMultiSel && Selection.getLength() > 1) {
      return
    }

    if (!Selection.isSet()) select()
    Tabs.removeTabs(Selection.get())
  } else if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    const inMultiSelectionMode = Mouse.multiSelectionMode
    Mouse.stopMultiSelection()

    if (inMultiSelectionMode && !Settings.state.autoMenuMultiSel && Selection.getLength() > 1) {
      return
    }

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.state.ctxMenuNative) select()
    if (!Settings.state.ctxMenuNative) Menu.open(MenuType.Tabs, e.clientX, e.clientY)
  }
}

function onCtxMenu(e: MouseEvent): void {
  if (
    Mouse.isLocked() ||
    !Settings.state.ctxMenuNative ||
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
  const dc = Settings.state.tabDoubleClick
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
    const inBranch = Settings.state.tabsTree && !pinned && toDrag.includes(tab.parentId)
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
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    if (Settings.state.dndOutside === 'data' ? !e.altKey : e.altKey) {
      const uris = uriList.join('\r\n')
      e.dataTransfer.setData('text/x-moz-url', urlTitleList.join('\r\n'))
      e.dataTransfer.setData('text/uri-list', uris)
      e.dataTransfer.setData('text/plain', uris)
      e.dataTransfer.setData('text/html', links.join('\r\n'))
    }
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

let activating = false
function activate(): void {
  if (Mouse.longClickApplied) return

  if (Search.reactive.rawValue) {
    Search.stop()
    Selection.resetSelection()
  }

  if (props.tab.id !== Tabs.activeId) {
    activating = true
    browser.tabs.update(props.tab.id, { active: true })
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
