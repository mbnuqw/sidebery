<template lang="pug">
.BookmarksSubPanel
  .content
    ScrollBox(v-if="rootFolder?.children && !state.loading && Permissions.reactive.bookmarks")
      .bookmarks-tree
        BookmarkNode.root-node(
          v-for="node in rootFolder?.children"
          :key="node.id"
          :node="node"
          :panelId="panel.id")
    .loading-screen(v-else-if="state.loading")
      LoadingDots
  .nav(v-if="state.active && !state.loading && rootFolder && panel.bookmarksFolderId !== NOID")
    .up-btn(:data-inactive="rootFolder.id === BKM_ROOT_ID" @click="goUp")
      svg: use(xlink:href="#icon_expand")
    .title-block
      .title(v-if="rootFolder.title" :title="rootFolder.title") {{rootFolder.title}}
    .down-btn(:data-inactive="state.navOffset <= 0" @click="goDown")
      svg: use(xlink:href="#icon_expand")

  PanelPlaceholder(
    :isNotPerm="!Permissions.reactive.bookmarks"
    :permMsg="translate('panel.bookmarks.req_perm')"
    perm="bookmarks")
</template>

<script lang="ts" setup>
import { Bookmarks } from 'src/services/bookmarks'
import { Bookmark, TabsPanel } from 'src/types'
import { reactive, computed, onMounted } from 'vue'
import ScrollBox from 'src/components/scroll-box.vue'
import BookmarkNode from 'src/components/bookmark-node.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import { Permissions } from 'src/services/permissions'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { translate } from 'src/dict'
import { BKM_ROOT_ID, NOID } from 'src/defaults'
import PanelPlaceholder from './panel-placeholder.vue'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'

const state = reactive({
  active: false,
  loading: false,
  permitted: Permissions.reactive.bookmarks,
  navOffset: 0,
})
const props = defineProps<{ panel: TabsPanel }>()

onMounted(() => {
  open()
})

function goUp(): void {
  if (rootFolder.value?.id === BKM_ROOT_ID) return
  state.navOffset++
}

function goDown(): void {
  state.navOffset--
  if (state.navOffset < 0) state.navOffset = 0
}

const bookmarksRoot = computed<Bookmark | undefined>(() => {
  return {
    id: BKM_ROOT_ID,
    type: 'folder',
    children: Bookmarks.reactive.tree,
    index: 0,
    parentId: NOID,
    title: translate('sub_panel.bookmarks_panel.root_title'),
  }
})

const rootFolder = computed<Bookmark | undefined>(() => {
  let folder = Bookmarks.reactive.byId[props.panel.bookmarksFolderId] ?? bookmarksRoot.value
  for (let i = state.navOffset; i-- && folder; ) {
    if (folder.parentId === BKM_ROOT_ID) return bookmarksRoot.value
    folder = Bookmarks.reactive.byId[folder.parentId]
  }
  return folder
})

let bookmarksLoading = false
function open() {
  if (bookmarksLoading) return

  if (!Bookmarks.reactive.tree.length) {
    state.active = true
    bookmarksLoading = true
    loadBookmarks().then(() => {
      bookmarksLoading = false
    })
  } else {
    state.active = !state.active
  }

  if (!state.active) {
    if (Selection.isSet()) Selection.resetSelection()
  }

  if (Menu.isOpen) Menu.close()
}

async function loadBookmarks(): Promise<void> {
  state.loading = true
  await Bookmarks.load()
  state.loading = false
}
</script>
