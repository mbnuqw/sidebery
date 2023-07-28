<template lang="pug">
.Tab(
  :id="'tab' + tab.id"
  :data-pin="!!iconOnly"
  :data-active="tab.reactive.active"
  :data-loading="tab.reactive.status === TabStatus.Loading"
  :data-pending="tab.reactive.status === TabStatus.Pending"
  :data-selected="tab.reactive.sel"
  :data-audible="tab.reactive.mediaAudible"
  :data-muted="tab.reactive.mediaMuted"
  :data-paused="tab.reactive.mediaPaused"
  :data-discarded="tab.reactive.discarded"
  :data-updated="tab.reactive.updated"
  :data-lvl="tab.reactive.lvl"
  :data-group="tab.reactive.isGroup"
  :data-parent="tab.reactive.isParent"
  :data-folded="tab.reactive.folded && !Search.reactive.value"
  :data-color="tab.reactive.containerColor"
  :data-colorized="!!tabColor"
  :data-unread="tab.reactive.unread"
  :data-edit="tab.reactive.customTitleEdit"
  :title="tab.reactive.tooltip"
  :draggable="!tab.reactive.customTitleEdit"
  @dragstart="onDragStart"
  @contextmenu.stop="onCtxMenu"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @mouseenter.stop="onMouseEnter"
  @dblclick.prevent.stop="onDoubleClick")
  .dnd-layer(data-dnd-type="tab" :data-dnd-id="tab.id")
  .body
    .color-layer(v-if="tabColor" :style="{ '--tab-color': tabColor }")
    .flash-fx(v-if="tab.reactive.flash")
    .unread-mark(v-if="tab.reactive.unread")
    .fav(@dragstart.stop.prevent)
      img.fav-icon(v-if="tab.reactive.favIconUrl" :src="tab.reactive.favIconUrl" @error="onError" draggable="false")
      svg.fav-icon(v-else): use(:xlink:href="favPlaceholder")
      .exp(
        v-if="tab.reactive.isParent"
        @dblclick.prevent.stop
        @mousedown.stop="onExpandMouseDown"
        @mouseup="onExpandMouseUp")
        svg.exp-icon: use(xlink:href="#icon_expand")
      .badge
      .progress-spinner(v-if="tab.reactive.status === TabStatus.Loading")
      .child-count(v-if="tab.reactive.folded && tab.reactive.branchLen") {{tab.reactive.branchLen}}
    .audio(
      v-if="tab.reactive.mediaAudible || tab.reactive.mediaMuted || tab.reactive.mediaPaused"
      @mousedown.stop=""
      @mouseup.stop="onAudioMouseDown($event, tab)")
      svg.audio-icon.-loud: use(xlink:href="#icon_loud_badge")
      svg.audio-icon.-mute: use(xlink:href="#icon_mute_badge")
      svg.audio-icon.-pause: use(xlink:href="#icon_pause_12")
    .t-box(v-if="!iconOnly")
      input.custom-title-input(
        v-if="tab.reactive.customTitleEdit"
        v-model="tab.reactive.customTitle"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        tabindex="-1"
        @blur="onCustomTitleBlur"
        @keydown="onCustomTitlteKD")
      .title(v-else) {{tab.reactive.customTitle ?? tab.reactive.title}}
    .close(
      v-if="!iconOnly && Settings.state.tabRmBtn !== 'none'"
      @mousedown.stop="onMouseDownClose"
      @mouseup.stop="onMouseUpClose"
      @contextmenu.stop.prevent)
      svg.close-icon: use(xlink:href="#icon_remove")
    .ctx(v-if="tab.reactive.containerColor")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { DragInfo, DragItem, DragType, DropType, MenuType, Tab } from 'src/types'
import { TabStatus } from 'src/types'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import { Search } from 'src/services/search'
import * as Favicons from 'src/services/favicons.fg'
import { NOID, RGB_COLORS } from 'src/defaults'
import * as Utils from 'src/utils'

const props = defineProps<{ tabId: ID; iconOnly?: boolean }>()
const tab = Tabs.byId[props.tabId] as Tab

const tabColor = computed<string>(() => {
  if (tab.reactive.customColor) return RGB_COLORS[tab.customColor as browser.ColorName]
  if (
    Settings.state.colorizeTabsBranches &&
    tab.reactive.branchColor &&
    (tab.reactive.isParent || tab.reactive.lvl > 0)
  ) {
    return tab.reactive.branchColor
  } else if (Settings.state.colorizeTabs && tab.reactive.color) {
    return tab.reactive.color
  } else {
    return ''
  }
})
const favPlaceholder = computed((): string => {
  if (tab.reactive.warn) return '#icon_warn'
  return Favicons.getFavPlaceholder(tab.reactive.url)
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
  Mouse.setTarget('tab.close', tab.id)
  if (Menu.isOpen) {
    Menu.close()
    if (!Settings.state.ctxMenuNative) return
  }
  if (Tabs.editableTabId === tab.id) {
    tab.reactive.customTitle = tab.title
  } else if (e.button === 0) {
    Tabs.removeTabs([tab.id])
  } else if (e.button === 1) {
    if (Settings.state.tabCloseMiddleClick === 'close') {
      Tabs.removeTabs([tab.id])
    } else if (Settings.state.tabCloseMiddleClick === 'discard') {
      Tabs.discardTabs([tab.id])
    }
    e.preventDefault()
  } else if (e.button === 2) {
    Tabs.removeBranches([tab.id])
  }
  tempLockCloseBtn()
}
function onMouseUpClose(e: MouseEvent): void {
  Mouse.resetTarget()
  Mouse.stopLongClick()
  Mouse.stopMultiSelection()
  Selection.resetSelection()
}

function onMouseDown(e: MouseEvent): void {
  Mouse.setTarget('tab', tab.id)

  if (Menu.isOpen) {
    Menu.close()
    if (!Settings.state.ctxMenuNative && e.button === 0) return
  }
  if (tab.reactive.customTitleEdit) return

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!tab.sel) Selection.selectTab(tab.id)
      else Selection.deselectTab(tab.id)
      return
    }

    if (e.shiftKey) {
      if (Settings.state.shiftSelAct && !Selection.isSet()) {
        Selection.selectTab(Tabs.activeId)
      }
      if (!Selection.isSet()) Selection.selectTab(tab.id)
      else if (tab) Selection.selectTabsRange(tab)
      e.preventDefault()
      return
    }

    if (Selection.isSet() && !tab.sel) Selection.resetSelection()

    if (!Selection.isSet() && !Settings.state.activateOnMouseUp) activate()

    Mouse.startLongClick(e, 'tab', tab.id, longClickFeedback)
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    Mouse.blockWheel()
    if (Settings.state.multipleMiddleClose && Settings.state.tabMiddleClick === 'close') {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, tab.id)
    } else {
      if (Settings.state.tabMiddleClick === 'close') {
        Tabs.removeTabs([tab.id])
      } else if (Settings.state.tabMiddleClick === 'discard') {
        Tabs.discardTabs([tab.id])
      } else if (Settings.state.tabMiddleClick === 'duplicate') {
        Tabs.duplicateTabs([tab.id])
      }
      Selection.resetSelection()
    }
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !tab.sel) {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, tab.id)
    }
    Mouse.startLongClick(e, 'tab', tab.id, longClickFeedback)
  }
}

function longClickFeedback(): void {
  Tabs.triggerFlashAnimation(tab)
}

function onMouseUp(e: MouseEvent): void {
  const sameTarget = Mouse.isTarget('tab', tab.id)
  const sameTargetType = Mouse.isTarget('tab')
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (Mouse.isLocked()) return Mouse.resetClickLock(120)
  if (Mouse.longClickApplied) return
  if (tab.reactive.customTitleEdit) return

  if (e.button === 0) {
    const withoutMods = !e.ctrlKey && !e.shiftKey
    if (sameTarget) {
      if (withoutMods) Selection.resetSelection()
      if (Settings.state.activateOnMouseUp && withoutMods) activate()
      if (
        Settings.state.tabsSecondClickActPrev &&
        tab.id === Tabs.activeId &&
        withoutMods &&
        !activating
      ) {
        Tabs.tabFlip()
      }
    }
    activating = false
  } else if (e.button === 1) {
    Mouse.stopMultiSelection()

    if (
      Settings.state.multipleMiddleClose &&
      Settings.state.tabMiddleClick === 'close' &&
      sameTargetType
    ) {
      if (!Selection.isSet()) select()
      Tabs.removeTabs(Selection.get())
    }
  } else if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    const inMultiSelectionMode = Mouse.multiSelectionMode
    Mouse.stopMultiSelection()

    if (inMultiSelectionMode && !Settings.state.autoMenuMultiSel && Selection.getLength() > 1) {
      return
    }

    if (closeLock) return
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

  if (!e.ctrlKey && !e.shiftKey && !tab.sel) {
    Selection.resetSelection()
  }

  if (Menu.isBlocked()) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  browser.menus.overrideContext({ context: 'tab', tabId: tab.id })

  if (!Selection.isSet()) select()

  Menu.open(MenuType.Tabs)

  Mouse.stopLongClick()
}

function onDoubleClick(): void {
  const dc = Settings.state.tabDoubleClick
  if (dc === 'reload') Tabs.reloadTabs([tab.id])
  if (dc === 'duplicate') Tabs.duplicateTabs([tab.id])
  if (dc === 'pin') Tabs.repinTabs([tab.id])
  if (dc === 'mute') Tabs.remuteTabs([tab.id])
  if (dc === 'clear_cookies') Tabs.clearTabsCookies([tab.id])
  if (dc === 'exp' && tab.isParent) Tabs.toggleBranch(tab.id)
  if (dc === 'new_after') Tabs.createTabAfter(tab.id)
  if (dc === 'new_child' && !tab.pinned) Tabs.createChildTab(tab.id)
  if (dc === 'close') Tabs.removeTabs([tab.id])
  if (dc === 'edit_title') Tabs.editTabTitle([tab.id])
}

function onDragStart(e: DragEvent): void {
  if (Mouse.isLocked()) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }
  Menu.close()
  if (!Selection.isSet()) Selection.selectTabsBranch(tab)
  Mouse.stopLongClick()
  Sidebar.updateBounds()

  // Check what to drag
  const toDrag = [tab.id]
  const dragItems: DragItem[] = []
  const pinned = tab.pinned
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

function onMouseEnter(e: MouseEvent){
  browser.tabs.warmup(tab.id)
}

function onAudioMouseDown(e: MouseEvent, tab: Tab): void {
  // Left button
  if (e.button === 0) {
    if (!tab.mediaPaused) Tabs.remuteTabs([tab.id])
    else Tabs.playTabMedia(tab.id)
  }

  // Middle button
  else if (e.button === 1) {
    if (!tab.mediaPaused) Tabs.pauseTabMedia(tab.id)
    else Tabs.playTabMedia(tab.id)
  }

  // Right button
  else if (e.button === 2) {
    if (tab.mediaPaused) {
      tab.reactive.mediaPaused = tab.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
    }
  }
}

/**
 * Select this tab
 */
function select(): void {
  if (!tab.pinned && tab.isParent && tab.folded) {
    Selection.selectTabsBranch(tab)
  } else {
    Selection.selectTab(tab.id)
  }
}

let activating = false
function activate(): void {
  if (Mouse.longClickApplied) return

  if (Search.rawValue) {
    Search.stop()
    Selection.resetSelection()
  }

  if (tab.id !== Tabs.activeId) {
    activating = true
    browser.tabs.update(tab.id, { active: true })
  }
}

function onExpandMouseDown(): void {
  Mouse.setTarget('tab.expand', tab.id)
}

function onExpandMouseUp(e: MouseEvent): void {
  const sameTarget = Mouse.isTarget('tab.expand', tab.id)
  Mouse.resetTarget()

  // Fold/Expand branch
  if (e.button === 0) {
    e.stopPropagation()

    if (sameTarget) {
      Menu.close()
      Selection.resetSelection()
      Tabs.toggleBranch(tab.id)
    }
  }

  // Select whole branch and show menu
  if (e.button === 2 && !e.ctrlKey && !e.shiftKey && sameTarget) {
    Selection.resetSelection()
    Selection.selectTabsBranch(tab)
  }
}

function onError(): void {
  tab.reactive.favIconUrl = tab.favIconUrl = undefined
}

function onCustomTitleBlur() {
  Tabs.editableTabId = NOID
  tab.reactive.customTitleEdit = false
  Tabs.saveCustomTitle(tab.id)
}

function onCustomTitlteKD(e: KeyboardEvent) {
  const titleEl = e.target as HTMLElement

  if (e.key === 'Enter') {
    e.preventDefault()
    titleEl.blur()
  } else if (e.key === 'Escape') {
    const tab = Tabs.byId[Tabs.editableTabId]
    if (tab) titleEl.textContent = tab.title
    titleEl.blur()
    e.preventDefault()
  }
}
</script>
