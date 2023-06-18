<template lang="pug">
.BookmarkCard(
  :id="'bookmark' + node.id"
  :data-selected="node.sel"
  :data-open="node.isOpen"
  :title="tooltip"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @contextmenu.stop="onCtxMenu")
  .dnd-layer(draggable="true" data-dnd-type="panel" data-dnd-id="bookmarks" @dragstart="onDragStart")
  .body
    .line
      .fav
        svg(v-if="!favicon")
          use(xlink:href="#icon_ff")
        img(v-else :src="favicon")
      .title {{node.title}}
    .line
      .info {{getFolder(node)}}
      .info.-end {{getDate(node)}}
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import * as Utils from 'src/utils'
import { Bookmark, DragInfo, DragType, DropType, DstPlaceInfo } from 'src/types'
import { MenuType } from 'src/types'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Favicons } from 'src/services/favicons'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import { FOLDER_NAME_DATA_RE } from 'src/defaults'

const props = defineProps<{ node: Bookmark }>()

const favicon = computed((): string => {
  if (!props.node.url) return ''
  return Favicons.getFavicon(props.node.url)
})
const tooltip = computed((): string => {
  if (props.node.url) return `${props.node.title}\n---\n${props.node.url}`
  else return ''
})

function getFolder(node: Bookmark): string {
  const folderName = Bookmarks.reactive.byId[node.parentId]?.title ?? '???'
  if (folderName.length > 36) {
    const folderNameExec = FOLDER_NAME_DATA_RE.exec(folderName)
    if (folderNameExec) return folderNameExec[1]
  }
  return folderName
}

function getDate(node: Bookmark): string {
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
    if (Selection.isBookmarks()) return Selection.resetSelection()

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

    if (Settings.state.activateOpenBookmarkTab && props.node.isOpen) {
      const tab = Tabs.list.find(t => t.url === props.node.url)
      if (tab) {
        browser.tabs.update(tab.id, { active: true })
        return
      }
    }

    if (props.node.type === 'bookmark' && props.node.url) {
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
