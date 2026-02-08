<template lang="pug">
.BookmarksSubPanel
  .content(@drop="onContentDrop")
    ScrollBox(v-if="tree && !state.loading && Permissions.reactive.bookmarks && hostPanel" ref="scrollBox")
      .bookmarks-tree
        DragAndDropPointer(:panelId="bookmarksPanel.id" :subPanel="true")
        BookmarkNode.root-node(
          v-for="nodeId in tree"
          :key="nodeId"
          :nodeId="nodeId"
          :panelId="hostPanel.id")
    .loading-screen(v-else-if="state.loading")
      LoadingDots

    PanelPlaceholder(
      :isNotPerm="!Permissions.reactive.bookmarks"
      :permMsg="translate('panel.bookmarks.req_perm')"
      perm="bookmarks"
      :isMsg="!tree.length && !!Bookmarks.reactive.root.length"
      :msg="translate('panel.nothing')")

  .nav(
    v-if="state.active && !state.loading && props.bookmarksPanel.rootId !== NOID && props.bookmarksPanel.rootId !== BKM_ROOT_ID"
    @drop="onNavDrop")
    .up-btn(:data-inactive="state.rootFolderId === BKM_ROOT_ID" @click="goUp")
      .dnd-layer(@dragenter.stop="goUp")
      svg: use(href="#icon_expand")
    .title-block
      .title(v-if="state.rootFolderTitle" :title="state.rootFolderTitle") {{state.rootFolderTitle}}
    .down-btn(:data-inactive="bookmarksPanel.reactive.rootOffset <= 0" @click="goDown")
      .dnd-layer(@dragenter.stop="goDown")
      svg: use(href="#icon_expand")
</template>

<script lang="ts" setup>
import type { BookmarksPanel, ScrollBoxComponent } from 'src/types'
import { reactive, computed, onMounted, ref, nextTick, onBeforeUnmount } from 'vue'
import { DropType } from 'src/enums'
import { translate } from 'src/dict'
import { BKM_OTHER_ID, BKM_ROOT_ID, NOID } from 'src/defaults'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Permissions from 'src/services/permissions.fg'
import * as Menu from 'src/services/menu.fg'
import * as Selection from 'src/services/selection.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Search from 'src/services/search.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import PanelPlaceholder from './panel-placeholder.vue'
import ScrollBox from 'src/components/scroll-box.vue'
import BookmarkNode from 'src/components/bookmark-node.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import DragAndDropPointer from './dnd-pointer.vue'

const scrollBox = ref<ScrollBoxComponent | null>(null)
const rootTitle = translate('sub_panel.bookmarks_panel.root_title')

const state = reactive({
  active: false,
  loading: false,
  permitted: Permissions.reactive.bookmarks,
  rootFolderId: NOID,
  rootFolderTitle: '',
})
const props = defineProps<{
  bookmarksPanel: BookmarksPanel
}>()
const hostPanel = computed(() => {
  const panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (Utils.isTabsPanel(panel)) return panel
  else return null
})

onMounted(() => {
  open()

  props.bookmarksPanel.pathUp = goUp
  props.bookmarksPanel.pathDown = goDown

  const spId = `${Sidebar.reactive.activePanelId}${props.bookmarksPanel.id}`
  const sbEl = scrollBox.value?.getScrollBox() ?? undefined
  const prevScrollPosition = Sidebar.scrollPositions[spId]
  if (sbEl && prevScrollPosition) sbEl.scrollTop = prevScrollPosition
})

onBeforeUnmount(() => {
  const spId = `${Sidebar.reactive.activePanelId}${props.bookmarksPanel.id}`
  const sbEl = scrollBox.value?.getScrollBox()
  if (sbEl?.scrollTop !== undefined) {
    Sidebar.scrollPositions[spId] = sbEl.scrollTop
  }
})

const tree = computed(() => {
  const panel = props.bookmarksPanel
  const r =
    panel.reactive.filteredBookmarkIds ?? panel.reactive.bookmarkIds ?? Bookmarks.reactive.root
  return r
})

let bookmarksLoading = false
function open() {
  if (bookmarksLoading) return

  if (!Bookmarks.tree.length) {
    state.active = true
    bookmarksLoading = true
    loadBookmarks().then(() => {
      bookmarksLoading = false
      props.bookmarksPanel.ready = true
      checkRootFolder()
      setPanelEls()
      updateRootTree()
      if (Search.active) Search.search()
    })
  } else {
    state.active = !state.active
    checkRootFolder()
    setPanelEls()
    updateRootTree()
  }

  if (!state.active) {
    if (Selection.isSet()) Selection.resetSelection()
  }

  if (Menu.isOpen) Menu.close()
}

function checkRootFolder() {
  const id = props.bookmarksPanel.rootId
  if (id === undefined || id === NOID || id === BKM_ROOT_ID) return

  const node = Bookmarks.byId.get(id)
  if (!node) props.bookmarksPanel.rootId = BKM_ROOT_ID
}

function updateRootTree() {
  const panel = props.bookmarksPanel
  let folder = Bookmarks.byId.get(panel.rootId)
  if (folder) {
    for (let i = panel.reactive.rootOffset; i-- && folder; ) {
      if (folder.parentId === BKM_ROOT_ID) {
        folder = undefined
        break
      }
      folder = Bookmarks.byId.get(folder.parentId)
    }
  }

  state.rootFolderId = folder?.id ?? BKM_ROOT_ID
  state.rootFolderTitle = folder?.title ?? rootTitle

  panel.reactive.bookmarkIds = folder?.getChildrenIds() ?? Bookmarks.reactive.root
}

function setPanelEls() {
  if (scrollBox.value) {
    props.bookmarksPanel.scrollComponent = scrollBox.value
    const scrollBoxEl = scrollBox.value.getScrollBox() ?? undefined
    if (scrollBoxEl) props.bookmarksPanel.scrollEl = scrollBoxEl
  }
}

async function loadBookmarks(): Promise<void> {
  state.loading = true
  await Bookmarks.load()
  state.loading = false
}

function goUp(): boolean {
  if (state.rootFolderId === BKM_ROOT_ID) return false
  props.bookmarksPanel.reactive.rootOffset++
  updateRootTree()

  if (DnD.items.length) {
    nextTick(() => Sidebar.updateBounds())
  }
  return true
}

function goDown(): boolean {
  props.bookmarksPanel.reactive.rootOffset--
  if (props.bookmarksPanel.reactive.rootOffset < 0) props.bookmarksPanel.reactive.rootOffset = 0
  checkRootFolder()
  updateRootTree()

  if (DnD.items.length) {
    nextTick(() => Sidebar.updateBounds())
  }

  if (props.bookmarksPanel.reactive.rootOffset) return true
  else return false
}

function onContentDrop(): void {
  DnD.reactive.dstType = DropType.Bookmarks
  if (DnD.reactive.dstParentId === -1) {
    if (state.rootFolderId === BKM_ROOT_ID) DnD.reactive.dstParentId = BKM_OTHER_ID
    else DnD.reactive.dstParentId = state.rootFolderId
  }
}

function onNavDrop() {
  DnD.reactive.dstType = DropType.Bookmarks
  DnD.reactive.dstIndex = -1
  if (state.rootFolderId === BKM_ROOT_ID) DnD.reactive.dstParentId = BKM_OTHER_ID
  else DnD.reactive.dstParentId = state.rootFolderId
}
</script>
