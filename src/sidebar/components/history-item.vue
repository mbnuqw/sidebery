<template lang="pug">
.item(:id="'history' + item.id")
  .body(
    :title="item.tooltip"
    :data-sel="item.sel"
    @mousedown.stop="onMouseDown($event, item)"
    @mouseup.stop="onMouseUp($event, item)"
    @contextmenu.stop="onCtxMenu($event, item)")
    .title-line
      .fav(:title="translate('panel.history.fav_tooltip')" @mousedown.stop="onFavMouseDown($event, item)")
        svg(v-if="!item.favicon"): use(xlink:href="#icon_ff")
        img(v-else :src="item.favicon")
      .title {{item.title}}
      .inline-info {{item.timeStr}}
    .url-line {{item.info}}
  template(v-if="item.moreItems")
    .body.-more(
      v-if="!moreActive && !Search.reactive.rawValue"
      @click="onMoreClick")
      .title-line
        .title
        .inline-info {{translate('panel.history.show_more')}} {{item.moreItems.length}}
    .body.-av(
      v-else
      v-for="subItem in item.moreItems"
      :id="'history' + subItem.id"
      :data-sel="subItem.sel"
      :key="subItem.lastVisitTime"
      @mousedown.stop="onMouseDown($event, subItem)"
      @mouseup.stop="onMouseUp($event, subItem)"
      @contextmenu.stop="onCtxMenu($event, subItem)")
      .title-line
        .fav(:title="translate('panel.history.fav_tooltip')" @mousedown.stop="onFavMouseDown($event, subItem)")
          svg(v-if="!subItem.favicon"): use(xlink:href="#icon_ff")
          img(v-else :src="subItem.favicon")
        .title {{subItem.title}}
        .inline-info {{subItem.timeStr}}
      .url-line {{subItem.info}}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { HistoryItem, MenuType } from 'src/types'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Mouse } from 'src/services/mouse'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Search } from 'src/services/search'
import { History } from 'src/services/history'
import { Bookmarks } from 'src/services/bookmarks'

const moreActive = ref(false)
defineProps<{ item: HistoryItem }>()

function onMouseDown(e: MouseEvent, item: HistoryItem): void {
  Mouse.setTarget('history', item.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!item.sel) Selection.selectHistory(item.id)
      else Selection.deselectHistory(item.id)
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
    if (!Settings.state.ctxMenuNative && !item.sel) Selection.resetSelection()
  }
}

function onMouseUp(e: MouseEvent, item: HistoryItem): void {
  const sameTarget = Mouse.isTarget('history', item.id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (!sameTarget) return

  if (e.button === 0 || e.button === 1) {
    if (Selection.isHistory() && !Search.rawValue) {
      return Selection.resetSelection()
    }

    if (e.button === 1) {
      const action = Settings.state.historyMidClickAction
      if (action === 'forget_visit') return History.deleteVisits([item.id])
    }

    let conf = History.getMouseOpeningConf(e.button)
    // Reset search input, if navigating away from the history panel
    if (Search.rawValue && conf.activateFirstTab) {
      Search.stop()
      Selection.resetSelection()
    }
    History.open(item, conf.dst, conf.useActiveTab, conf.activateFirstTab)
  }

  if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.state.ctxMenuNative) {
      Selection.selectHistory(item.id)
    }
    if (!Settings.state.ctxMenuNative) Menu.open(MenuType.History, e.clientX, e.clientY)
  }
}

function onMoreClick() {
  moreActive.value = true
}

function onFavMouseDown(e: MouseEvent, item: HistoryItem): void {
  if (!item.url) return

  const domain = Utils.getDomainOf(item.url)
  if (domain === item.url) return

  Search.showBar()
  Search.onOutsideSearchInput(domain)
}

function onCtxMenu(e: MouseEvent, item: HistoryItem): void {
  if (Mouse.isLocked() || !Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !item.sel) {
    Selection.resetSelection()
  }

  if (Menu.isBlocked()) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  browser.menus.overrideContext({ showDefaults: false })

  if (!Selection.isSet()) Selection.selectHistory(item.id)

  Menu.open(MenuType.History)
}
</script>
