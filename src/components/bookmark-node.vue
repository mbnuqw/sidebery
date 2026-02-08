<template lang="pug">
.BookmarkNode(
  ref="rootEl"
  :id="'bookmark' + panelId + node.id"
  :data-type="Bookmarks.typeName[node.type]"
  :data-expanded="expanded"
  :data-parent="!!children?.length"
  :data-selected="node.reactive.sel"
  :data-locked-selection="node.reactive.selLock"
  :data-open="node.reactive.hasOpenTabs")
  .body(
    :title="tooltip"
    :data-color="node.reactive.containerColor"
    @mousedown.stop="onMouseDown"
    @mouseup.stop="onMouseUp"
    @contextmenu.stop="onCtxMenu")
    .dnd-layer(draggable="true" data-dnd-type="bookmark" :data-dnd-id="node.id" @dragstart="onDragStart")
    .color-layer(v-if="node.reactive.customColor" :style="{ '--bkm-color': RGB_COLORS[node.customColor as browser.ColorName] }")
    .fav(v-if="node.type === BkmType.Bookmark")
      svg(v-if="!favicon")
        use(href="#icon_ff")
      img(v-else :src="favicon")
    .fav(v-else-if="node.type === BkmType.Folder" @mousedown="onFolderFavMouseDown")
      svg(v-if="expanded")
        use(href="#icon_folder_open")
      svg(v-else)
        use(href="#icon_folder")
    .title(v-if="node.children || node.url") {{node.reactive.title || node.reactive.url}}
    .len(v-if="Settings.state.showBookmarkLen && node.type === BkmType.Folder") {{node.reactive.len}}
    .container-mark(v-if="node.reactive.containerColor")
  
  .children(v-if="expanded && children?.length" :title="node.reactive.title")
    BookmarkNode(v-for="nodeId in children" :key="nodeId" :nodeId="nodeId" :filter="props.filter" :panelId="panelId")
</template>

<script lang="ts">
export default { name: 'BookmarkNode' }
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { DragInfo } from 'src/types'
import { MenuType, DragType, DropType, BkmType } from 'src/enums'
import * as Settings from 'src/services/settings.fg'
import * as Windows from 'src/services/windows.fg'
import * as Selection from 'src/services/selection.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Menu from 'src/services/menu.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Search from 'src/services/search.fg'
import { NOID, RGB_COLORS } from 'src/defaults'
import * as Favicons from 'src/services/favicons.fg'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

const props = defineProps<{
  nodeId: ID
  panelId: ID
  filter?: (n: Bookmarks.BkmNode) => boolean
}>()

const node = Bookmarks.byId.get(props.nodeId) as Bookmarks.BkmNode
if (!node) throw `bookmark-node.vue: No such node: ${props.nodeId}`

const rootEl = ref<HTMLElement | null>(null)

const favicon = computed((): string => {
  if (node.type !== BkmType.Bookmark) return ''
  const url = node.reactive.url
  return url ? Favicons.getFavicon(url) : ''
})
const tooltip = computed((): string => {
  const title = node.reactive.title
  const url = node.reactive.url
  if (title && url) return `${title}\n---\n${url}`
  else if (url) return url
  else if (title) return title
  else return ''
})
const children = computed<ID[] | undefined>(() => {
  const children = node.reactive.children
  if (props.filter && node.children) {
    return node.children.reduce<ID[]>((a, v) => (props.filter?.(v) && a.push(v.id), a), [])
  } else {
    return children
  }
})
const expanded = computed<boolean>(() => {
  if (!node.children) return false
  if (!props.panelId) return false
  return !!Bookmarks.reactive.expanded[props.panelId]?.[node.id]
})

let middleClickReactionTimeout: number | undefined

async function onMouseDown(e: MouseEvent): Promise<void> {
  Mouse.setTarget('bookmark', node.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (Bookmarks.reactive.popup && node.type === BkmType.Folder) {
      if (!node.sel) {
        Selection.resetSelection()
        Selection.selectBookmark(node.id)
      } else {
        if (!expanded.value) Bookmarks.expandBookmark(node.id, props.panelId)
        else Bookmarks.foldBookmark(node.id, props.panelId)
      }
      Bookmarks.reactive.popup.location = node.id
      if (Bookmarks.reactive.popup.validate) {
        Bookmarks.reactive.popup.validate(Bookmarks.reactive.popup)
      }
      return
    }

    if (e.ctrlKey) {
      if (!node.sel) Selection.selectBookmark(node.id)
      else {
        Selection.deselectBookmark(node.id)
        if (children.value && children.value.length > 0) {
          if (!expanded.value) Bookmarks.expandBookmark(node.id, props.panelId)
          else Bookmarks.foldBookmark(node.id, props.panelId)
        }
      }
      return
    }

    if (e.shiftKey) {
      if (!Selection.isSet()) Selection.selectBookmark(node.id)
      else Selection.selectBookmarksRange(node)
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

    // Visualize clicking
    if (rootEl.value) {
      rootEl.value.classList.add('-middle-click')
      clearTimeout(middleClickReactionTimeout)
      middleClickReactionTimeout = setTimeout(() => {
        rootEl.value?.classList.remove('-middle-click')
      }, 300)
    }

    // Bookmark
    if (node.type === BkmType.Bookmark && node.url) {
      const action = Settings.state.bookmarksMidClickAction
      if (action === 'open_in_new') {
        const conf = Bookmarks.getMouseOpeningConf(e.button)
        await Bookmarks.open([node.id], conf.dst, conf.useActiveTab, conf.activateFirstTab)
        if (conf.removeBookmark) Bookmarks.removeBookmarks([node.id], { noNotif: true })
      } else if (action === 'edit') Bookmarks.editBookmarkNode(node)
      else if (action === 'delete') Bookmarks.removeBookmarks([node.id])
    }

    // Folder
    else if (node.type === BkmType.Folder) {
      const panelId = Sidebar.getRecentTabsPanelId()
      await Bookmarks.open([node.id], { panelId }, false, true)
    }
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !node.sel && !Bookmarks.reactive.popup) {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, node.id)
    }
  }
}

function onFolderFavMouseDown(e: MouseEvent): void {
  if (!Bookmarks.reactive.popup) return
  e.stopPropagation()
  Menu.close()

  if (!node.sel) {
    Selection.resetSelection()
    Selection.selectBookmark(node.id)
  }

  if (!expanded.value) Bookmarks.expandBookmark(node.id, props.panelId)
  else Bookmarks.foldBookmark(node.id, props.panelId)

  Bookmarks.reactive.popup.location = node.id
  if (Bookmarks.reactive.popup.validate) Bookmarks.reactive.popup.validate(Bookmarks.reactive.popup)
}

/**
 * Handle mouseup event
 */
async function onMouseUp(e: MouseEvent): Promise<void> {
  const sameTarget = Mouse.isTarget('bookmark', node.id)
  Mouse.resetTarget()

  const isFolder = node.type === BkmType.Folder

  // Left button
  if (e.button === 0) {
    if (!sameTarget) return
    if (Bookmarks.reactive.popup) return
    if (e.ctrlKey || e.shiftKey) return

    if (Search.active && !isFolder) {
      Search.stop()
      Selection.resetSelection()
    }

    if (Selection.isBookmarks() && !Search.active) {
      return Selection.resetSelection()
    }

    // Scroll to sticked opened folder
    if (Settings.state.pinOpenedBookmarksFolder && isFolder && expanded.value) {
      const bookmarkEl = document.getElementById(`bookmark${props.panelId}${node.id}`)
      const bookmarkBounds = bookmarkEl?.getBoundingClientRect()
      const bookmarkBodyEl = bookmarkEl?.children[0]
      const bookmarkBodyBounds = bookmarkBodyEl?.getBoundingClientRect()

      if (bookmarkBounds && bookmarkBodyBounds && bookmarkBounds.top < bookmarkBodyBounds.top) {
        Sidebar.scrollActivePanel(bookmarkBodyBounds.top - bookmarkBounds.top, true)
        return
      }
    }

    // Bookmark
    if (node.type === BkmType.Bookmark && node.url) {
      // Auto convert bookmarks panel to source tabs panel
      const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
      if (Utils.isBookmarksPanel(actPanel) && actPanel.autoConvert) {
        try {
          // Convert panel
          const tabsPanelId = await Sidebar.convertToTabsPanel(actPanel, false)
          if (tabsPanelId === NOID) return Logs.err('BookmarkNode.onMouseUp: cannot convert panel')

          // Open tab
          const info = { id: 1, url: node.url, title: node.title, active: true }
          await Tabs.open([info], { panelId: tabsPanelId })
          return
        } catch (err) {
          Logs.err('BookmarkNode.onMouseUp: cannot convert panel', err)
        }
      }

      // Activate tab if bookmark is opened
      let newTabNeededInActPanel = false
      if (Settings.state.activateOpenBookmarkTab && node.hasOpenTabs) {
        let tab
        if (Utils.isTabsPanel(actPanel)) {
          tab = Tabs.list.find(t => t.url === node.url && t.panelId === actPanel.id)
          newTabNeededInActPanel = !tab
        } else if (Utils.isBookmarksPanel(actPanel)) {
          tab = Tabs.list.find(t => t.url === node.url)
        }
        if (tab) {
          browser.tabs.update(tab.id, { active: true })
          return
        }
      }

      // Check if new tab needed
      if (Utils.isTabsPanel(actPanel) && !newTabNeededInActPanel) {
        const actTab = Tabs.byId[Tabs.activeId]
        if (actTab) {
          const inPanel = Settings.state.pinnedTabsPosition === 'panel'
          newTabNeededInActPanel = actTab.panelId !== actPanel.id || (actTab.pinned && !inPanel)
        }
      }

      // Open bookmark
      let conf = Bookmarks.getMouseOpeningConf(e.button)
      const useActiveTab = !newTabNeededInActPanel && conf.useActiveTab
      const activateFirstTab = newTabNeededInActPanel || conf.activateFirstTab
      Bookmarks.open([node.id], conf.dst, useActiveTab, activateFirstTab)
      if (conf.removeBookmark) Bookmarks.removeBookmarks([node.id], { noNotif: true })
    }

    // Folder
    else if (isFolder) {
      if (!expanded.value) {
        Bookmarks.expandBookmark(node.id, props.panelId)
      } else {
        Bookmarks.foldBookmark(node.id, props.panelId)
      }
    }
  }

  // Right button
  else if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return
    if (Bookmarks.reactive.popup) return

    Mouse.stopMultiSelection()
    if (!Settings.state.ctxMenuNative) {
      if (!Selection.isSet()) Selection.selectBookmark(node.id)
      Menu.open(MenuType.Bookmarks, e.clientX, e.clientY)
    }
  }
}

/**
 * Handle context menu
 */
function onCtxMenu(e: MouseEvent): void {
  if (!Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey || Bookmarks.reactive.popup) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !node.sel) {
    Selection.resetSelection()
  }

  let nativeCtx = { context: 'bookmark', bookmarkId: node.id } as const
  browser.menus.overrideContext(nativeCtx)

  if (!Selection.isBookmarks()) Selection.selectBookmark(node.id)

  Menu.open(MenuType.Bookmarks)
}

/**
 * Handle dragstart event.
 */
function onDragStart(e: DragEvent): void {
  Menu.close()
  if (!Selection.isSet()) Selection.selectBookmark(node.id)
  Sidebar.updateBounds()

  // Check what to drag
  const dragItems = Bookmarks.convertTreeToDragItems(node.id)
  const dragInfo: DragInfo = {
    type: DragType.Bookmarks,
    items: dragItems,
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
    const url = node.url ?? ''
    const dragImgEl = document.getElementById('drag_image')
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    if (Settings.state.dndOutside === 'data' ? !e.altKey : e.altKey) {
      e.dataTransfer.setData('text/uri-list', url)
      e.dataTransfer.setData('text/plain', url)
    }
    if (dragImgEl) e.dataTransfer.setDragImage(dragImgEl, -3, -3)
    e.dataTransfer.effectAllowed = 'copyMove'
  }
}
</script>
