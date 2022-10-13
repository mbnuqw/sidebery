<template lang="pug">
.BookmarksSubPanel(
  :data-active="state.active && Permissions.reactive.bookmarks"
  @wheel.stop=""
  @mousedown.stop=""
  @mouseup.stop="onMouseUp"
  @dblclick.stop=""
  @mouseleave="onMouseLeave"
  @mouseenter="onMouseEnter")
  .overlay(@click="closeSubPanel")
  .sub-panel
    .bar(v-if="!state.active" :data-loading="state.loadingBar" @click="onBarClick")
      svg.icon: use(xlink:href="#icon_bookmarks_badge")
      .grip
      .len(v-if="rootFolder?.len") {{rootFolder.len}}
    .nav(v-else-if="rootFolder")
      .up-btn(:data-inactive="rootFolder.id === BKM_ROOT_ID" @click="goUp")
        svg: use(xlink:href="#icon_expand")
      .title-block
        .title(v-if="rootFolder.title" :title="rootFolder.title") {{rootFolder.title}}
      .down-btn(:data-inactive="state.navOffset <= 0" @click="goDown")
        svg: use(xlink:href="#icon_expand")
    .content
      ScrollBox(v-if="rootFolder?.children && !state.loading && Permissions.reactive.bookmarks")
        .bookmarks-tree
          BookmarkNode.root-node(
            v-for="node in rootFolder?.children"
            :key="node.id"
            :node="node"
            :panelId="tabsPanel.id")
      .loading-screen(v-else-if="state.loading")
        LoadingDots
</template>

<script lang="ts" setup>
import { Bookmarks } from 'src/services/bookmarks'
import { Bookmark, MenuType, TabsPanel } from 'src/types'
import { reactive, computed } from 'vue'
import ScrollBox from 'src/components/scroll-box.vue'
import BookmarkNode from 'src/components/bookmark-node.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { translate } from 'src/dict'
import { Notifications } from 'src/services/notifications'
import { BKM_ROOT_ID, Err, NOID } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
import * as Logs from 'src/services/logs'

const props = defineProps<{ tabsPanel: TabsPanel }>()
const state = reactive({
  active: false,
  loading: false,
  loadingBar: false,
  permitted: Permissions.reactive.bookmarks,
  navOffset: 0,
})

function goUp(): void {
  if (rootFolder.value?.id === BKM_ROOT_ID) return
  state.navOffset++
}

function goDown(): void {
  state.navOffset--
  if (state.navOffset < 0) state.navOffset = 0
}

const CLOSE_ON_LEAVE_TIMEOUT = 300

const bookmarksRoot = computed<Bookmark | undefined>(() => {
  return {
    id: BKM_ROOT_ID,
    type: 'folder',
    children: Bookmarks.reactive.tree,
    index: 0,
    parentId: NOID,
    title: translate('panel.bookmarks.title'),
  }
})

const rootFolder = computed<Bookmark | undefined>(() => {
  let folder = Bookmarks.reactive.byId[props.tabsPanel.bookmarksFolderId]
  for (let i = state.navOffset; i-- && folder; ) {
    if (folder.parentId === BKM_ROOT_ID) return bookmarksRoot.value
    folder = Bookmarks.reactive.byId[folder.parentId]
  }
  return folder
})

function closeSubPanel(): void {
  state.active = false
  state.navOffset = 0
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()
  clearTimeout(onMouseLeaveTimeout)
}

function onWrongRootFolder(): void {
  state.active = false

  const title = translate('notif.bookmarks_sub_panel.no_root.title')
  const details = translate('notif.bookmarks_sub_panel.no_root.details')
  Notifications.notify({
    title,
    details,
    lvl: 'err',
    ctrl: translate('notif.bookmarks_sub_panel.no_root.save'),
    callback: () => {
      Sidebar.bookmarkTabsPanel(props.tabsPanel.id, true).catch(err => {
        if (err !== Err.Canceled) Logs.err('BookmarksSubPanel.onWrongRootFolder', err)
      })
    },
  })
  props.tabsPanel.bookmarksFolderId = NOID
  Sidebar.saveSidebar()
}

let bookmarksLoading = false
async function onBarClick(): Promise<void> {
  if (bookmarksLoading) return
  if (!Permissions.reactive.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return
  }

  if (!rootFolder.value) {
    state.active = true
    if (!Bookmarks.reactive.tree.length) {
      bookmarksLoading = true
      loadBookmarks().then(() => {
        bookmarksLoading = false
        if (!Bookmarks.reactive.byId[props.tabsPanel.bookmarksFolderId]) {
          onWrongRootFolder()
        }
      })
    } else if (!Bookmarks.reactive.byId[props.tabsPanel.bookmarksFolderId]) {
      return onWrongRootFolder()
    }
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

function onMouseUp(e: MouseEvent): void {
  if (Selection.isSet()) Selection.resetSelection()
  if (Menu.isOpen) Menu.close()

  if (e.button === 2 && !Settings.state.ctxMenuNative) {
    Selection.selectNavItem(props.tabsPanel.id)
    Menu.open(MenuType.TabsPanel, e.clientX, e.clientY)
  }
}

let onMouseLeaveTimeout: number | undefined
function onMouseLeave(): void {
  if (state.loading) return
  if (Menu.isOpen) return

  clearTimeout(onMouseLeaveTimeout)
  onMouseLeaveTimeout = setTimeout(() => {
    closeSubPanel()
  }, CLOSE_ON_LEAVE_TIMEOUT)
}

function onMouseEnter(): void {
  clearTimeout(onMouseLeaveTimeout)
  if (
    Settings.state.openSubPanelOnMouseHover &&
    !state.active &&
    !Notifications.hiddenRecently &&
    Permissions.reactive.bookmarks
  ) {
    onBarClick()
  }
}
</script>
