<template lang="pug">
.BookmarkNode(
  :id="'bookmark' + node.id"
  :data-type="node.type"
  :data-expanded="expanded"
  :data-parent="!!children?.length"
  :data-selected="node.sel"
  :data-open="node.isOpen")
  .body(
    :title="tooltip"
    @mousedown.stop="onMouseDown"
    @mouseup.stop="onMouseUp"
    @contextmenu.stop="onCtxMenu")
    .dnd-layer(draggable="true" data-dnd-type="bookmark" :data-dnd-id="node.id" @dragstart="onDragStart")
    .fav(v-if="node.url")
      svg(v-if="!favicon")
        use(xlink:href="#icon_ff")
      img(v-else :src="favicon")
    .fav(v-else-if="node.type === 'folder'" @mousedown="onFolderFavMouseDown")
      svg(v-if="expanded")
        use(xlink:href="#icon_folder_open")
      svg(v-else)
        use(xlink:href="#icon_folder")
    .title(v-if="node.title || node.url") {{node.title || node.url}}
    .len(v-if="Settings.state.showBookmarkLen && node.len") {{node.len}}
  .children(v-if="(expanded) && children?.length" :title="node.title")
    BookmarkNode(v-for="node in children" :key="node.id" :node="node" :filter="props.filter" :panelId="panelId")
</template>

<script lang="ts">
export default { name: 'BookmarkNode' }
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import { Bookmark, DragInfo, DragItem, MenuType, DragType, DropType } from 'src/types'
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
import { Search } from 'src/services/search'
import { NOID } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

const props = defineProps<{
  node: Bookmark
  panelId: ID
  filter?: (n: Bookmark) => boolean
}>()

const favicon = computed((): string => {
  if (!props.node.url) return ''
  return Favicons.getFavicon(props.node.url)
})
const tooltip = computed((): string => {
  if (props.node.title && props.node.url) return `${props.node.title}\n${props.node.url}`
  else if (props.node.url) return props.node.url
  else if (props.node.title) return props.node.title
  else return ''
})
const children = computed<Bookmark[] | undefined>(() => {
  if (!props.node.children) return
  if (props.filter) return props.node.children.filter(props.filter)
  else return props.node.children
})
const expanded = computed<boolean>(() => {
  if (!props.node.children) return false
  if (!props.panelId) return false
  return !!Bookmarks.reactive.expanded[props.panelId]?.[props.node.id]
})

async function onMouseDown(e: MouseEvent): Promise<void> {
  Mouse.setTarget('bookmark', props.node.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (Bookmarks.reactive.popup && props.node.type === 'folder') {
      if (!props.node.sel) {
        Selection.resetSelection()
        Selection.selectBookmark(props.node.id)
      } else {
        if (!expanded.value) Bookmarks.expandBookmark(props.node.id, props.panelId)
        else Bookmarks.foldBookmark(props.node.id, props.panelId)
      }
      Bookmarks.reactive.popup.location = props.node.id
      if (Bookmarks.reactive.popup.validate) {
        Bookmarks.reactive.popup.validate(Bookmarks.reactive.popup)
      }
      return
    }

    if (e.ctrlKey) {
      if (!props.node.sel) Selection.selectBookmark(props.node.id)
      else {
        Selection.deselectBookmark(props.node.id)
        if (children.value && children.value.length > 0) {
          if (!expanded.value) Bookmarks.expandBookmark(props.node.id, props.panelId)
          else Bookmarks.foldBookmark(props.node.id, props.panelId)
        }
      }
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

    // Bookmark
    if (props.node.type === 'bookmark' && props.node.url) {
      const action = Settings.state.bookmarksMidClickAction
      if (action === 'open_in_new') {
        const conf = Bookmarks.getMouseOpeningConf(e.button)
        await Bookmarks.open([props.node.id], conf.dst, conf.useActiveTab, conf.activateFirstTab)
        if (conf.removeBookmark) Bookmarks.removeBookmarks([props.node.id], true)
      } else if (action === 'edit') Bookmarks.editBookmarkNode(props.node)
      else if (action === 'delete') Bookmarks.removeBookmarks([props.node.id])
    }

    // Folder
    else if (props.node.type === 'folder') {
      const panelId = Bookmarks.getTargetTabsPanelId()
      await Bookmarks.open([props.node.id], { panelId }, false, true)
    }
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !props.node.sel && !Bookmarks.reactive.popup) {
      Selection.resetSelection()
      Mouse.startMultiSelection(e, props.node.id)
    }
  }
}

function onFolderFavMouseDown(e: MouseEvent): void {
  if (!Bookmarks.reactive.popup) return
  e.stopPropagation()
  Menu.close()

  if (!props.node.sel) {
    Selection.resetSelection()
    Selection.selectBookmark(props.node.id)
  }

  if (!expanded.value) Bookmarks.expandBookmark(props.node.id, props.panelId)
  else Bookmarks.foldBookmark(props.node.id, props.panelId)

  Bookmarks.reactive.popup.location = props.node.id
  if (Bookmarks.reactive.popup.validate) Bookmarks.reactive.popup.validate(Bookmarks.reactive.popup)
}

/**
 * Handle mouseup event
 */
async function onMouseUp(e: MouseEvent): Promise<void> {
  const sameTarget = Mouse.isTarget('bookmark', props.node.id)
  Mouse.resetTarget()

  const isFolder = props.node.type === 'folder'

  // Left button
  if (e.button === 0) {
    if (!sameTarget) return
    if (Bookmarks.reactive.popup) return
    if (e.ctrlKey || e.shiftKey) return

    if (Search.reactive.rawValue && !isFolder) {
      Search.stop()
      Selection.resetSelection()
    }

    if (Selection.isBookmarks() && !Search.reactive.rawValue) {
      return Selection.resetSelection()
    }

    // Scroll to sticked opened folder
    if (Settings.state.pinOpenedBookmarksFolder && isFolder && expanded.value) {
      const bookmarkEl = document.getElementById('bookmark' + (props.node.id as string))
      const bookmarkBounds = bookmarkEl?.getBoundingClientRect()
      const bookmarkBodyEl = bookmarkEl?.children[0]
      const bookmarkBodyBounds = bookmarkBodyEl?.getBoundingClientRect()

      if (bookmarkBounds && bookmarkBodyBounds && bookmarkBounds.top < bookmarkBodyBounds.top) {
        Sidebar.scrollActivePanel(bookmarkBodyBounds.top - bookmarkBounds.top, true)
        return
      }
    }

    // Bookmark
    if (props.node.type === 'bookmark' && props.node.url) {
      // Auto convert bookmarks panel to source tabs panel
      const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
      if (Utils.isBookmarksPanel(actPanel) && actPanel.autoConvert) {
        try {
          // Convert panel
          const tabsPanelId = await Sidebar.convertToTabsPanel(actPanel, false)
          if (tabsPanelId === NOID) return Logs.err('BookmarkNode.onMouseUp: cannot convert panel')

          // Open tab
          const info = { id: 1, url: props.node.url, title: props.node.title, active: true }
          await Tabs.open([info], { panelId: tabsPanelId })
          return
        } catch (err) {
          Logs.err('BookmarkNode.onMouseUp: cannot convert panel', err)
        }
      }

      // Activate tab if bookmark is opened
      let newTabNeededInActPanel = false
      if (Settings.state.activateOpenBookmarkTab && props.node.isOpen) {
        let tab
        if (Utils.isTabsPanel(actPanel)) {
          tab = Tabs.list.find(t => t.url === props.node.url && t.panelId === actPanel.id)
          newTabNeededInActPanel = !tab
        } else if (Utils.isBookmarksPanel(actPanel)) {
          tab = Tabs.list.find(t => t.url === props.node.url)
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
      Bookmarks.open([props.node.id], conf.dst, useActiveTab, conf.activateFirstTab)
      if (conf.removeBookmark) Bookmarks.removeBookmarks([props.node.id], true)
    }

    // Folder
    else if (isFolder) {
      if (!expanded.value) {
        Bookmarks.expandBookmark(props.node.id, props.panelId)
      } else {
        Bookmarks.foldBookmark(props.node.id, props.panelId)
      }
    }
  }

  // Right button
  else if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return
    if (Bookmarks.reactive.popup) return

    Mouse.stopMultiSelection()
    if (!Settings.state.ctxMenuNative) {
      if (!Selection.isSet()) Selection.selectBookmark(props.node.id)
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

  if (!e.ctrlKey && !e.shiftKey && !props.node.sel) {
    Selection.resetSelection()
  }

  let nativeCtx = { context: 'bookmark', bookmarkId: props.node.id } as const
  browser.menus.overrideContext(nativeCtx)

  if (!Selection.isBookmarks()) Selection.selectBookmark(props.node.id)

  Menu.open(MenuType.Bookmarks)
}

/**
 * Handle dragstart event.
 */
function onDragStart(e: DragEvent): void {
  Menu.close()
  if (!Selection.isSet()) Selection.selectBookmark(props.node.id)
  Sidebar.updateBounds()

  // Check what to drag
  const toDrag = [props.node.id]
  const dragItems: DragItem[] = []
  const walker = (nodes: Bookmark[]) => {
    for (let node of nodes) {
      const incl = node.parentId && toDrag.includes(node.parentId)
      if (incl || Selection.includes(node.id)) {
        toDrag.push(node.id)
        dragItems.push({
          id: node.id,
          url: node.url,
          title: node.title,
          parentId: node.parentId,
        })
      }
      if (node.children) walker(node.children)
    }
  }
  walker(Bookmarks.reactive.tree)

  const dragInfo: DragInfo = {
    type: DragType.Bookmarks,
    items: dragItems,
    windowId: Windows.id,
    incognito: Windows.incognito,
    panelId: 'bookmarks',
    x: e.clientX,
    y: e.clientY,
  }

  DnD.start(dragInfo, DropType.Bookmarks)

  // Set native drag info
  if (e.dataTransfer) {
    const url = props.node.url ?? ''
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
