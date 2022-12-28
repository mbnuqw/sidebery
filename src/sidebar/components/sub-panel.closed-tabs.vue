<template lang="pug">
.ClosedTabsSubPanel
  ScrollBox
    .closed-tabs-container
      .closed-tab(
        v-for="rmt in Tabs.reactive.recentlyRemoved"
        :id="'rmt' + rmt.id"
        :key="rmt.id"
        :title="rmt.url"
        :data-lvl="rmt.lvl"
        :data-parent="rmt.isParent"
        draggable="true"
        @dragstart="onTabDragStart($event, rmt)"
        @mousedown="onTabMouseDown($event, rmt)"
        @mouseup="onTabMouseUp($event, rmt)"
        @contextmenu="onTabContextMenu")
        .body
          .flash-fx
          .fav(@dragstart.stop.prevent)
            svg.fav-icon(v-if="!rmt.favIconUrl"): use(:xlink:href="rmt.favPlaceholder")
            img.fav-icon(v-if="rmt.favIconUrl" :src="rmt.favIconUrl" draggable="false")
          .t-box: .title {{rmt.title}}
          .branch-btn(
            @mousedown="onBranchMouseDown($event, rmt)"
            @mouseup="onBranchMouseUp($event, rmt)")
            svg: use(xlink:href="#icon_tree_struct")
          .container-mark(v-if="rmt.containerColor" :data-color="rmt.containerColor")
  .nothing-placeholder(v-if="Tabs.reactive.recentlyRemoved.length === 0")
    .msg {{translate('panel.nothing')}}
</template>

<script lang="ts" setup>
import { reactive, onMounted } from 'vue'
import { TabsPanel, DragItem, DragInfo, DropType, DragType } from 'src/types'
import { translate } from 'src/dict'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { RecentlyRemovedTabInfo, Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { Sidebar } from 'src/services/sidebar'
import { DnD } from 'src/services/drag-and-drop'
import { Windows } from 'src/services/windows'
import ScrollBox from 'src/components/scroll-box.vue'

const state = reactive({
  active: false,
  navOffset: 0,
})
const props = defineProps<{
  panel: TabsPanel
}>()

onMounted(() => {
  if (!state.active) {
    if (Selection.isSet()) Selection.resetSelection()
  }

  if (Menu.isOpen) Menu.close()
})

function onTabMouseDown(e: MouseEvent, tab: RecentlyRemovedTabInfo) {
  Mouse.setTarget('closedTab', tab.id)

  if (e.button === 2) {
    e.stopPropagation()
    e.preventDefault()
  }
}

function onTabMouseUp(e: MouseEvent, tab: RecentlyRemovedTabInfo) {
  const sameTarget = Mouse.isTarget('closedTab', tab.id)
  Mouse.resetTarget()

  if (e.button === 2) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!sameTarget) return

  openTabs(tab, e.button === 1 || (e.button === 0 && e.ctrlKey), e.shiftKey)
}

function onTabContextMenu(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
}

function onBranchMouseDown(e: MouseEvent, tab: RecentlyRemovedTabInfo) {
  Mouse.setTarget('closedTab.branch', tab.id)

  e.stopPropagation()
}

function onBranchMouseUp(e: MouseEvent, tab: RecentlyRemovedTabInfo) {
  const sameTarget = Mouse.isTarget('closedTab.branch', tab.id)
  Mouse.resetTarget()

  e.stopPropagation()

  if (!sameTarget) return

  openTabs(tab, true, true)
}

function onTabDragStart(e: DragEvent, tab: RecentlyRemovedTabInfo) {
  Sidebar.updateBounds()

  // Check what to drag
  const toDrag = [tab.id]
  const dragItems: DragItem[] = []
  const uriList = []
  const links = []
  const urlTitleList = []
  const branch = getBranch(tab)
  for (const tab of branch) {
    uriList.push(tab.url)
    links.push(`<a href="${tab.url}>${tab.title}</a>`)
    urlTitleList.push(tab.url)
    urlTitleList.push(tab.title)
    toDrag.push(tab.id)
    dragItems.push({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      parentId: tab.parentId,
      container: tab.containerId,
    })
  }

  const dragInfo: DragInfo = {
    type: DragType.Tabs,
    items: dragItems,
    windowId: Windows.id,
    incognito: Windows.incognito,
    panelId: props.panel.id,
    x: e.clientX,
    y: e.clientY,
    copy: true,
  }

  DnD.start(dragInfo, DropType.Tabs)

  // Set native drag info
  if (e.dataTransfer) {
    const dragImgEl = document.getElementById('drag_image')
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    if (Settings.state.dndOutside === 'data' ? !e.altKey : e.altKey) {
      const uris = uriList.join('\r\n')
      e.dataTransfer.setData('text/x-moz-url', urlTitleList.join('\r\n'))
      e.dataTransfer.setData('text/uri-list', uris)
      e.dataTransfer.setData('text/plain', uris)
      e.dataTransfer.setData('text/html', links.join('\r\n'))
    }
    if (dragImgEl) e.dataTransfer.setDragImage(dragImgEl, -3, -3)
    e.dataTransfer.effectAllowed = 'copyMove'
  }
}

function getBranch(rootTab: RecentlyRemovedTabInfo): RecentlyRemovedTabInfo[] {
  const branch: RecentlyRemovedTabInfo[] = [rootTab]

  const startIndex = Tabs.reactive.recentlyRemoved.findIndex(t => t.id === rootTab.id)
  if (startIndex === -1) return branch

  for (let i = startIndex + 1; i < Tabs.reactive.recentlyRemoved.length; i++) {
    const tab = Tabs.reactive.recentlyRemoved[i]
    if (!tab) break
    if (rootTab.lvl >= tab.lvl) break
    branch.push(tab)
  }

  return branch
}

async function openTabs(targetTab: RecentlyRemovedTabInfo, inactive: boolean, branch: boolean) {
  if (!targetTab.isParent) branch = false
  if (branch) inactive = true

  const tabsBranch = getBranch(targetTab)
  const tabs = branch ? tabsBranch : [targetTab]
  const dst = { panelId: props.panel.id, discarded: inactive }

  await Tabs.open(tabs, dst)

  // Trigger flash animation
  // const els = []
  // for (const tab of tabs) {
  //   const id = `rmt${tab.id}`
  //   const tabEl = document.getElementById(id)
  //   if (!tabEl) continue
  //   tabEl.setAttribute('data-flash', 'true')
  //   els.push(tabEl)
  // }
  // await Utils.sleep(500)
  // els.forEach(el => el.removeAttribute('data-flash'))

  // Or remove from list
  if (tabs.length === 1) tabsBranch.forEach(t => t.lvl--)
  for (const tab of tabs) {
    const index = Tabs.reactive.recentlyRemoved.findIndex(t => t.id === tab.id)
    if (index !== -1) Tabs.reactive.recentlyRemoved.splice(index, 1)
  }

  if (!Tabs.reactive.recentlyRemoved.length) Sidebar.closeSubPanel()
}
</script>