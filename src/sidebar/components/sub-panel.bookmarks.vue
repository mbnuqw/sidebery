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
import { Notifications } from 'src/services/notifications'
import { BKM_ROOT_ID, Err, NOID } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
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

function onWrongRootFolder(): void {
  state.active = false
  Sidebar.closeSubPanel()

  const title = translate('notif.bookmarks_sub_panel.no_root.title')
  const details = translate('notif.bookmarks_sub_panel.no_root.details')
  Notifications.notify({
    title,
    details,
    lvl: 'err',
    ctrl: translate('notif.bookmarks_sub_panel.no_root.save'),
    callback: () => {
      Sidebar.bookmarkTabsPanel(props.panel.id, true).catch(err => {
        if (err !== Err.Canceled) Logs.err('BookmarksSubPanel.onWrongRootFolder', err)
      })
    },
  })

  const panel = Sidebar.reactive.panelsById[props.panel.id]
  if (Utils.isTabsPanel(panel)) {
    panel.bookmarksFolderId = NOID
    Sidebar.saveSidebar()
  }
}

let bookmarksLoading = false
async function open(): Promise<void> {
  if (bookmarksLoading) return
  if (!Permissions.reactive.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return
  }

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
