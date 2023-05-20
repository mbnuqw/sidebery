<template lang="pug">
.BookmarksSubPanel(@drop="onDrop")
  .content
    ScrollBox(v-if="tree && !state.loading && Permissions.reactive.bookmarks && hostPanel" ref="scrollBox")
      .bookmarks-tree
        DragAndDropPointer(:panelId="bookmarksPanel.id" :subPanel="true")
        BookmarkNode.root-node(
          v-for="node in tree"
          :key="node.id"
          :node="node"
          :panelId="hostPanel.id")
    .loading-screen(v-else-if="state.loading")
      LoadingDots

    PanelPlaceholder(
      :isNotPerm="!Permissions.reactive.bookmarks"
      :permMsg="translate('panel.bookmarks.req_perm')"
      perm="bookmarks"
      :isMsg="!tree.length && !!Bookmarks.reactive.tree.length"
      :msg="translate('panel.nothing')")

  .nav(v-if="state.active && !state.loading && props.bookmarksPanel.rootId !== NOID && props.bookmarksPanel.rootId !== BKM_ROOT_ID")
    .up-btn(:data-inactive="state.rootFolderId === BKM_ROOT_ID" @click="goUp")
      .dnd-layer(@dragenter.stop="goUp")
      svg: use(xlink:href="#icon_expand")
    .title-block
      .title(v-if="state.rootFolderTitle" :title="state.rootFolderTitle") {{state.rootFolderTitle}}
    .down-btn(:data-inactive="bookmarksPanel.reactive.rootOffset <= 0" @click="goDown")
      .dnd-layer(@dragenter.stop="goDown")
      svg: use(xlink:href="#icon_expand")
</template>

<script lang="ts" setup>
import { Bookmark, BookmarksPanel, DropType, ScrollBoxComponent } from 'src/types'
import { reactive, computed, onMounted, ref, nextTick } from 'vue'
import { translate } from 'src/dict'
import { BKM_OTHER_ID, BKM_ROOT_ID, NOID } from 'src/defaults'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import { Bookmarks } from 'src/services/bookmarks'
import { Permissions } from 'src/services/permissions'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Sidebar } from 'src/services/sidebar'
import { Search } from 'src/services/search'
import PanelPlaceholder from './panel-placeholder.vue'
import ScrollBox from 'src/components/scroll-box.vue'
import BookmarkNode from 'src/components/bookmark-node.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import DragAndDropPointer from './dnd-pointer.vue'
import { DnD } from 'src/services/drag-and-drop'

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
})

const tree = computed(() => {
  const panel = props.bookmarksPanel
  const r = panel.reactive.filteredBookmarks ?? panel.reactive.bookmarks ?? Bookmarks.reactive.tree
  return r
})

let bookmarksLoading = false
function open() {
  if (bookmarksLoading) return

  if (!Bookmarks.reactive.tree.length) {
    state.active = true
    bookmarksLoading = true
    loadBookmarks().then(() => {
      bookmarksLoading = false
      props.bookmarksPanel.ready = true
      setPanelEls()
      updateRootTree()
      if (Search.reactive.rawValue) Search.search()
    })
  } else {
    state.active = !state.active
    setPanelEls()
    updateRootTree()
  }

  if (!state.active) {
    if (Selection.isSet()) Selection.resetSelection()
  }

  if (Menu.isOpen) Menu.close()
}

function updateRootTree() {
  const panel = props.bookmarksPanel
  let folder = Bookmarks.reactive.byId[panel.rootId] as Bookmark | undefined
  if (folder) {
    for (let i = panel.reactive.rootOffset; i-- && folder; ) {
      if (folder.parentId === BKM_ROOT_ID) {
        folder = undefined
        break
      }
      folder = Bookmarks.reactive.byId[folder.parentId]
    }
  }

  state.rootFolderId = folder?.id ?? BKM_ROOT_ID
  state.rootFolderTitle = folder?.title ?? rootTitle

  panel.reactive.bookmarks = folder?.children ?? Bookmarks.reactive.tree
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

function goUp(): void {
  if (state.rootFolderId === BKM_ROOT_ID) return
  props.bookmarksPanel.reactive.rootOffset++
  updateRootTree()

  if (DnD.items.length) {
    nextTick(() => Sidebar.updateBounds())
  }
}

function goDown(): void {
  props.bookmarksPanel.reactive.rootOffset--
  if (props.bookmarksPanel.reactive.rootOffset < 0) props.bookmarksPanel.reactive.rootOffset = 0
  updateRootTree()

  if (DnD.items.length) {
    nextTick(() => Sidebar.updateBounds())
  }
}

function onDrop(): void {
  DnD.reactive.dstType = DropType.Bookmarks
  if (DnD.reactive.dstParentId === -1) {
    const panel = props.bookmarksPanel
    if (panel.rootId !== NOID && panel.rootId !== BKM_ROOT_ID) {
      DnD.reactive.dstParentId = panel.rootId
    } else {
      DnD.reactive.dstParentId = BKM_OTHER_ID
    }
  }
}
</script>
