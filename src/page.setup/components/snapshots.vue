<template lang="pug">
.Snapshots(:data-tab-select-mode="state.selectionMode")
  .wrapper
    .snapshot-list-section
      .snapshot-list(:data-empty="!state.snapshots.length")
        .controls
          .btn(@click="createSnapshot()") {{translate('snapshot.btn_create_snapshot')}}
          .btn
            .label {{translate('snapshot.btn_import_snapshot')}}
            input(type="file" accept="application/json" @input="importSnapshot")
        .snapshot(
          v-for="snapshot in state.snapshots"
          :key="snapshot.id"
          :id="String(snapshot.id)"
          :data-active="state.activeSnapshot?.id === snapshot.id"
          @click="activateSnapshot(snapshot)")
          .info
            .date-time {{snapshot.dateStr}} - {{snapshot.timeStr}}
            .content-info {{getSnapInfo(snapshot)}}
          .rm-btn(:title="translate('snapshot.btn_remove')" @click="removeSnapshot(snapshot)")
            svg: use(xlink:href="#icon_trash")

    .active-snapshot-section(:data-sel-mode="state.selectionMode")
      .header(v-if="state.activeSnapshot" @wheel="onHeaderWheel" :data-empty="!state.activeSnapshot")
        .title {{state.activeSnapshot?.dateStr ?? '?'}} - {{state.activeSnapshot?.timeStr ?? '?'}}
        DropDownButton(
          :label="translate('snapshot.btn_export_snapshot')"
          @open="onExportSnapshotDropDownOpen")
          a#json_snap_export_link.snapshot-export-opt
            .label {{translate('snapshot.btn_export_snapshot_json')}}
          a#md_snap_export_link.snapshot-export-opt
            .label {{translate('snapshot.btn_export_snapshot_md')}}
            .note {{translate('snapshot.btn_export_snapshot_md_note')}}
          .snapshot-export-opt(@click="copyAsMarkdown"): .label {{translate('snapshot.btn_copy_snapshot_md')}}

        .btn(@click="openAllWindows(state.activeSnapshot)").
          {{translate('snapshot.btn_open_all_win')}}
      .content(v-if="state.activeSnapshot")
        .windows
          .window(v-for="(win, i) in state.activeSnapshot.windows" :key="i")
            .window-bar
              .win-name {{translate('snapshot.window_title') + ' ' + (i + 1)}}
              .win-len ({{win.tabsLen}} {{translate('snapshot.snap_tab', win.tabsLen)}})
              .btn(@click="openWindow(state.activeSnapshot, i)") {{translate('snapshot.btn_open_win')}}
            .panels
              .panel(v-for="panel in win.panels" :key="panel.id" :data-void="panel.id === -1")
                .panel-bar(:data-color="panel.color")
                  .icon
                    img(v-if="panel.iconIMG" :src="panel.iconIMG")
                    svg(v-else): use(:xlink:href="'#' + panel.iconSVG")
                  .name {{panel.name}}
                  .len {{panel.tabs.length}} {{translate('snapshot.snap_tab', panel.tabs.length)}}
                .tabs
                  .tab(
                    v-for="tab in panel.tabs"
                    :key="tab.id"
                    :title="tab.title"
                    :id="String(tab.id)"
                    :data-sel="tab.sel"
                    :data-lvl="tab.lvl"
                    :data-pinned="tab.pinned"
                    :data-color="tab.containerColor"
                    @mousedown="onTabMouseDown($event, tab)"
                    @mouseup.stop.prevent="onTabMouseUp($event, tab)"
                    @click.stop.prevent="")
                    a.link(
                      v-if="!state.selectionMode"
                      target="_blank"
                      :href="tab.url"
                      @dragstart="onTabDragStart($event)")
                    .container-mark(v-if="tab.containerIcon")
                    .checkbox(v-if="state.selectionMode" :data-sel="tab.sel")
                    .icon
                      img(
                        v-if="tab.domain && Favicons.reactive.list[Favicons.reactive.domains[tab.domain]]"
                        :src="Favicons.reactive.list[Favicons.reactive.domains[tab.domain]]")
                      svg(v-else): use(:xlink:href="tab.iconSVG")
                      svg.pin(v-if="tab.pinned"): use(xlink:href="#icon_pin")
                    .title-url
                      .title {{tab.title}}
                      .url {{tab.url}}
      .selection-bar(:data-active="state.selectionMode")
        .info {{translate('snapshot.selected')}} {{selectedTabsLen}}
        .btn(
          :class="{'-inactive': !selectedTabsLen}"
          @click="openSelectedTabs()") {{translate('snapshot.sel.open_in_panel')}}
        .btn(
          :class="{'-inactive': !selectedTabsLen}"
          @click="resetSelection()") {{translate('snapshot.sel.reset_sel')}}
        .close-btn(@click="turnOffSelectionMode()"): svg: use(xlink:href="#icon_close")

    .placeholder(v-if="!state.snapshots.length")
      .btn(@click="createSnapshot()") {{translate('snapshot.btn_create_first')}}
</template>

<script lang="ts" setup>
import { reactive, computed, nextTick } from 'vue'
import * as Utils from 'src/utils'
import { Stored, Snapshot, SnapshotState, SnapWindowState, RemovingSnapshotResult } from 'src/types'
import { SnapPanelState, SnapTabState, ItemInfo, NormalizedSnapshot } from 'src/types'
import { CONTAINER_ID, NOID } from 'src/defaults'
import { translate } from 'src/dict'
import * as IPC from 'src/services/ipc'
import { Windows } from 'src/services/windows'
import { Store } from 'src/services/storage'
import { Snapshots } from 'src/services/snapshots'
import { Favicons } from 'src/services/favicons'
import { PanelConfig, PanelType } from 'src/types/sidebar'
import DropDownButton from 'src/components/drop-down-button.vue'
import * as Logs from 'src/services/logs'

const VOID_PANEL_CONF: PanelConfig = {
  type: PanelType.tabs,
  id: -1,
  name: '',
  color: 'toolbar',
  iconSVG: 'icon_tabs',
  iconIMGSrc: '',
  iconIMG: '',
  lockedPanel: false,
  skipOnSwitching: false,
  noEmpty: false,
  newTabCtx: 'none',
  dropTabCtx: 'none',
  moveRules: [],
  bookmarksFolderId: -1,
  newTabBtns: [],
  srcPanelConfig: null,
}
const SCROLL_CONF = { behavior: 'smooth', block: 'nearest' } as const

const dayStartMs = Utils.getDayStartMS()
const state = reactive({
  snapshots: [] as SnapshotState[],
  activeSnapshot: null as SnapshotState | null,
  selectionMode: false,
})

const selectedTabsLen = computed<number>(() => {
  if (!state.selectionMode) return 0
  if (!state.activeSnapshot) return 0

  let len = 0
  for (const win of state.activeSnapshot.windows) {
    for (const panel of win.panels) {
      for (const tab of panel.tabs) {
        if (tab.sel) len++
      }
    }
  }

  return len
})

void (async function init(): Promise<void> {
  const snapshots = []
  let stored
  try {
    stored = await browser.storage.local.get<Stored>('snapshots')
  } catch (err) {
    return Logs.err('Snapshots.vue: init: Cannot get stored snapshots', err)
  }
  if (!stored.snapshots) stored.snapshots = []

  if (stored.snapshots.length > 0) {
    // Normalize snapshots
    for (let i = stored.snapshots.length; i--; ) {
      const snapshot = parseSnapshot(stored.snapshots, i)
      if (snapshot) snapshots.push(snapshot)
    }

    state.snapshots = snapshots
    state.activeSnapshot = snapshots[0]
  }

  Store.onKeyChange('snapshots', onSnapshotsChange)
})()

function onSnapshotsChange(newSnapshots?: Snapshot[]): void {
  if (!newSnapshots) newSnapshots = []
  const snapshots = []

  // Normalize snapshots
  for (let i = newSnapshots.length; i--; ) {
    let snapshot = parseSnapshot(newSnapshots, i)
    if (snapshot) snapshots.push(snapshot)
  }

  let activeSnapshot = snapshots.find(s => s.id === state.activeSnapshot?.id) ?? null
  if (!activeSnapshot && state.selectionMode) turnOffSelectionMode(state.activeSnapshot)
  if (activeSnapshot) activeSnapshot = state.activeSnapshot

  state.snapshots = snapshots
  state.activeSnapshot = activeSnapshot ?? snapshots[0]
}

function parseSnapshot(snapshots: Snapshot[], index: number): SnapshotState | undefined {
  const sizeStr = Utils.strSize(JSON.stringify(snapshots[index]))
  const snapshot = Snapshots.getNormalizedSnapshot(snapshots, index)
  if (!snapshot) return

  const windows: SnapWindowState[] = []
  const winCount = snapshot.tabs.length
  let tabsCount = 0

  // Per windows
  for (const win of snapshot.tabs) {
    if (!win.length) continue

    const panelsById: Record<ID, SnapPanelState> = {}
    const winState: SnapWindowState = { id: tabsCount, panels: [], tabsLen: 0 }
    windows.push(winState)

    // Per panels (or pinned tabs)
    for (const panel of win) {
      if (!panel.length) continue

      // Per tabs
      for (const tab of panel) {
        const container = tab.containerId ? snapshot.containers[tab.containerId] : undefined

        let panelState = panelsById[tab.panelId]
        if (!panelState) {
          let panelConfig = snapshot.sidebar.panels[tab.panelId]
          if (!panelConfig) {
            panelConfig = Utils.cloneObject(VOID_PANEL_CONF)
            tab.panelId = -1
          }

          panelState = {
            id: panelConfig.id,
            tabs: [],
            name: panelConfig.name,
            iconSVG: panelConfig.iconSVG || 'icon_tabs',
            iconIMG: panelConfig.iconIMG,
            color: panelConfig.color,
          }
          panelsById[panelState.id] = panelState
        }

        const tabState: SnapTabState = {
          ...tab,
          id: tabsCount,
          containerIcon: container?.icon,
          containerColor: container?.color,
          domain: Utils.getDomainOf(tab.url),
          iconSVG: Favicons.getFavPlaceholder(tab.url),
          sel: false,
        }

        panelState.tabs.push(tabState)
        tabsCount++
        winState.tabsLen++
      }
    }

    if (panelsById[-1]) winState.panels.push(panelsById[-1])
    for (const id of snapshot.sidebar.nav) {
      const panelState = panelsById[id]
      if (panelState?.tabs.length) winState.panels.push(panelState)
    }
  }

  return {
    ...snapshot,
    windows,
    dateStr: Utils.uDate(snapshot.time, '.', dayStartMs),
    timeStr: Utils.uTime(snapshot.time),
    sizeStr,
    winCount,
    tabsCount,
  }
}

function activateSnapshot(snapshot?: SnapshotState): void {
  if (!snapshot || state.activeSnapshot === snapshot) return
  if (state.selectionMode) turnOffSelectionMode(state.activeSnapshot)
  state.activeSnapshot = snapshot
}

function onHeaderWheel(e: WheelEvent): void {
  e.preventDefault()
  e.stopPropagation()

  if (!state.activeSnapshot) return
  let index = state.snapshots.findIndex(s => s.id === state.activeSnapshot?.id)
  if (index === -1) return

  if (state.selectionMode) turnOffSelectionMode(state.activeSnapshot)

  // Down / Up
  let maxIndex = state.snapshots.length - 1
  if (e.deltaY > 0 && index < maxIndex) index++
  if (e.deltaY < 0 && index > 0) index--

  state.activeSnapshot = state.snapshots[index]

  const el = document.getElementById(state.activeSnapshot.id as string)
  if (el) el.scrollIntoView(SCROLL_CONF)
}

const LONG_CLICK_DELAY = 700
let longClickTimeout: number | undefined
let mouseDownTabId: ID | undefined
function onTabMouseDown(e: MouseEvent, tab: SnapTabState): void {
  mouseDownTabId = tab.id
  clearTimeout(longClickTimeout)

  // Selection mode: OFF
  if (!state.selectionMode && e.button === 0) {
    longClickTimeout = setTimeout(() => {
      state.selectionMode = true
      tab.sel = true
      mouseDownTabId = undefined
    }, LONG_CLICK_DELAY)
  }
}

let mouseUpShiftTabId: ID | undefined
function onTabMouseUp(e: MouseEvent, tab: SnapTabState): void {
  clearTimeout(longClickTimeout)
  if (mouseDownTabId !== tab.id) {
    mouseDownTabId = undefined
    return
  }
  mouseDownTabId = undefined

  if (e.shiftKey && e.button === 0) {
    if (mouseUpShiftTabId === undefined) {
      if (!state.selectionMode) state.selectionMode = true
      mouseUpShiftTabId = tab.id
      tab.sel = !e.altKey
    } else {
      selectRange(mouseUpShiftTabId, tab.id, e.altKey)
      mouseUpShiftTabId = undefined
    }
    return
  }
  mouseUpShiftTabId = undefined

  // Selection mode: ON
  if (state.selectionMode && e.button === 0) {
    tab.sel = !tab.sel
  }

  // Selection mode: OFF
  else {
    if (e.button === 0) openTab(tab)
  }
}

function onTabDragStart(e: DragEvent): void {
  clearTimeout(longClickTimeout)

  const target = e.currentTarget as HTMLElement

  if (target.parentElement) {
    const parentEl = target.parentElement as HTMLElement
    const bounds = parentEl.getBoundingClientRect()
    const x = e.clientX - bounds.x
    const y = e.clientY - bounds.y
    if (e.dataTransfer) e.dataTransfer.setDragImage(target.parentElement, x, y)
  }
}

function turnOffSelectionMode(snapshot?: SnapshotState | null): void {
  state.selectionMode = false
  resetSelection(snapshot)
}

function selectRange(tabAId: ID, tabBId?: ID, deselectActually = false): void {
  if (!state.activeSnapshot) return
  if (!tabBId === undefined) tabBId = tabAId
  const oneTab = tabAId === tabBId
  let inRange = false

  for (const win of state.activeSnapshot.windows) {
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

function resetSelection(snapshot?: SnapshotState | null): void {
  if (!snapshot && state.activeSnapshot) snapshot = state.activeSnapshot
  if (!snapshot) return

  mouseUpShiftTabId = undefined

  for (const win of snapshot.windows) {
    for (const panel of win.panels) {
      for (const tab of panel.tabs) {
        tab.sel = false
      }
    }
  }
}

async function openTab(tab: SnapTabState): Promise<void> {
  const activePanel = await IPC.sidebar(Windows.id, 'getActivePanelConfig')

  if (Utils.isTabsPanel(activePanel)) {
    const item: ItemInfo = {
      id: tab.id ?? NOID,
      url: tab.url,
      title: tab.title,
      container: tab.containerId ?? CONTAINER_ID,
    }
    await IPC.sidebar(Windows.id, 'openTabs', [item], { panelId: activePanel.id })
  } else {
    const conf: browser.tabs.CreateProperties = {
      url: Utils.normalizeUrl(tab.url, tab.title),
      windowId: Windows.id,
      active: false,
      cookieStoreId: tab.containerId ?? CONTAINER_ID,
    }
    browser.tabs.create(conf)
  }
}

async function openSelectedTabs(): Promise<void> {
  if (!state.activeSnapshot) return

  const items: ItemInfo[] = []
  for (const win of state.activeSnapshot.windows) {
    const ids: Record<ID, boolean> = {}
    const tabsByLvl: Record<number, SnapTabState> = {}
    for (const panel of win.panels) {
      for (const tab of panel.tabs) {
        if (tab.id === undefined) continue
        tabsByLvl[tab.lvl ?? 0] = tab
        if (!tab.sel) continue
        ids[tab.id] = true

        const item: ItemInfo = {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          container: tab.containerId ?? CONTAINER_ID,
        }
        if (tab.lvl && tab.lvl > 0) {
          let shift = 1
          let parent = tabsByLvl[tab.lvl - shift]
          while (parent && !parent.sel) parent = tabsByLvl[tab.lvl - ++shift]
          if (parent?.sel) item.parentId = parent.id
        }
        if (tab.parentId !== undefined && ids[tab.parentId]) item.parentId = tab.parentId
        items.push(item)
      }
    }
  }

  const activePanel = await IPC.sidebar(Windows.id, 'getActivePanelConfig')
  if (Utils.isTabsPanel(activePanel)) {
    await IPC.sidebar(Windows.id, 'openTabs', items, { panelId: activePanel.id })
  } else {
    for (const item of items) {
      const conf: browser.tabs.CreateProperties = {
        url: Utils.normalizeUrl(item.url, item.title),
        windowId: Windows.id,
        active: false,
        cookieStoreId: item.container,
      }
      if (conf.url && !conf.url.startsWith('a') && item.title) {
        conf.discarded = true
        conf.title = item.title
        conf.active = false
      }

      browser.tabs.create(conf)
    }
  }
}

async function createSnapshot(): Promise<void> {
  await IPC.bg('createSnapshot')
}

async function openAllWindows(snapshot: SnapshotState | null): Promise<void> {
  if (!snapshot) return

  try {
    await IPC.bg('openSnapshotWindows', Utils.cloneObject(snapshot))
  } catch (err) {
    Logs.err('Snapshots: Cannot openAllWindows', err)
  }
}

async function openWindow(snapshot: SnapshotState | null, winIndex: number): Promise<void> {
  if (!snapshot) return

  try {
    await IPC.bg('openSnapshotWindows', Utils.cloneObject(snapshot), winIndex)
  } catch (err) {
    Logs.err('Snapshots: Cannot openWindow', err)
  }
}

async function removeSnapshot(snapshot: SnapshotState): Promise<void> {
  const result = await IPC.bg('removeSnapshot', snapshot.id)

  if (result === RemovingSnapshotResult.Ok) {
    const index = state.snapshots.findIndex(s => s.id === snapshot.id)
    if (index === -1) return

    if (state.activeSnapshot?.id === snapshot.id) {
      let nextActiveSnapshot = state.snapshots[index - 1]
      if (!nextActiveSnapshot) nextActiveSnapshot = state.snapshots[index + 1]
      state.activeSnapshot = nextActiveSnapshot ?? null
    }

    state.snapshots.splice(index, 1)
    recalcSizes()
  } else {
    Logs.warn('Snapshots: Cannot removeSnapshot')
  }
}



async function recalcSizes(): Promise<void> {
  const storedSnapshots = await Snapshots.getStoredSnapshots()
  if (!storedSnapshots) return

  for (const snapshot of storedSnapshots) {
    const snapshotState = state.snapshots.find(s => s.id === snapshot.id)
    if (snapshotState) snapshotState.sizeStr = Utils.strSize(JSON.stringify(snapshot))
  }
}

function getSnapInfo(s: SnapshotState): string {
  return (
    `${s.winCount} ${translate('snapshot.snap_win', s.winCount)} / ` +
    `${s.tabsCount} ${translate('snapshot.snap_tab', s.tabsCount)} / ` +
    `~ ${s.sizeStr}`
  )
}



async function onExportSnapshotDropDownOpen() {
  await nextTick()

  if (!state.activeSnapshot) return
  const {time,mdFile,jsonFile} = await Snapshots.prepareExport(state.activeSnapshot)

  let dateStr = Utils.uDate(time, '.')
  let timeStr = Utils.uTime(time, '.')

  type Link = HTMLAnchorElement | null
  const mdSnapExportLink = document.getElementById('md_snap_export_link') as Link
  const jsonSnapExportLink = document.getElementById('json_snap_export_link') as Link

  if (mdSnapExportLink) {
    mdSnapExportLink.href = URL.createObjectURL(mdFile)
    mdSnapExportLink.download = `sidebery-snapshot-${dateStr}-${timeStr}.md`
    mdSnapExportLink.title = `sidebery-snapshot-${dateStr}-${timeStr}.md`
  }
  if (jsonSnapExportLink) {
    jsonSnapExportLink.href = URL.createObjectURL(jsonFile)
    jsonSnapExportLink.download = `sidebery-snapshot-${dateStr}-${timeStr}.json`
    jsonSnapExportLink.title = `sidebery-snapshot-${dateStr}-${timeStr}.json`
  }
}

function copyAsMarkdown() {
  if (!state.activeSnapshot) return

  const { id, time, containers, sidebar, tabs } = state.activeSnapshot
  const markdown = Snapshots.convertToMarkdown({ id, time, containers, sidebar, tabs })
  navigator.clipboard.writeText(markdown)
}

function importSnapshot(importEvent: Event) {
  const target = importEvent.target as HTMLInputElement
  let file = target.files?.[0]
  if (!file) return
  let reader = new FileReader()
  reader.onload = fileEvent => {
    if (!fileEvent.target) return Logs.err('Cannot import snapshot: No file content')
    let jsonStr = fileEvent.target.result
    if (!jsonStr || typeof jsonStr !== 'string') {
      return Logs.err('Cannot import snapshot: Wrong file content')
    }

    let snapshot: NormalizedSnapshot | undefined
    try {
      snapshot = JSON.parse(jsonStr)
    } catch (err) {
      return Logs.err('Cannot import snapshot', err)
    }

    if (!snapshot) return Logs.err('Cannot import snapshot: No snapshot')

    const noId = !snapshot.id
    const noTime = !snapshot.time
    const noContainers = !snapshot.containers
    const noSidebar = !snapshot.sidebar
    const noTabs = !snapshot.tabs
    if (noId || noTime || noContainers || noSidebar || noTabs) {
      return Logs.err('Cannot import snapshot: Incomplete snapshot')
    }

    Snapshots.addSnapshot(snapshot)
  }
  reader.readAsText(file)
}
</script>
