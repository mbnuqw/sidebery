<template lang="pug">
.tab(
  draggable="true"
  :title="tab.customTitle ?? tab.title"
  :id="String(tab.id)"
  :data-folded="tab.folded"
  :data-invisible="tab.invisible"
  :data-sel="tab.sel"
  :data-lvl="tab.lvl"
  :data-pinned="tab.pinned"
  :data-color="tab.containerColor"
  :data-shift-sel="viewerState.mouseUpShiftTabId === tab.id"
  @click.stop.prevent=""
  @dragstart="onTabDragStart"
  @mousedown="onTabMouseDown($event, tab)"
  @mouseup.stop.prevent="onTabMouseUp($event, tab)")
  .container-mark(v-if="tab.containerIcon")
  .drop-down-btn(
    v-if="tab.isParent"
    @click="Snapshots.foldBranchInViewer(index, panel.tabs)"
    @mousedown.stop.prevent=""
    @mouseup.stop.prevent="")
    svg.exp-icon: use(xlink:href="#icon_expand")
    .branch-len {{tab.branchLen}}
  .icon
    img(
      v-if="tab.domain && Favicons.reactive.byDomains[tab.domain]"
      :src="Favicons.reactive.byDomains[tab.domain]")
    svg(v-else): use(:xlink:href="tab.iconSVG")
    svg.pin(v-if="tab.pinned"): use(xlink:href="#icon_pin")
  .title-url
    .title {{tab.customTitle ?? tab.title}}
    a.url(
      target="_blank"
      draggable="false"
      :href="tab.url") {{tab.url}}
  .checkbox(
    :data-sel="tab.sel"
    @mousedown="onCheckboxMouseDown($event, tab)"
    @mouseup="onCheckboxMouseUp($event, tab)")
</template>

<script lang="ts" setup>
import { ItemInfo, SnapPanelState, SnapshotState, SnapTabState } from 'src/types'
import { CONTAINER_ID, NOID } from 'src/defaults'
import { Snapshots } from 'src/services/snapshots'
import { Favicons } from 'src/services/_services.fg'
import { IPC, Logs, Utils } from 'src/services/_services'
import { Windows } from 'src/services/windows'
import { SnapshotsViewerState } from './snapshots.vue'

interface SnapTabProps {
  index: number
  tab: SnapTabState
  panel: SnapPanelState
  viewerState: SnapshotsViewerState
}

const props = defineProps<SnapTabProps>()

const LONG_CLICK_DELAY = 700
let longClickTimeout: number | undefined
let mouseDownTabId: ID | undefined
function onTabMouseDown(e: MouseEvent, tab: SnapTabState): void {
  mouseDownTabId = tab.id
  clearTimeout(longClickTimeout)

  if (e.button === 0) {
    longClickTimeout = setTimeout(() => {
      tab.sel = true
      mouseDownTabId = undefined
    }, LONG_CLICK_DELAY)
  }
}

function onTabMouseUp(e: MouseEvent, tab: SnapTabState): void {
  clearTimeout(longClickTimeout)
  if (mouseDownTabId !== tab.id) {
    mouseDownTabId = undefined
    return
  }
  mouseDownTabId = undefined

  if (e.shiftKey && e.button === 0) {
    if (props.viewerState.mouseUpShiftTabId === null) {
      props.viewerState.mouseUpShiftTabId = tab.id ?? null
      tab.sel = !tab.sel
      props.viewerState.mouseUpShiftMode = tab.sel
    } else {
      selectRange(props.viewerState.mouseUpShiftTabId, tab.id, !props.viewerState.mouseUpShiftMode)
      props.viewerState.mouseUpShiftTabId = null
    }
    return
  }

  if (e.ctrlKey && e.button === 0) {
    tab.sel = !tab.sel
    return
  }

  props.viewerState.mouseUpShiftTabId = null

  if (e.button === 0) openTab(tab)
}

function onCheckboxMouseDown(e: MouseEvent, tab: SnapTabState): void {
  mouseDownTabId = tab.id
}

function onCheckboxMouseUp(e: MouseEvent, tab: SnapTabState): void {
  if (mouseDownTabId !== tab.id) {
    mouseDownTabId = undefined
    return
  }
  mouseDownTabId = undefined

  if (e.shiftKey && e.button === 0) {
    if (props.viewerState.mouseUpShiftTabId === null) {
      props.viewerState.mouseUpShiftTabId = tab.id ?? null
      tab.sel = !tab.sel
      props.viewerState.mouseUpShiftMode = tab.sel
    } else {
      selectRange(props.viewerState.mouseUpShiftTabId, tab.id, !props.viewerState.mouseUpShiftMode)
      props.viewerState.mouseUpShiftTabId = null
    }
    return
  }
  props.viewerState.mouseUpShiftTabId = null

  if (e.button === 0) {
    tab.sel = !tab.sel
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

async function openTab(tab: SnapTabState): Promise<void> {
  let activePanel
  try {
    activePanel = await IPC.sidebar(Windows.id, 'getActivePanelConfig')
  } catch (err) {
    Logs.err('snapshots.tab.openTab: Unable to getActivePanelConfig:', err)
  }

  if (Utils.isTabsPanel(activePanel)) {
    const item: ItemInfo = {
      id: tab.id ?? NOID,
      url: Snapshots.updateInternalUrl(tab.url),
      customTitle: tab.customTitle,
      title: tab.title,
      container: tab.containerId ?? CONTAINER_ID,
    }
    await IPC.sidebar(Windows.id, 'openTabs', [item], { panelId: activePanel.id })
  } else {
    const conf: browser.tabs.CreateProperties = {
      url: Utils.normalizeUrl(Snapshots.updateInternalUrl(tab.url), tab.title),
      windowId: Windows.id,
      active: false,
      cookieStoreId: tab.containerId ?? CONTAINER_ID,
    }
    browser.tabs.create(conf)
  }
}

function selectRange(tabAId: ID, tabBId?: ID, deselectActually = false): void {
  if (!props.viewerState.activeSnapshot) return
  if (tabBId === undefined) tabBId = tabAId
  const oneTab = tabAId === tabBId
  let inRange = false

  for (const win of props.viewerState.activeSnapshot.windows) {
    for (const panel of win.panels) {
      for (const tab of panel.tabs) {
        if (inRange) tab.sel = !deselectActually

        if (tab.id === tabAId || tab.id === tabBId) {
          inRange = !inRange
          if (inRange) tab.sel = !deselectActually
          if (oneTab) inRange = !inRange
        }
      }
    }
  }
}
</script>
