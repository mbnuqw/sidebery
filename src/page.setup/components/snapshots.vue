<template lang="pug">
.Snapshots(@click="onClick")
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
            svg: use(href="#icon_trash")

    .active-snapshot-section
      .header(v-if="state.activeSnapshot" :data-empty="!state.activeSnapshot")
        .title(@wheel="onHeaderWheel") {{state.activeSnapshot?.dateStr ?? '?'}} - {{state.activeSnapshot?.timeStr ?? '?'}}
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
            .window-bar(:data-folded="win.folded")
              .drop-down-btn(@click="win.folded = !win.folded")
                svg.exp-icon: use(href="#icon_expand")
              .win-name {{translate('snapshot.window_title') + ' ' + (i + 1)}}
              svg.win-private(v-if="win.private"): use(href="#icon_priv_win")
              .win-len ({{win.tabsLen}} {{translate('snapshot.snap_tab', win.tabsLen)}})
              .btn(@click="openWindow(state.activeSnapshot, i, win.private)").
                {{translate('snapshot.btn_open_win')}}
              .btn(v-if="win.private" @click="openWindow(state.activeSnapshot, i, !win.private)").
                {{translate('snapshot.btn_open_as_norm_win')}}
              .btn(v-else @click="openWindow(state.activeSnapshot, i, !win.private)").
                {{translate('snapshot.btn_open_as_private_win')}}
            .panels(v-show="!win.folded")
              .panel(v-for="panel in win.panels" :key="panel.id")
                .panel-bar(:data-color="panel.color" :data-folded="panel.folded")
                  .drop-down-btn(@click="panel.folded = !panel.folded")
                    svg.exp-icon: use(href="#icon_expand")
                  .icon
                    img(v-if="panel.iconIMG" :src="panel.iconIMG")
                    svg(v-else): use(:href="'#' + panel.iconSVG")
                  .name {{panel.name}}
                  .len {{panel.tabs.length}} {{translate('snapshot.snap_tab', panel.tabs.length)}}
                .tabs(v-show="!panel.folded")
                  SnapTab(
                    v-for="(tab, i) in panel.tabs"
                    v-show="!tab.invisible"
                    :key="tab.id"
                    :index="i"
                    :tab="tab"
                    :panel="panel"
                    :snapshot="state.activeSnapshot"
                    :viewerState="state")
      .selection-bar(:data-active="!!selectedTabsLen")
        .info {{translate('snapshot.selected')}} {{selectedTabsLen}}
        DropDownButton(
          :label="translate('snapshot.sel.open_in')")
          a.snapshot-export-opt(@click="openSelectedTabs(SnapOpenType.NewWindow)")
            .label {{translate('snapshot.sel.open_in_window')}}
          a.snapshot-export-opt(@click="openSelectedTabs(SnapOpenType.NewPrivateWindow)")
            .label {{translate('snapshot.sel.open_in_private_window')}}
          a.snapshot-export-opt(@click="openSelectedTabs(SnapOpenType.CurrentPanel)")
            .label {{translate('snapshot.sel.open_in_panel')}}
        .btn(@click="resetSelection()") {{translate('snapshot.sel.reset_sel')}}

    .placeholder(v-if="!state.snapshots.length")
      .btn(@click="createSnapshot()") {{translate('snapshot.btn_create_first')}}
      .btn
        .label {{translate('snapshot.btn_import_snapshot')}}
        input(type="file" accept="application/json" @input="importSnapshot")
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive } from 'vue'
import * as Utils from 'src/utils'
import {
  ItemInfo,
  NormalizedSnapshot,
  RemovingSnapshotResult,
  SnapExportInfo,
  SnapOpenType,
  Snapshot,
  SnapshotState,
  SnapTabState,
  Stored,
} from 'src/types'
import { CONTAINER_ID, NOID } from 'src/defaults'
import { translate } from 'src/dict'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { Windows } from 'src/services/windows'
import { Store } from 'src/services/storage'
import { Snapshots } from 'src/services/snapshots'
import DropDownButton from 'src/components/drop-down-button.vue'
import SnapTab from './snapshots.tab.vue'
import { SetupPage } from 'src/services/_services'

const SCROLL_CONF = { behavior: 'smooth', block: 'nearest' } as const

const dayStartMs = Utils.getDayStartMS()

export interface SnapshotsViewerState {
  snapshots: SnapshotState[]
  activeSnapshot: SnapshotState | null
  mouseUpShiftTabId: ID | null
  mouseUpShiftMode: boolean
}
const state = reactive({
  snapshots: [],
  activeSnapshot: null,
  mouseUpShiftTabId: null,
  mouseUpShiftMode: true,
} as SnapshotsViewerState)

const selectedTabsLen = computed<number>(() => {
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
      const snapshot = Snapshots.parseSnapshot(stored.snapshots, i, dayStartMs)
      if (snapshot) snapshots.push(snapshot)
    }

    state.snapshots = snapshots
    state.activeSnapshot = snapshots[0]
  }

  Store.onKeyChange('snapshots', onSnapshotsChange)
})()

function onSnapshotsChange(newSnapshots?: Snapshot[]): void {
  if (!newSnapshots) newSnapshots = []

  SetupPage.updStorageInfo('snapshots', newSnapshots)

  updateSnapshots(newSnapshots)
}

function updateSnapshots(newSnapshots: Snapshot[]) {
  const snapshots = []

  // Normalize snapshots
  for (let i = newSnapshots.length; i--; ) {
    let snapshot = Snapshots.parseSnapshot(newSnapshots, i, dayStartMs)
    if (snapshot) snapshots.push(snapshot)
  }

  let activeSnapshot = snapshots.find(s => s.id === state.activeSnapshot?.id) ?? null
  if (!activeSnapshot) resetSelection(state.activeSnapshot)
  if (activeSnapshot) activeSnapshot = state.activeSnapshot

  state.snapshots = snapshots
  state.activeSnapshot = activeSnapshot ?? snapshots[0]
}
SetupPage.snapshotsViewer.refresh = updateSnapshots

function activateSnapshot(snapshot?: SnapshotState): void {
  if (!snapshot || state.activeSnapshot === snapshot) return
  resetSelection(state.activeSnapshot)
  state.activeSnapshot = snapshot
}

function onHeaderWheel(e: WheelEvent): void {
  e.preventDefault()
  e.stopPropagation()

  if (!state.activeSnapshot) return
  let index = state.snapshots.findIndex(s => s.id === state.activeSnapshot?.id)
  if (index === -1) return

  resetSelection(state.activeSnapshot)

  // Down / Up
  let maxIndex = state.snapshots.length - 1
  if (e.deltaY > 0 && index < maxIndex) index++
  if (e.deltaY < 0 && index > 0) index--

  state.activeSnapshot = state.snapshots[index]

  const el = document.getElementById(state.activeSnapshot.id as string)
  if (el) el.scrollIntoView(SCROLL_CONF)
}

function resetSelection(snapshot?: SnapshotState | null): void {
  if (!snapshot && state.activeSnapshot) snapshot = state.activeSnapshot
  if (!snapshot) return

  state.mouseUpShiftTabId = null

  for (const win of snapshot.windows) {
    for (const panel of win.panels) {
      for (const tab of panel.tabs) {
        tab.sel = false
      }
    }
  }
}

function onClick() {
  state.mouseUpShiftTabId = null
  state.mouseUpShiftMode = true
}

async function openSelectedTabs(how: SnapOpenType): Promise<void> {
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
          customTitle: tab.customTitle,
          customColor: tab.customColor,
          title: tab.title,
          container: await Snapshots.adaptContainer(
            state.activeSnapshot,
            tab.containerId ?? CONTAINER_ID
          ),
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

  if (how === SnapOpenType.CurrentPanel) {
    const activePanel = await browser.sidebarAction
      .isOpen({ windowId: Windows.id })
      .then(isOpen => (isOpen ? IPC.sidebar(Windows.id, 'getActivePanelConfig') : undefined))
      .catch(() => undefined)
    if (Utils.isTabsPanel(activePanel)) {
      await IPC.sidebar(Windows.id, 'openTabs', items, { panelId: activePanel.id })
    } else if (activePanel) {
      await IPC.sidebar(Windows.id, 'openTabs', items, { panelId: NOID })
    } else {
      const creating = []
      const oldNewIds: Record<ID, ID> = {}
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

        creating.push(browser.tabs.create(conf).then(t => (oldNewIds[item.id] = t.id)))
      }
      try {
        await Promise.all(creating)
      } catch (err) {
        Logs.err('Snapshots.openSelectedTabs: Cannot open tabs in current panel:', err)
      }
      // Update openerTabId to preserve tree structure
      for (const item of items) {
        if (item.parentId === undefined || item.parentId === NOID) continue
        const tabId = oldNewIds[item.id]
        const openerTabId = oldNewIds[item.parentId]
        if (openerTabId !== undefined) browser.tabs.update(tabId, { openerTabId })
      }
    }
  } else {
    await IPC.bg('createWindowWithTabs', items, {
      incognito: how === SnapOpenType.NewPrivateWindow,
    })
  }
}

async function createSnapshot(): Promise<void> {
  await IPC.bg('createSnapshot')
}

async function openAllWindows(snapshot: SnapshotState | null): Promise<void> {
  if (!snapshot) return

  const normSnapshot = Snapshots.snapshotStateToNormalizedSnapshot(snapshot)

  try {
    await IPC.bg('openSnapshotWindows', normSnapshot)
  } catch (err) {
    Logs.err('Snapshots: Cannot openAllWindows', err)
  }
}

async function openWindow(
  snapshot: SnapshotState | null,
  winIndex: number,
  incognito: boolean
): Promise<void> {
  if (!snapshot) return

  const normSnapshot = Snapshots.snapshotStateToNormalizedSnapshot(snapshot)

  try {
    await IPC.bg('openSnapshotWindows', normSnapshot, winIndex, incognito)
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

let exportInfo: SnapExportInfo | undefined
async function onExportSnapshotDropDownOpen() {
  await nextTick()

  if (!state.activeSnapshot) return

  const normActiveSnapshot: NormalizedSnapshot = {
    id: state.activeSnapshot.id,
    time: state.activeSnapshot.time,
    containers: state.activeSnapshot.containers,
    sidebar: state.activeSnapshot.sidebar,
    tabs: state.activeSnapshot.tabs,
  }

  exportInfo = Snapshots.prepareExport(normActiveSnapshot, { JSON: true, Markdown: true })
  const dateStr = Utils.uDate(exportInfo.time, '.')
  const timeStr = Utils.uTime(exportInfo.time, '.')

  type Link = HTMLAnchorElement | null
  const mdSnapExportLink = document.getElementById('md_snap_export_link') as Link
  const jsonSnapExportLink = document.getElementById('json_snap_export_link') as Link

  if (mdSnapExportLink && exportInfo.mdFile) {
    mdSnapExportLink.href = URL.createObjectURL(exportInfo.mdFile)
    mdSnapExportLink.download = `sidebery-snapshot-${dateStr}-${timeStr}.md`
    mdSnapExportLink.title = `sidebery-snapshot-${dateStr}-${timeStr}.md`
  }
  if (jsonSnapExportLink && exportInfo.jsonFile) {
    jsonSnapExportLink.href = URL.createObjectURL(exportInfo.jsonFile)
    jsonSnapExportLink.download = `sidebery-snapshot-${dateStr}-${timeStr}.json`
    jsonSnapExportLink.title = `sidebery-snapshot-${dateStr}-${timeStr}.json`
  }
}

function copyAsMarkdown() {
  if (!state.activeSnapshot) return

  const { id, time, containers, sidebar, tabs } = state.activeSnapshot
  if (exportInfo?.md) {
    navigator.clipboard.writeText(exportInfo.md)
  } else {
    const markdown = Snapshots.convertToMarkdown({ id, time, containers, sidebar, tabs })
    navigator.clipboard.writeText(markdown)
  }
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
