<template lang="pug">
.item(:id="'history' + visit.id")
  .body(
    :title="visit.reactive.tooltip"
    :data-sel="visit.reactive.sel"
    @mousedown.stop="onMouseDown($event, visit)"
    @mouseup.stop="onMouseUp($event, visit)"
    @contextmenu.stop="onCtxMenu($event, visit)"
    draggable="true"
    @dragstart="onDragStart($event, visit)")
    .title-line
      .fav(:title="translate('panel.history.fav_tooltip')" @mousedown.stop="onFavMouseDown($event, visit)")
        svg(v-if="!favicon"): use(xlink:href="#icon_ff")
        img(v-else :src="favicon")
      .title {{visit.reactive.title}}
    .url-line
      .url {{visit.decodedUrl}}
        .inltm -{{visit.timeStr}}
      .time {{visit.timeStr}}
  template(v-if="visit.reactive.moreVisits")
    .body.-more(
      v-if="!moreActive && !Search.reactive.rawValue"
      @click="onMoreClick")
      .more {{translate('panel.history.show_more')}} {{visit.reactive.moreVisits.length}}
    HistoryItem(
      v-else
      v-for="visitId in visit.reactive.moreVisits"
      :key="visitId"
      :visit="History.byId[visitId]")
</template>

<script lang="ts">
export default { name: 'HistoryItem' }
</script>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { DragInfo, DragType, Visit, MenuType } from 'src/types'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Mouse } from 'src/services/mouse'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Search } from 'src/services/search'
import { History } from 'src/services/history'
import { Sidebar } from 'src/services/sidebar'
import { DnD } from 'src/services/drag-and-drop'
import { Windows } from 'src/services/windows'
import { Favicons } from 'src/services/favicons'

const moreActive = ref(false)
const props = defineProps<{ visit: Visit }>()

const favicon = computed(() => {
  return Favicons.reactive.list[Favicons.reactive.domains[props.visit.domain]]
})

function onMouseDown(e: MouseEvent, visit: Visit): void {
  Mouse.setTarget('history', visit.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!visit.reactive.sel) Selection.selectHistory(visit.id)
      else Selection.deselectHistory(visit.id)
      return
    }
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    Mouse.blockWheel()
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !visit.reactive.sel) Selection.resetSelection()
  }
}

function onMouseUp(e: MouseEvent, visit: Visit): void {
  const sameTarget = Mouse.isTarget('history', visit.id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (!sameTarget) return

  if (e.button === 0 || e.button === 1) {
    if (Selection.isHistory() && !Search.rawValue) {
      return Selection.resetSelection()
    }

    if (e.button === 1) {
      const action = Settings.state.historyMidClickAction
      if (action === 'forget_visit') return History.deleteVisits([visit.id])
    }

    let conf = History.getMouseOpeningConf(e.button)
    // Reset search input, if navigating away from the history panel
    if (Search.rawValue && conf.activateFirstTab) {
      Search.stop()
      Selection.resetSelection()
    }
    History.open(visit, conf.dst, conf.useActiveTab, conf.activateFirstTab)
  }

  if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.state.ctxMenuNative) {
      Selection.selectHistory(visit.id)
    }
    if (!Settings.state.ctxMenuNative) Menu.open(MenuType.History, e.clientX, e.clientY)
  }
}

function onMoreClick() {
  moreActive.value = true
}

function onFavMouseDown(e: MouseEvent, visit: Visit): void {
  if (!visit.url) return

  const domain = Utils.getDomainOf(visit.url)
  if (domain === visit.url) return

  Selection.resetSelection()

  Search.showBar()
  Search.onOutsideSearchInput(domain)
}

function onCtxMenu(e: MouseEvent, visit: Visit): void {
  if (Mouse.isLocked() || !Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !visit.reactive.sel) {
    Selection.resetSelection()
  }

  if (Menu.isBlocked()) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  browser.menus.overrideContext({ showDefaults: false })

  if (!Selection.isSet()) Selection.selectHistory(visit.id)

  Menu.open(MenuType.History)
}

function onDragStart(e: DragEvent, visit: Visit): void {
  Menu.close()
  if (!Selection.isSet()) Selection.selectHistory(visit.id)
  Sidebar.updateBounds()

  const dragInfo: DragInfo = {
    type: DragType.History,
    items: [{ id: visit.id, url: visit.url, title: visit.title }],
    windowId: Windows.id,
    x: e.clientX,
    y: e.clientY,
  }

  DnD.start(dragInfo)

  // Set native drag info
  if (e.dataTransfer) {
    const url = visit.decodedUrl ?? ''
    const dragImgEl = document.getElementById('drag_image')
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    if (Settings.state.dndOutside === 'data' ? !e.altKey : e.altKey) {
      e.dataTransfer.setData('text/uri-list', url)
      e.dataTransfer.setData('text/plain', url)
    }
    if (dragImgEl) e.dataTransfer.setDragImage(dragImgEl, -3, -3)
    e.dataTransfer.effectAllowed = 'copyMove'
  }
}
</script>
