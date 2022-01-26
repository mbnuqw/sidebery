<template lang="pug">
.item(
  :id="'history' + item.id"
  :title="item.tooltip"
  :data-sel="item.sel"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp")
  .line
    .fav(:title="'Search this domain'" @mousedown.stop="onFavMouseDown")
      svg(v-if="!item.favicon"): use(xlink:href="#icon_ff")
      img(v-else :src="item.favicon")
    .title {{item.title}}
    .inline-info {{item.timeStr}}
</template>

<script lang="ts" setup>
import { HistoryItem, MenuType } from 'src/types'
import Utils from 'src/utils'
import { Mouse } from 'src/services/mouse'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Search } from 'src/services/search'
import { History } from 'src/services/history'

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
    if (!Settings.reactive.ctxMenuNative && !props.item.sel) Selection.resetSelection()
  }
}

function onMouseUp(e: MouseEvent): void {
  const sameTarget = Mouse.isTarget('history', props.item.id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (!sameTarget) return

  if (e.button === 0) History.openTab(props.item)

  if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.reactive.ctxMenuNative) {
      Selection.selectHistory(props.item.id)
    }
    if (!Settings.reactive.ctxMenuNative) Menu.open(MenuType.History, e.clientX, e.clientY)
  }
}

function onFavMouseDown(): void {
  if (!props.item.url) return

  const domain = Utils.getDomainOf(props.item.url)
  if (domain === props.item.url) return

  Search.showBar()
  Search.onOutsideSearchInput(domain)
}
</script>