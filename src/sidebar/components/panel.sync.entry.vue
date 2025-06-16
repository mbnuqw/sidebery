<template lang="pug">
.SyncEntry(:data-loading="entry.loading")
  .sync-header
    .type(:title="title") {{title}}
    .info
      .profile(v-if="entry.sameProfile") {{translate('sync.entry.this_profile')}}
      .profile(v-else :title="entry.profileName") {{entry.profileName}}
      .date-time {{entry.dateYYYYMMDD}} - {{entry.timeHHMM}}
  .sync-content
    .sync-tab(
      v-for="t in entry.tabs"
      draggable="true"
      :id="'st' + entry.id + t.id"
      :key="t.id"
      :title="`${t.title}\n---\n${t.url}`"
      :data-lvl="t.lvl"
      :data-parent="t.isParent"
      :data-color="t.containerColor"
      @dragstart="onTabDragStart($event, t, entry)"
      @mousedown="onTabMouseDown($event, t, entry)"
      @mouseup="onTabMouseUp($event, t, entry)")
      .body
        .color-layer(v-if="t.customColor" :style="{ '--tab-color': t.customColor }")
        .fav(v-if="t.favicon" @dragstart.stop.prevent)
          svg.fav-icon(v-if="t.favicon.startsWith('#')"): use(:xlink:href="t.favicon")
          img.fav-icon(v-else :src="t.favicon" @error="onFavError(t)" draggable="false")
        .title {{(t.customTitle ?? t.title)}}
        .containerMark(v-if="t.containerId")
    .ctrls
      .btn(
        v-if="entry.type !== Sync.SyncedEntryType.Tabs"
        :class="{'-inactive': entry.loading}"
        @click="onMainAction(entry)") {{translate('sync.entry.import_btn')}}
      .btn(
        v-if="entry.type === Sync.SyncedEntryType.Tabs"
        :class="{'-inactive': entry.loading}"
        @click="openTabs(entry)") {{translate('sync.entry.open_tabs_btn')}}
      .btn(
        :class="{'-inactive': entry.loading}"
        @click="onDelete(entry)") {{translate('sync.entry.rm_btn')}}
</template>

<script lang="ts" setup>
import { Logs, Sync, Utils } from 'src/services/_services'
import { translate } from 'src/dict'
import { SyncedEntry } from 'src/services/sync'
import { Keybindings } from 'src/services/keybindings'
import { Menu } from 'src/services/menu'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'
import { Favicons } from 'src/services/_services.fg'
import { Mouse } from 'src/services/mouse'
import { Tabs } from 'src/services/tabs.fg'
import { DragInfo, DragItem, DragType, DropType, DstPlaceInfo, ItemInfo } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { DnD } from 'src/services/drag-and-drop'
import { Info } from 'src/services/info'

const props = defineProps<{ entry: SyncedEntry }>()
const title = getTypeTitle()

function getTypeTitle() {
  if (props.entry.type === Sync.SyncedEntryType.Tabs) return translate('sync.tabs_title')
  if (props.entry.type === Sync.SyncedEntryType.Settings) return translate('sync.settings_title')
  if (props.entry.type === Sync.SyncedEntryType.Styles) return translate('sync.style_title')
  if (props.entry.type === Sync.SyncedEntryType.Keybindings) return translate('sync.keybindings_title')
  if (props.entry.type === Sync.SyncedEntryType.CtxMenu) return translate('sync.ctx_menu_title')
  return translate('sync.unknown_title')
}

async function onMainAction(entry: SyncedEntry) {
  Logs.info('panel.sync.entry.vue: onMainAction')

  if (entry.loading) return

  entry.loading = true

  await Utils.sleep(500)

  try {
    if (entry.type === Sync.SyncedEntryType.Settings) {
      await Settings.importSyncedSettings(entry)
    }
    if (entry.type === Sync.SyncedEntryType.CtxMenu) {
      await Menu.importSyncedCtxMenu(entry)
    }
    if (entry.type === Sync.SyncedEntryType.Keybindings) {
      await Keybindings.importSyncedKeybindings(entry)
    }
    if (entry.type === Sync.SyncedEntryType.Styles) {
      await Styles.importSyncedStyles(entry)
    }
  } catch (err) {
    Logs.err('onMainAction', err, Utils.clone(entry))
  }

  entry.loading = false
}

async function openTabs(entry: SyncedEntry) {
  if (entry.type !== Sync.SyncedEntryType.Tabs || !entry.tabs) return

  const tabs = entry.tabs
  const toOpen: ItemInfo[] = []
  for (const tab of tabs) {
    let appropriateContainer
    if (tab.containerId && entry.containers) {
      appropriateContainer = Containers.findUnique(entry.containers[tab.containerId])
    }
    toOpen.push({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      parentId: tab.parentId,
      container: Containers.getContainerFor(tab.url) ?? appropriateContainer?.id,
      customColor: tab.customColor,
      customTitle: tab.customTitle,
      folded: tab.folded,
    })
  }
  const dstInfo: DstPlaceInfo = {
    windowId: Windows.id,
    discarded: toOpen.length > 1 ? true : false,
    panelId: Sidebar.getRecentTabsPanelId(),
  }

  if (Info.isSync) await updDstInfoForPopup(dstInfo)

  await Tabs.open(toOpen, dstInfo)
}

async function onDelete(entry: SyncedEntry) {
  Logs.info('panel.sync.entry.vue: onDelete')

  if (entry.loading) return

  entry.loading = true

  try {
    await Sync.remove(entry)
  } catch (err) {
    Logs.err('onDelete', err, Utils.clone(entry))
  }

  entry.loading = false
}

function onFavError(tab: Sync.EntryTab) {
  tab.favicon = Favicons.getFavPlaceholder(tab.url)
}

function onTabMouseDown(e: MouseEvent, tab: Sync.EntryTab, entry: Sync.SyncedEntry) {
  if (!entry.id || !entry.tabs) return

  const mouseTargetId = entry.id + tab.id
  Mouse.setTarget('sync.tab', mouseTargetId)
}

let middleClickReactionTimeout: number | undefined

async function onTabMouseUp(e: MouseEvent, tab: Sync.EntryTab, entry: Sync.SyncedEntry) {
  if (!entry.id || !entry.tabs) return

  const mouseTargetId = entry.id + tab.id
  if (!Mouse.isTarget('sync.tab', mouseTargetId)) return

  Logs.info('onTabMouseUp:', tab)

  const tabInfo: ItemInfo = {
    id: 0,
    url: tab.url,
    title: tab.title,
    customColor: tab.customColor,
    customTitle: tab.customTitle,
  }
  const dstInfo: DstPlaceInfo = {
    windowId: Windows.id,
    discarded: false,
    panelId: Sidebar.getRecentTabsPanelId(),
    containerId: Containers.getContainerFor(tab.url),
  }

  if (e.button === 0) {
    tabInfo.active = true
  } else if (e.button === 1) {
    tabInfo.active = false

    // Visualize clicking
    const elId = 'st' + mouseTargetId
    const el = document.getElementById(elId)
    if (el) {
      el.classList.add('-middle-click')
      clearTimeout(middleClickReactionTimeout)
      middleClickReactionTimeout = setTimeout(() => {
        el.classList.remove('-middle-click')
      }, 300)
    }
  }

  if (Info.isSync) await updDstInfoForPopup(dstInfo)

  await Tabs.open([tabInfo], dstInfo)
}

async function updDstInfoForPopup(dstInfo: DstPlaceInfo) {
  const url = new URL(location.href)
  const params = url.searchParams
  const srcWinIdStr = params.get('w')
  let targetWinId: ID | undefined = parseInt(srcWinIdStr ?? '')
  if (isNaN(targetWinId)) {
    try {
      const window = await browser.windows.getLastFocused({
        windowTypes: ['normal'],
        populate: false,
      })
      targetWinId = window.id
    } catch (err) {
      Logs.err('updDstInfoForPopup: Cannot get last focused window')
    }
  }
  if (targetWinId === undefined) return

  dstInfo.windowId = targetWinId
  delete dstInfo.panelId
}

function onTabDragStart(e: DragEvent, tab: Sync.EntryTab, entry: Sync.SyncedEntry) {
  Sidebar.updateBounds()

  // Check what to drag
  const toDrag = [tab.id]
  const dragItems: DragItem[] = []
  const uriList = []
  const links = []
  const urlTitleList = []
  const branch = getBranch(tab, entry)
  for (const tab of branch) {
    uriList.push(tab.url)
    links.push(`<a href="${tab.url}>${tab.title}</a>`)
    urlTitleList.push(tab.url)
    urlTitleList.push(tab.title)
    toDrag.push(tab.id)

    let appropriateContainer
    if (tab.containerId) {
      appropriateContainer = Containers.findUnique(entry.containers?.[tab.containerId])
    }

    dragItems.push({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      parentId: tab.parentId,
      container: appropriateContainer?.id,
      customColor: tab.customColor,
      customTitle: tab.customTitle,
      folded: tab.folded,
    })
  }

  const dragInfo: DragInfo = {
    type: DragType.Tabs,
    items: dragItems,
    windowId: Windows.id,
    incognito: Windows.incognito,
    panelId: Sidebar.activePanelId,
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

  Sidebar.closeSubPanel()
}

function getBranch(rootTab: Sync.EntryTab, entry: Sync.SyncedEntry): Sync.EntryTab[] {
  const branch: Sync.EntryTab[] = [rootTab]
  const tabs = entry.tabs ?? []

  const startIndex = tabs.findIndex(t => t.id === rootTab.id)
  if (startIndex === -1) return branch

  for (let i = startIndex + 1; i < tabs.length; i++) {
    const tab = tabs[i]
    if (!tab) break
    if (rootTab.lvl >= tab.lvl) break
    branch.push(tab)
  }

  return branch
}
</script>
