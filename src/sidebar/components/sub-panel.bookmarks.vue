<template lang="pug">
.BookmarksSubPanel(
  :data-active="state.active && Permissions.reactive.bookmarks && !!bookmarks"
  @wheel.stop=""
  @mousedown.stop=""
  @mouseup.stop="onMouseUp"
  @dblclick.stop="")
  .overlay(@click="onOverlayClick")
  .sub-panel
    .bar(:data-loading="state.loadingBar" @click="onBarClick")
      svg.icon: use(xlink:href="#icon_bookmarks_badge")
      .grip
    .content
      ScrollBox(v-if="bookmarks && !state.loading && Permissions.reactive.bookmarks")
        .bookmarks-tree
          BookmarkNode.root-node(v-for="node in bookmarks" :key="node.id" :node="node")
      .loading-screen(v-else-if="state.loading")
        LoadingDots
</template>

<script lang="ts" setup>
import { Bookmarks } from 'src/services/bookmarks'
import { Bookmark, TabsPanel } from 'src/types'
import { reactive, computed } from 'vue'
import { Sidebar } from 'src/services/sidebar'
import ScrollBox from 'src/components/scroll-box.vue'
import BookmarkNode from 'src/components/bookmark-node.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'

const props = defineProps<{ tabsPanel: TabsPanel }>()
const state = reactive({
  active: false,
  loading: false,
  loadingBar: false,
  permitted: Permissions.reactive.bookmarks,
})

const bookmarks = computed<Bookmark[] | undefined>(() => {
  return Bookmarks.reactive.byId[props.tabsPanel.bookmarksFolderId]?.children
})

function onOverlayClick(): void {
  state.active = false
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()
}

function onBarClick(): void {
  if (!Permissions.reactive.bookmarks) {
    SetupPage.open('bookmarks')
    return
  }

  if (!bookmarks.value) {
    loadBookmarks()
    state.active = true
  } else {
    state.active = !state.active
  }

  if (!state.active) {
    if (Selection.isSet()) Selection.resetSelection()
    if (Menu.isOpen) Menu.close()
  }
}

async function loadBookmarks(): Promise<void> {
  state.loading = true
  await Bookmarks.load()
  state.loading = false
}

async function onSaveClick(): Promise<void> {
  if (!Permissions.reactive.bookmarks) return
  state.loadingBar = true
  try {
    await Sidebar.bookmarkTabsPanel(props.tabsPanel.id, true, true)
  } catch {
    state.loadingBar = false
  }
  state.loadingBar = false
}

async function onRestoreClick(): Promise<void> {
  if (!Permissions.reactive.bookmarks) return
  state.loadingBar = true
  try {
    await Sidebar.restoreFromBookmarks(props.tabsPanel, true)
  } catch {
    state.loadingBar = false
  }
  state.loadingBar = false
}

function onMouseUp(): void {
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()
}
</script>
