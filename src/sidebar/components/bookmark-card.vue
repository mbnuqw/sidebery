<template lang="pug">
.BookmarkCard(
  :id="'bookmark' + panelId + node.id"
  :data-selected="node.reactive.sel"
  :data-open="node.reactive.hasOpenTabs"
  :data-color="node.reactive.containerColor"
  :title="tooltip"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @contextmenu.stop="onCtxMenu")
  .dnd-layer(draggable="true" data-dnd-type="panel" data-dnd-id="bookmarks" @dragstart="onDragStart")
  .body
    .color-layer(v-if="node.customColor" :style="{ '--bkm-color': RGB_COLORS[node.customColor as browser.ColorName] }")
    .line
      .fav
        svg(v-if="!favicon")
          use(href="#icon_ff")
        img(v-else :src="favicon")
      .title {{node.parsedTitle || node.title}}
    .line
      .info {{getFolder(node)}}
      .info.-end {{getDate(node)}}
    .container-mark(v-if="node.reactive.containerColor")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { DragInfo } from 'src/types'
import { MenuType, DragType, DropType, BkmType } from 'src/enums'
import { RGB_COLORS } from 'src/defaults'
import * as Settings from 'src/services/settings'
import * as Windows from 'src/services/windows.fg'
import * as Selection from 'src/services/selection.fg'
import * as Favicons from 'src/services/favicons.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Menu from 'src/services/menu.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Search from 'src/services/search.fg'

const props = defineProps<{ node: Bookmarks.BkmNode; panelId: ID }>()

const favicon = computed((): string => {
  if (!props.node.url) return ''
  return Favicons.getFavicon(props.node.url)
})
const tooltip = computed((): string => {
  if (props.node.url) return `${props.node.parsedTitle || props.node.title}\n---\n${props.node.url}`
  else return ''
})

function getFolder(node: Bookmarks.BkmNode): string {
  const folder = Bookmarks.byId.get(node.parentId)
  return folder?.parsedTitle ?? folder?.title ?? '???'
}

function getDate(node: Bookmarks.BkmNode): string {
  const time = node.dateAdded
  if (!time) return '???'

  const dt = new Date(time)
  const day = `${dt.getDate()}`.padStart(2, '0')
  const hr = `${dt.getHours()}`.padStart(2, '0')
  const min = `${dt.getMinutes()}`.padStart(2, '0')
  return `${day}, ${hr}:${min}`
}

async function onMouseDown(e: MouseEvent): Promise<void> {
  Mouse.setTarget('bookmark', props.node.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!props.node.sel) Selection.selectBookmark(props.node.id)
      else Selection.deselectBookmark(props.node.id)
      return
    }

    if (e.shiftKey) {
      if (!Selection.isSet()) Selection.selectBookmark(props.node.id)
      else Selection.selectBookmarksRange(props.node)
      return
    }
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    if (Selection.isBookmarks()) {
      Selection.resetSelection()
      if (!Search.active) return
    }

    const action = Settings.state.bookmarksMidClickAction
    if (action === 'open_in_new') {
      const conf = Bookmarks.getMouseOpeningConf(e.button)
      await Bookmarks.open([props.node.id], conf.dst, conf.useActiveTab, conf.activateFirstTab)
      if (conf.removeBookmark) Bookmarks.removeBookmarks([props.node.id], { noNotif: true })
    } else if (action === 'edit') Bookmarks.editBookmarkNode(props.node)
    else if (action === 'delete') Bookmarks.removeBookmarks([props.node.id])
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !props.node.sel) {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, props.node.id)
    }
  }
}

function onMouseUp(e: MouseEvent): void {
  if (e.button === 0) {
    if (!Mouse.isTarget('bookmark', props.node.id)) return
    if (e.ctrlKey || e.shiftKey) return

    if (Selection.isBookmarks()) {
      return Selection.resetSelection()
    }

    if (Settings.state.activateOpenBookmarkTab && props.node.hasOpenTabs) {
      const tab = Tabs.list.find(t => t.url === props.node.url)
      if (tab) {
        browser.tabs.update(tab.id, { active: true })
        return
      }
    }

    if (props.node.type === BkmType.Bookmark && props.node.url) {
      const conf = Bookmarks.getMouseOpeningConf(e.button)
      Bookmarks.open([props.node.id], conf.dst, conf.useActiveTab, conf.activateFirstTab)
      if (conf.removeBookmark) Bookmarks.removeBookmarks([props.node.id], { noNotif: true })
    }
  } else if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    Mouse.stopMultiSelection()
    if (!Settings.state.ctxMenuNative) {
      if (!Selection.isSet()) Selection.selectBookmark(props.node.id)
      Menu.open(MenuType.Bookmarks, e.clientX, e.clientY)
    }
  }
}

function onCtxMenu(e: MouseEvent): void {
  if (!Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !props.node.sel) {
    Selection.resetSelection()
  }

  let nativeCtx = { context: 'bookmark', bookmarkId: props.node.id } as const
  browser.menus.overrideContext(nativeCtx)

  if (!Selection.isBookmarks()) Selection.selectBookmark(props.node.id)

  Menu.open(MenuType.Bookmarks)
}

function onDragStart(e: DragEvent): void {
  Menu.close()
  if (!Selection.isSet()) Selection.selectBookmark(props.node.id)
  Sidebar.updateBounds()

  const id = props.node.id
  const url = props.node.url ?? ''
  const dragInfo: DragInfo = {
    type: DragType.Bookmarks,
    items: [{ id, url, title: props.node.title, parentId: props.node.parentId }],
    windowId: Windows.id,
    incognito: Windows.incognito,
    panelId: 'bookmarks',
    x: e.clientX,
    y: e.clientY,
  }

  DnD.broadcastDragInfo(dragInfo)
  DnD.start(dragInfo, DropType.Bookmarks)

  // Set native drag info
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    if (Settings.state.dndOutside === 'data' ? !e.altKey : e.altKey) {
      e.dataTransfer.setData('text/uri-list', url)
      e.dataTransfer.setData('text/plain', url)
    }
    const dragImgEl = document.getElementById('drag_image')
    if (dragImgEl) e.dataTransfer.setDragImage(dragImgEl, -3, -3)
    e.dataTransfer.effectAllowed = 'copyMove'
  }
}
</script>
