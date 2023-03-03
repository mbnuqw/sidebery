<template lang="pug">
.item(
  :id="'history' + item.id"
  :title="item.tooltip"
  :data-sel="item.sel"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @contextmenu.stop="onCtxMenu")
  .body
    .fav(:title="translate('panel.history.fav_tooltip')" @mousedown.stop="onFavMouseDown")
      svg(v-if="!item.favicon"): use(xlink:href="#icon_ff")
      img(v-else :src="item.favicon")
    .title {{item.title}}
    .inline-info {{item.timeStr}}
</template>

<script lang="ts" setup>
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

const props = defineProps<{ item: HistoryItem }>()

function onMouseDown(e: MouseEvent): void {
  Mouse.setTarget('history', props.item.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!props.item.sel) Selection.selectHistory(props.item.id)
      else Selection.deselectHistory(props.item.id)
      return
    }

    if (Selection.isSet() && !props.item.sel) Selection.resetSelection()
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    Mouse.blockWheel()
    Selection.resetSelection()
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !props.item.sel) Selection.resetSelection()
  }
}

function onMouseUp(e: MouseEvent): void {
  const sameTarget = Mouse.isTarget('history', props.item.id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (!sameTarget) return

  if (e.button === 0 || e.button === 1) {
    let { dst, activateFirstTab: activateNewTab } = Bookmarks.getMouseOpeningConf(e.button)
    // Reset search input, if navigating away from the history panel
    if (Search.reactive.rawValue && activateNewTab) {
      Search.stop()
      Selection.resetSelection()
    }
    History.openTab(props.item, activateNewTab)
  }

  if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.state.ctxMenuNative) {
      Selection.selectHistory(props.item.id)
    }
    if (!Settings.state.ctxMenuNative) Menu.open(MenuType.History, e.clientX, e.clientY)
  }
}

function onFavMouseDown(): void {
  if (!props.item.url) return

  const domain = Utils.getDomainOf(props.item.url)
  if (domain === props.item.url) return

  Search.showBar()
  Search.onOutsideSearchInput(domain)
}

function onCtxMenu(e: MouseEvent): void {
  if (Mouse.isLocked() || !Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !props.item.sel) {
    Selection.resetSelection()
  }

  if (Menu.isBlocked()) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  browser.menus.overrideContext({ showDefaults: false })

  if (!Selection.isSet()) Selection.selectHistory(props.item.id)

  Menu.open(MenuType.History)
}
</script>
