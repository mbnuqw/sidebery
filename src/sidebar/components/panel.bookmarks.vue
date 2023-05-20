<template lang="pug">
.BookmarksPanel(
  :data-view-mode="panel.viewMode"
  @contextmenu.stop="onNavCtxMenu"
  @mouseup.right="onRightMouseUp"
  @drop="onDrop")
  ScrollBox(ref="scrollBox")
    .bookmarks-tree(v-if="!state.unrendered && panel.reactive.viewMode === 'tree'")
      DragAndDropPointer(:panelId="panel.id" :subPanel="false")
      BookmarkNode.root-node(v-for="node in tree" :key="node.id" :node="node" :panelId="panel.id")

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
          BookmarkCard(v-for="bookmark in group.list" :key="bookmark.id" :node="bookmark")

  PanelPlaceholder(
    :isLoading="(state.unrendered || !panel.reactive.ready)"
    :isNotPerm="!Permissions.reactive.bookmarks"
    :permMsg="translate('panel.bookmarks.req_perm')"
    perm="bookmarks"
    :isMsg="!tree.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { Bookmark, ScrollBoxComponent, BookmarksPanel, DropType, MenuType } from 'src/types'
import { ItemBounds, BookmarksPanelComponent, ItemBoundsType } from 'src/types'
import { BKM_OTHER_ID } from 'src/defaults'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { DnD } from 'src/services/drag-and-drop'
import { Search } from 'src/services/search'
import { Permissions } from 'src/services/permissions'
import ScrollBox from 'src/components/scroll-box.vue'
import BookmarkNode from 'src/components/bookmark-node.vue'
import BookmarkCard from './bookmark-card.vue'
import PanelPlaceholder from './panel-placeholder.vue'
import SubListTitle from './sub-list-title.vue'
import DragAndDropPointer from './dnd-pointer.vue'

interface BookmarksGroup {
  id: ID
  title: string
  list: Bookmark[]
  ctime: number
}

let scrollBoxEl: HTMLElement | undefined

const props = defineProps<{ panel: BookmarksPanel }>()

const scrollBox = ref<ScrollBoxComponent | null>(null)
const state = reactive({
  unrendered: false,

  expandedHistoryGroups: [true, true],

  treeScrollTop: 0,
  historyScrollTop: 0,
  domainsScrollTop: 0,
})

const isActive = computed<boolean>(() => props.panel.id === Sidebar.reactive.activePanelId)
const isFiltering = computed<boolean>(() => !!Search.reactive.value)
const tree = computed(
  () => props.panel.reactive.filteredBookmarks ?? props.panel.reactive.bookmarks ?? []
)

function bookmarksWalker(nodes: Bookmark[], list: Bookmark[]): void {
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

  const bookmarksList: Bookmark[] = props.panel.reactive.filteredBookmarks ?? []
  if (!props.panel.reactive.filteredBookmarks) {
    bookmarksWalker(props.panel.reactive.bookmarks, bookmarksList)
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

function getBounds(): ItemBounds[] {
  const result: ItemBounds[] = []
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
        const el = document.getElementById(`bookmark${bookmark.id}`)
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
      if (scrollBoxEl?.scrollTop) {
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
})

function onDrop(): void {
  DnD.reactive.dstType = DropType.Bookmarks
  if (DnD.reactive.dstParentId === -1) DnD.reactive.dstParentId = BKM_OTHER_ID
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

const publicInterface: BookmarksPanelComponent = { getBounds, toggleGroupById }
defineExpose(publicInterface)
</script>
