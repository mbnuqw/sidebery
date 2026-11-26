<template lang="pug">
.tab(
  draggable="true"
  :title="tab.customTitle ?? tab.title"
  :id="String(tab.id)"
  :data-folded="tab.reactive.folded"
  :data-invisible="tab.reactive.invisible"
  :data-sel="tab.reactive.sel"
  :data-lvl="tab.lvl"
  :data-pinned="tab.pinned"
  :data-container-color="tab.containerColor"
  :data-sel-focus="snapshot.reactive.selectionFocusTabId === tab.id"
  @click.stop.prevent=""
  @dragstart="onTabDragStart"
  @mousedown="onTabMouseDown($event, tab)"
  @mouseup.stop.prevent="onTabMouseUp($event, tab)")
  .container-mark(v-if="tab.containerIcon")
  .color-layer(v-if="tab.customColor" :style="{ '--tab-color': RGB_COLORS[tab.customColor] }")
  .drop-down-btn(
    v-if="tab.isParent"
    @click="tab.toggleBranch"
    @mousedown.stop.prevent=""
    @mouseup.stop.prevent="")
    svg.exp-icon: use(href="#icon_expand")
    .branch-len {{tab.branchLen}}
  .icon
    img(
      v-if="tab.hostname && Favicons.reactive.byDomains[tab.hostname]"
      :src="Favicons.reactive.byDomains[tab.hostname]")
    svg(v-else): use(:href="tab.iconSVG")
    svg.pin(v-if="tab.pinned"): use(href="#icon_pin")
  .title-url
    .title {{tab.customTitle ?? tab.title}}
    a.url(
      target="_blank"
      draggable="false"
      :href="tab.url") {{tab.url}}
  .checkbox(
    :data-sel="tab.reactive.sel"
    @mousedown="onCheckboxMouseDown($event, tab)"
    @mouseup="onCheckboxMouseUp($event, tab)")
</template>

<script lang="ts" setup>
import type { ItemInfo } from 'src/types'
import { CONTAINER_ID, NOID, RGB_COLORS } from 'src/defaults'
import * as Snapshots from 'src/services/snapshots.fg'
import * as Favicons from 'src/services/favicons.fg'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as Windows from 'src/services/windows.fg'

interface SnapTabProps {
  index: number
  tab: Snapshots.SnapshotVMTabStruct
}

const props = defineProps<SnapTabProps>()
const tab = props.tab
const panel: Snapshots.SnapshotVMPanelStruct = tab.panel
const window: Snapshots.SnapshotVMWindowStruct = panel.window
const snapshot: Snapshots.SnapshotVMStruct = window.snapshot

const LONG_CLICK_DELAY = 700
let longClickTimeout: number | undefined
let mouseDownTabId: ID | undefined
function onTabMouseDown(e: MouseEvent, tab: Snapshots.SnapshotVMTabStruct): void {
  mouseDownTabId = tab.id
  clearTimeout(longClickTimeout)

  if (e.button === 0) {
    longClickTimeout = setTimeout(() => {
      tab.toggleSelection({ focus: true, deepIfFolded: true })
      mouseDownTabId = undefined
    }, LONG_CLICK_DELAY)
  }
}

function onTabMouseUp(e: MouseEvent, tab: Snapshots.SnapshotVMTabStruct): void {
  clearTimeout(longClickTimeout)
  if (mouseDownTabId !== tab.id) {
    mouseDownTabId = undefined
    return
  }
  mouseDownTabId = undefined

  if (e.shiftKey && e.button === 0) {
    if (snapshot.reactive.selectionFocusTabId === null) {
      tab.toggleSelection({ focus: true, deepIfFolded: true })
    } else {
      const select = !snapshot.reactive.selectionFocusSelect
      snapshot.setRangeSelection(snapshot.reactive.selectionFocusTabId, tab.id, select)
      snapshot.reactive.selectionFocusTabId = null
    }
    return
  }

  if (e.ctrlKey && e.button === 0) {
    tab.toggleSelection({ focus: false, deepIfFolded: false })
    return
  }

  snapshot.reactive.selectionFocusTabId = null

  if (e.button === 0) openTab(tab)
}

function onCheckboxMouseDown(e: MouseEvent, tab: Snapshots.SnapshotVMTabStruct): void {
  mouseDownTabId = tab.id
}

function onCheckboxMouseUp(e: MouseEvent, tab: Snapshots.SnapshotVMTabStruct): void {
  if (mouseDownTabId !== tab.id) {
    mouseDownTabId = undefined
    return
  }
  mouseDownTabId = undefined

  // Only handle left-click events.
  if (e.button !== 0) return

  if (e.shiftKey) {
    if (snapshot.reactive.selectionFocusTabId === null) {
      tab.toggleSelection({ focus: true, deepIfFolded: true })
    } else {
      const fromId = snapshot.reactive.selectionFocusTabId
      snapshot.setRangeSelection(fromId, tab.id, !snapshot.reactive.selectionFocusSelect)
      snapshot.reactive.selectionFocusTabId = null
    }
  } else {
    tab.toggleSelection({ focus: true, deepIfFolded: true })
  }
}

function onTabDragStart(e: DragEvent): void {
  clearTimeout(longClickTimeout)

  const target = e.currentTarget as HTMLElement
  if (target) {
    const bounds = target.getBoundingClientRect()
    const x = e.clientX - bounds.x
    const y = e.clientY - bounds.y
    if (e.dataTransfer) e.dataTransfer.setDragImage(target, x, y)
  }
}

async function openTab(tab: Snapshots.SnapshotVMTabStruct): Promise<void> {
  const activePanel = await browser.sidebarAction
    .isOpen({ windowId: Windows.id })
    .then(isOpen => (isOpen ? IPC.sidebar(Windows.id, 'getActivePanelConfig') : undefined))
    .catch(() => undefined)

  if (activePanel) {
    const item: ItemInfo = {
      id: tab.id ?? NOID,
      url: Snapshots.updateInternalUrl(tab.url),
      customTitle: tab.customTitle,
      customColor: tab.customColor,
      title: tab.title,
      container: await Snapshots.adaptContainer(snapshot, tab.containerId ?? CONTAINER_ID),
    }
    if (Utils.isTabsPanel(activePanel)) {
      await IPC.sidebar(Windows.id, 'openTabs', [item], { panelId: activePanel.id })
    } else {
      await IPC.sidebar(Windows.id, 'openTabs', [item], { panelId: NOID })
    }
  } else {
    const conf: browser.tabs.CreateProperties = {
      url: Utils.sanitizeUrl(Snapshots.updateInternalUrl(tab.url), tab.title),
      windowId: Windows.id,
      active: false,
      cookieStoreId: tab.containerId ?? CONTAINER_ID,
    }
    browser.tabs.create(conf)
  }
}
</script>
