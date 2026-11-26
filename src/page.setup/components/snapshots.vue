<template lang="pug">
.Snapshots(@click="onClick")
  .wrapper
    //- Empty
    .placeholder(v-if="Snapshots.reactive.ready && !Snapshots.reactive.snapshotsInfo.length")
      .btn(@click="Snapshots.createSnapshot()") {{translate('snapshot.btn_create_first')}}
      .btn
        .label {{translate('snapshot.btn_import_snapshot')}}
        input(type="file" accept="application/json" @input="importSnapshot")
    //- Not ready
    .placeholder(v-else-if="!Snapshots.reactive.ready")
      LoadingDots
    //- Normal state
    template(v-else)
      .snapshot-list-section
        .snapshot-list(:data-empty="!Snapshots.reactive.snapshotsInfo.length")
          .controls
            .btn(@click="Snapshots.createSnapshot()") {{translate('snapshot.btn_create_snapshot')}}
            .btn
              .label {{translate('snapshot.btn_import_snapshot')}}
              input(type="file" accept="application/json" @input="importSnapshot")
          .snapshot(
            v-for="snapInfo in Snapshots.reactive.snapshotsInfo"
            :key="snapInfo.id"
            :id="String(snapInfo.id)"
            :data-active="Snapshots.reactive.activeSnapshot?.id === snapInfo.id"
            @click="Snapshots.activateSnapshot(snapInfo)")
            .info
              .date-time {{snapInfo.dateStr}} - {{snapInfo.timeStr}}
              .content-info {{getSnapInfo(snapInfo)}}
            .rm-btn(:title="translate('snapshot.btn_remove')" @click.stop="removeSnapshot(snapInfo)")
              svg: use(href="#icon_trash")

      .active-snapshot-section
        //- Error
        template(v-if="Snapshots.reactive.activeSnapshotError")
          .error-msg {{Snapshots.reactive.activeSnapshotError}}
        //- Loading
        template(v-else-if="!Snapshots.reactive.activeSnapshot")
          LoadingDots
        //- Normal state
        template(v-else)
          .header(v-if="Snapshots.reactive.activeSnapshot" :data-empty="!Snapshots.reactive.activeSnapshot")
            .title {{Snapshots.reactive.activeSnapshot?.dateStr ?? '?'}} - {{Snapshots.reactive.activeSnapshot?.timeStr ?? '?'}}
            DropDownButton(
              :label="translate('snapshot.btn_export_snapshot')"
              @open="onExportSnapshotDropDownOpen")
              a#json_snap_export_link.snapshot-export-opt
                .label {{translate('snapshot.btn_export_snapshot_json')}}
              a#md_snap_export_link.snapshot-export-opt
                .label {{translate('snapshot.btn_export_snapshot_md')}}
                .note {{translate('snapshot.btn_export_snapshot_md_note')}}
              .snapshot-export-opt(@click="copyAsMarkdown"): .label {{translate('snapshot.btn_copy_snapshot_md')}}
            .btn(@click="openAllWindows(Snapshots.reactive.activeSnapshot)").
              {{translate('snapshot.btn_open_all_win')}}

          .content(v-if="Snapshots.reactive.activeSnapshot")
            .windows
              .window(v-for="(win, i) in Snapshots.reactive.activeSnapshot.windows" :key="i")
                .window-bar(:data-folded="win.reactive.folded")
                  .drop-down-btn(@click="win.reactive.folded = !win.reactive.folded")
                    svg.exp-icon: use(href="#icon_expand")
                  .win-name {{translate('snapshot.window_title') + ' ' + (i + 1)}}
                  svg.win-private(v-if="win.private"): use(href="#icon_priv_win")
                  .win-len ({{win.tabsLen}} {{translate('snapshot.snap_tab', win.tabsLen)}})
                  .btn(@click="openWindow(Snapshots.reactive.activeSnapshot, i, win.private)").
                    {{translate('snapshot.btn_open_win')}}
                  .btn(v-if="win.private" @click="openWindow(Snapshots.reactive.activeSnapshot, i, !win.private)").
                    {{translate('snapshot.btn_open_as_norm_win')}}
                  .btn(v-else @click="openWindow(Snapshots.reactive.activeSnapshot, i, !win.private)").
                    {{translate('snapshot.btn_open_as_private_win')}}
                .panels(v-show="!win.reactive.folded")
                  .panel(v-for="panel in win.panels" :key="panel.id")
                    .panel-bar(:data-color="panel.color" :data-folded="panel.reactive.folded")
                      .drop-down-btn(@click="panel.reactive.folded = !panel.reactive.folded")
                        svg.exp-icon: use(href="#icon_expand")
                      .icon
                        img(v-if="panel.iconIMG" :src="panel.iconIMG")
                        svg(v-else): use(:href="'#' + panel.iconSVG")
                      .name {{panel.name}}
                      .len {{panel.tabs.length}} {{translate('snapshot.snap_tab', panel.tabs.length)}}
                    .tabs(v-show="!panel.reactive.folded")
                      SnapTab(
                        v-for="(tab, i) in panel.tabs"
                        v-show="!tab.reactive.invisible"
                        :key="tab.id"
                        :index="i"
                        :tab="tab")

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
            .btn(@click="Snapshots.reactive.activeSnapshot.resetSelection()") {{translate('snapshot.sel.reset_sel')}}
</template>

<script lang="ts" setup>
import { computed, nextTick } from 'vue'
import type * as T from 'src/types'
import { SnapOpenType } from 'src/enums'
import { CONTAINER_ID, NOID } from 'src/defaults'
import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import * as Windows from 'src/services/windows.fg'
import * as Snapshots from 'src/services/snapshots.fg'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import DropDownButton from 'src/components/drop-down-button.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import SnapTab from './snapshots.tab.vue'

const selectedTabsLen = computed<number>(() => {
  if (!Snapshots.reactive.activeSnapshot) return 0

  let len = 0
  for (const win of Snapshots.reactive.activeSnapshot.windows) {
    for (const panel of win.panels) {
      for (const tab of panel.tabs) {
        if (tab.reactive.sel) len++
      }
    }
  }

  return len
})

void (async function init(): Promise<void> {
  Logs.info('Snapshots.vue.init')
  if (!Snapshots.ready) await Snapshots.waitForSnapshotsReady()
  Logs.info('Snapshots.vue.init: snapshots info loaded!')

  const firstSnapInfo = Snapshots.reactive.snapshotsInfo[0]
  if (firstSnapInfo) Snapshots.activateSnapshot(firstSnapInfo)

  Logs.info('Snapshots.vue.init: done!')
})()

function onClick() {
  if (Snapshots.reactive.activeSnapshot) {
    Snapshots.reactive.activeSnapshot.reactive.selectionFocusTabId = null
    Snapshots.reactive.activeSnapshot.reactive.selectionFocusSelect = true
  }
}

async function openSelectedTabs(how: SnapOpenType): Promise<void> {
  if (!Snapshots.reactive.activeSnapshot) return

  const items: T.ItemInfo[] = []
  for (const win of Snapshots.reactive.activeSnapshot.windows) {
    const ids: Record<ID, boolean> = {}
    const tabsByLvl: Record<number, Snapshots.SnapshotVMTabStruct> = {}
    for (const panel of win.panels) {
      for (const tab of panel.tabs) {
        if (tab.id === undefined) continue
        tabsByLvl[tab.lvl ?? 0] = tab
        if (!tab.reactive.sel) continue
        ids[tab.id] = true

        let url: string | undefined = tab.url
        if (Utils.isGroupUrl(url)) url = Utils.updateGroupUrlBase(url)
        else if (Utils.isPlaceholderUrl(url)) url = Utils.updatePlaceholderUrlBase(url)
        else url = Utils.sanitizeUrl(url, tab.title)

        const item: T.ItemInfo = {
          id: tab.id,
          url,
          customTitle: tab.customTitle,
          customColor: tab.customColor,
          title: tab.title,
          container: await Snapshots.adaptContainer(
            Snapshots.reactive.activeSnapshot,
            tab.containerId ?? CONTAINER_ID
          ),
        }
        if (tab.lvl && tab.lvl > 0) {
          let shift = 1
          let parent = tabsByLvl[tab.lvl - shift]
          while (parent && !parent.reactive.sel) parent = tabsByLvl[tab.lvl - ++shift]
          if (parent?.reactive.sel) item.parentId = parent.id
        }
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
          url: item.url,
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

async function openAllWindows(snapshot: Snapshots.SnapshotVMStruct | null): Promise<void> {
  if (!snapshot) return

  try {
    await IPC.bg('openSnapshotWindows', snapshot.getSnapshot())
  } catch (err) {
    Logs.err('Snapshots: Cannot openAllWindows', err)
  }
}

async function openWindow(
  snapshot: Snapshots.SnapshotVMStruct | null,
  winIndex: number,
  incognito: boolean
): Promise<void> {
  if (!snapshot) return

  try {
    await IPC.bg('openSnapshotWindows', snapshot.getSnapshot(), winIndex, incognito)
  } catch (err) {
    Logs.err('Snapshots: Cannot openWindow', err)
  }
}

let removing = false
async function removeSnapshot(snapshot: T.SnapshotInfo): Promise<void> {
  if (removing) return
  Logs.info('Snapshots.removeSnapshot:', snapshot.id)

  removing = true
  try {
    await IPC.bg('removeSnapshot', snapshot.id)
    removing = false
  } catch (err) {
    removing = false
    Logs.err('Snapshots: Unable to remove snapshot:', err)
    return
  }
  Logs.info('Snapshots.removeSnapshot: Done')
}

function getSnapInfo(s: T.SnapshotInfo): string {
  return (
    `${s.winCount} ${translate('snapshot.snap_win', s.winCount)} / ` +
    `${s.tabCount} ${translate('snapshot.snap_tab', s.tabCount)} / ${s.sizeStr}`
  )
}

let exportInfo: T.SnapExportInfo | undefined
async function onExportSnapshotDropDownOpen() {
  await nextTick()

  const activeSnapshot = Snapshots.reactive.activeSnapshot
  if (!activeSnapshot) return

  exportInfo = Snapshots.prepareExport(activeSnapshot.getSnapshot(), { json: true, md: true })
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
  if (!Snapshots.reactive.activeSnapshot) return

  const { id, time, containers, sidebar, tabs } = Snapshots.reactive.activeSnapshot
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
  reader.onload = async fileEvent => {
    if (!fileEvent.target) return Logs.err('Cannot import snapshot: No file content')
    let jsonStr = fileEvent.target.result
    if (!jsonStr || typeof jsonStr !== 'string') {
      return Logs.err('Cannot import snapshot: Wrong file content')
    }

    let snapshot: T.Snapshot | undefined
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

    Snapshots.addSnapshot(snapshot, true)
  }
  reader.readAsText(file)
}
</script>
