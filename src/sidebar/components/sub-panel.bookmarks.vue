<template lang="pug">
.BookmarksSubPanel
  .content
    ScrollBox(v-if="tree && !state.loading && Permissions.reactive.bookmarks && hostPanel" ref="scrollBox")
      .bookmarks-tree
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

  .nav(v-if="state.active && !state.loading && rootFolder && props.bookmarksPanel.rootId !== NOID")
    .up-btn(:data-inactive="rootFolder.id === BKM_ROOT_ID" @click="goUp")
      svg: use(xlink:href="#icon_expand")
    .title-block
      .title(v-if="rootFolder.title" :title="rootFolder.title") {{rootFolder.title}}
    .down-btn(:data-inactive="bookmarksPanel.reactive.rootOffset <= 0" @click="goDown")
      svg: use(xlink:href="#icon_expand")
</template>

<script lang="ts" setup>
import { Bookmark, BookmarksPanel, ScrollBoxComponent } from 'src/types'
import { reactive, computed, onMounted, ref } from 'vue'
import { translate } from 'src/dict'
import { BKM_ROOT_ID, NOID } from 'src/defaults'
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

const scrollBox = ref<ScrollBoxComponent | null>(null)

const state = reactive({
  active: false,
  loading: false,
  permitted: Permissions.reactive.bookmarks,
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

function goUp(): void {
  if (rootFolder.value?.id === BKM_ROOT_ID) return
  props.bookmarksPanel.reactive.rootOffset++
}

function goDown(): void {
  props.bookmarksPanel.reactive.rootOffset--
  if (props.bookmarksPanel.reactive.rootOffset < 0) props.bookmarksPanel.reactive.rootOffset = 0
}

const bookmarksRoot = computed<Bookmark>(() => {
  return {
    id: BKM_ROOT_ID,
    type: 'folder',
    children: Bookmarks.reactive.tree,
    index: 0,
    parentId: NOID,
    title: translate('sub_panel.bookmarks_panel.root_title'),
  }
})

const rootFolder = computed<Bookmark>(() => {
  if (!hostPanel.value) return bookmarksRoot.value

  let folder = Bookmarks.reactive.byId[props.bookmarksPanel.rootId] ?? bookmarksRoot.value
  for (let i = props.bookmarksPanel.reactive.rootOffset; i-- && folder; ) {
    if (folder.parentId === BKM_ROOT_ID) return bookmarksRoot.value
    folder = Bookmarks.reactive.byId[folder.parentId]
  }
  return folder
})

const tree = computed(() => {
  const panel = props.bookmarksPanel
  return panel.reactive.filteredBookmarks ?? rootFolder.value.children ?? []
})

let bookmarksLoading = false
function open() {
  if (bookmarksLoading) return

  if (!Bookmarks.reactive.tree.length) {
    state.active = true
    bookmarksLoading = true
    loadBookmarks().then(() => {
      bookmarksLoading = false
      setPanelEls()
      if (Search.reactive.rawValue) Search.search()
    })
  } else {
    state.active = !state.active
    setPanelEls()
  }

  if (!state.active) {
    if (Selection.isSet()) Selection.resetSelection()
  }

  if (Menu.isOpen) Menu.close()
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
</script>
