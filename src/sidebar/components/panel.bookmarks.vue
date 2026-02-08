<template lang="pug">
.BookmarksPanel(
  :data-view-mode="panel.viewMode"
  @contextmenu.stop="onNavCtxMenu"
  @mouseup.right="onRightMouseUp"
  @drop="onDrop")
  ScrollBox(ref="scrollBox")
    .bookmarks-tree(v-if="!state.unrendered && panel.reactive.viewMode === 'tree'")
      DragAndDropPointer(:panelId="panel.id" :subPanel="false")
      BookmarkNode.root-node(v-for="nodeId in root" :key="nodeId" :nodeId="nodeId" :panelId="panel.id")

    .bookmarks-history(v-if="!state.unrendered && panel.reactive.viewMode === 'history'")
      .group(
        v-for="(group, i) in history"
        :key="group.id"
        :data-folded="!state.expandedHistoryGroups[i] && !isFiltering"
        data-dnd-type="panel"
        data-dnd-id="bookmarks")
        SubListTitle(
          :title="group.title"
          :len="group.list.length"
          :expanded="!!state.expandedHistoryGroups[i] || isFiltering"
          @click="toggleHistoryGroup($event, i)")
        .group-list(v-if="!!state.expandedHistoryGroups[i] || isFiltering")
          BookmarkCard(
            v-for="bookmark in group.list"
            :key="bookmark.id"
            :node="bookmark"
            :panelId="panel.id")

  PanelPlaceholder(
    :isLoading="(state.unrendered || !panel.reactive.ready) && isActive"
    :isNotPerm="!Permissions.reactive.bookmarks"
    :permMsg="translate('panel.bookmarks.req_perm')"
    perm="bookmarks"
    :isMsg="!root.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import type * as T from 'src/types'
import { DropType, MenuType, ItemBoundsType } from 'src/enums'
import { BKM_OTHER_ID, NOID } from 'src/defaults'
import { translate } from 'src/dict'
import * as Settings from 'src/services/settings'
import * as Selection from 'src/services/selection.fg'
import * as Menu from 'src/services/menu.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Search from 'src/services/search.fg'
import * as Permissions from 'src/services/permissions.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import ScrollBox from 'src/components/scroll-box.vue'
import BookmarkNode from 'src/components/bookmark-node.vue'
import BookmarkCard from './bookmark-card.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import SubListTitle from './sub-list-title.vue'
import DragAndDropPointer from './dnd-pointer.vue'

interface BookmarksGroup {
  id: ID
  title: string
  list: Bookmarks.BkmNode[]
  ctime: number
}

let scrollBoxEl: HTMLElement | undefined

const props = defineProps<{ panel: T.BookmarksPanel }>()

const scrollBox = ref<T.ScrollBoxComponent | null>(null)
const state = reactive({
  unrendered: false,

  expandedHistoryGroups: [true, true],
})

const isActive = computed<boolean>(() => props.panel.id === Sidebar.reactive.activePanelId)
const isFiltering = computed<boolean>(() => Search.reactive.active)
const root = computed(
  () => props.panel.reactive.filteredBookmarkIds ?? props.panel.reactive.bookmarkIds ?? []
)

function bookmarksWalker(nodes: Bookmarks.BkmNode[], list: Bookmarks.BkmNode[]): void {
  for (const node of nodes) {
    if (node.url && node.title) list.push(node)
    if (node.children) bookmarksWalker(node.children, list)
  }
}
const history = computed((): BookmarksGroup[] => {
  const output = []
  let group: BookmarksGroup | undefined
  let lastT = ''
  let dt: Date
  let i = 0

  let bookmarksList: Bookmarks.BkmNode[] = []
  if (props.panel.reactive.filteredBookmarkIds && props.panel.filteredBookmarks) {
    bookmarksList = props.panel.filteredBookmarks
  } else {
    bookmarksWalker(Bookmarks.get(props.panel.reactive.bookmarkIds), bookmarksList)
    bookmarksList.sort((a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0))
  }

  for (; i < bookmarksList.length; i++) {
    const b = bookmarksList[i]

    let date: string
    if (b.dateAdded !== undefined) {
      dt = new Date(b.dateAdded)
      date = `${translate(`time.month_${dt.getMonth()}`)}, ${dt.getFullYear()}`
    } else {
      date = '???'
    }

    if (lastT !== date) {
      lastT = date
      group = { id: b.id, title: lastT, list: [], ctime: -1 }
      output.push(group)
    }

    if (group) group.list.push(b)
  }

  return output
})

function getBounds(): T.ItemBounds[] {
  const result: T.ItemBounds[] = []
  let groupIndex = 0
  let expandedGroupPadding: number | undefined
  let headerHeight = 0
  let headerHalf = 0
  let headerQuarter = 0
  let bookmarkHeight = 0
  let bookmarkHalf = 0
  let bookmarkQuarter = 0
  let overallHeight = 0

  for (const group of history.value) {
    // Calc group header height
    if (!headerHeight) {
      const el = document.getElementById(`header${group.title}`)
      if (!el) return []
      headerHeight = el.offsetHeight
      headerHalf = headerHeight >> 1
      headerQuarter = (headerHalf >> 1) + 2
      if (!headerHeight) return []
    }

    // Calc bottom padding of an open group
    if (groupIndex > 0 && state.expandedHistoryGroups[groupIndex - 1]) {
      if (expandedGroupPadding === undefined) {
        const el = document.getElementById(`header${group.title}`)
        const groupEl = el?.parentElement
        if (groupEl) expandedGroupPadding = groupEl.offsetTop - overallHeight
      }

      if (expandedGroupPadding) overallHeight += expandedGroupPadding
    }

    result.push({
      type: ItemBoundsType.Header,
      id: 'header' + group.title,
      index: -1,
      lvl: 0,
      in: false,
      folded: false,
      parent: -1,
      start: overallHeight,
      top: overallHeight + headerQuarter,
      center: overallHeight + headerHalf,
      bottom: overallHeight + headerHalf + headerQuarter,
      end: overallHeight + headerHeight,
    })

    overallHeight += headerHeight

    for (const bookmark of group.list) {
      if (!state.expandedHistoryGroups[groupIndex]) continue

      // Calc bookmark height
      if (!bookmarkHeight) {
        const el = document.getElementById(`bookmark${props.panel.id}${bookmark.id}`)
        if (!el) return []
        bookmarkHeight = el.offsetHeight
        bookmarkHalf = bookmarkHeight >> 1
        bookmarkQuarter = (bookmarkHalf >> 1) + 2
        if (!bookmarkHeight) return []
      }

      result.push({
        type: ItemBoundsType.Bookmarks,
        id: bookmark.id,
        index: bookmark.index,
        lvl: 0,
        in: false,
        folded: false,
        parent: bookmark.parentId,
        start: overallHeight,
        top: overallHeight + bookmarkQuarter,
        center: overallHeight + bookmarkHalf,
        bottom: overallHeight + bookmarkHalf + bookmarkQuarter,
        end: overallHeight + bookmarkHeight,
      })

      overallHeight += bookmarkHeight
    }

    groupIndex++
  }

  return result
}

const DEACTIVATION_DELAY = 2000
let activationTimeout: number | undefined
let deactivationTimeout: number | undefined

watch(isActive, (c, p) => {
  clearTimeout(activationTimeout)
  clearTimeout(deactivationTimeout)

  // Activation
  if (c && !p && state.unrendered) {
    activationTimeout = setTimeout(() => {
      state.unrendered = false
      nextTick(() => {
        const prevScrollPosition = Sidebar.scrollPositions[props.panel.id]
        if (scrollBoxEl && prevScrollPosition) scrollBoxEl.scrollTop = prevScrollPosition
      })
    }, 120)
  }

  // Deactivation
  if (!c && p && !state.unrendered) {
    deactivationTimeout = setTimeout(() => {
      if (scrollBoxEl?.scrollTop !== undefined) {
        Sidebar.scrollPositions[props.panel.id] = scrollBoxEl?.scrollTop
      }
      state.unrendered = true
    }, DEACTIVATION_DELAY)
  }
})

onMounted(() => {
  props.panel.component = publicInterface

  if (scrollBox.value) {
    Sidebar.setPanelScrollBox(props.panel.id, scrollBox.value)
    scrollBoxEl = scrollBox.value.getScrollBox() ?? undefined
    if (scrollBoxEl) Sidebar.setPanelEls(props.panel.id, { scrollBox: scrollBoxEl })
  }

  if (props.panel.id !== Sidebar.activePanelId) state.unrendered = true
})

function onDrop(): void {
  DnD.reactive.dstType = DropType.Bookmarks
  if (DnD.reactive.dstParentId === -1) {
    DnD.reactive.dstParentId = props.panel.rootId === NOID ? BKM_OTHER_ID : props.panel.rootId
  }
}

function onRightMouseUp(e: MouseEvent): void {
  if (Selection.isSet()) return

  e.stopPropagation()

  if (Settings.state.ctxMenuNative) return

  Selection.selectNavItem(props.panel.id)
  Menu.open(MenuType.BookmarksPanel, e.clientX, e.clientY)
}

/**
 * Handle context menu event
 */
function onNavCtxMenu(e: MouseEvent): void {
  if (!Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  let nativeCtx = { showDefaults: false }
  browser.menus.overrideContext(nativeCtx)

  if (!Selection.isSet()) Selection.selectNavItem(props.panel.id)
  Menu.open(MenuType.BookmarksPanel)
}

function toggleHistoryGroup(e: MouseEvent | null, index: number): void {
  if (e && e.altKey) {
    const value = !state.expandedHistoryGroups[index]
    for (let i = 0; i < history.value.length; i++) {
      state.expandedHistoryGroups[i] = value
    }
  } else {
    state.expandedHistoryGroups[index] = !state.expandedHistoryGroups[index]
  }
}

function toggleGroupById(id: ID): void {
  const index = history.value.findIndex(g => id === 'header' + g.title)
  if (index !== -1) toggleHistoryGroup(null, index)
}

const publicInterface: T.BookmarksPanelComponent = { getBounds, toggleGroupById }
defineExpose(publicInterface)
</script>
