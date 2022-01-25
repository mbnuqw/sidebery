<template lang="pug">
.item(
  :id="'trash' + info.id"
  :title="info.tooltip"
  :data-sel="info.sel"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @contextmenu.stop="onCtxMenu")
  .line
    .type-icon(v-if="typeIcon"): svg: use(:xlink:href="typeIcon")
    .fav(v-if="icon")
      svg(v-if="icon[0] === '#'"): use(:xlink:href="icon")
      img(v-else :src="icon")
    .title(v-if="info.title") {{info.title}}
    svg.-badge(v-if="bookmarkBadge")
      use(xlink:href="#icon_bookmark_badge")
  .line(v-if="details")
    .info {{details}}
    .info.-align-right {{info.rmTimeStr}}
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { MenuType, RemovedItem, TrashPanel } from 'src/types'
import { translate } from 'src/dict'
import { Trash } from 'src/services/trash'
import { Mouse } from 'src/services/mouse'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Favicons } from 'src/services/favicons'
import { Sidebar } from 'src/services/sidebar'
import Utils from 'src/utils'

const props = defineProps<{ info: RemovedItem }>()
const panel = Sidebar.reactive.panelsById.trash as TrashPanel

const bookmarkBadge = computed<boolean>(() => {
  if (!Trash.isRemovedBookmark(props.info)) return false
  return !props.info.subItems && panel.viewMode !== 'bookmarks'
})

const details = computed<string | null>(() => {
  if (Trash.isRemovedTab(props.info)) return props.info.url
  if (Trash.isRemovedWindow(props.info)) return translate('panel.trash.window_info', props.info.len)
  if (Trash.isRemovedBookmark(props.info)) {
    if (props.info.subItems) return translate('panel.trash.bookmark_info', props.info.len)
    else if (props.info.url) return props.info.url
  }
  return null
})

const typeIcon = computed<string>(() => {
  if (Trash.isRemovedWindow(props.info)) return '#icon_win'
  if (Trash.isRemovedBookmark(props.info) && props.info.subItems) return '#icon_folder'
  return ''
})

const icon = computed<string>(() => {
  if (Trash.isRemovedWindow(props.info)) return ''
  if (Trash.isRemovedBookmark(props.info) && props.info.subItems) return ''
  if (!props.info.url) return '#icon_ff'
  const state = Favicons.reactive
  const url = props.info.url
  return state.list[state.domains[Utils.getDomainOf(url)]] || Favicons.getFavPlaceholder(url)
})

function onMouseDown(e: MouseEvent): void {
  Mouse.setTarget('trash', props.info.id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!props.info.sel) Selection.selectTrash(props.info.id)
      else Selection.deselectTrash(props.info.id)
      return
    }

    if (Selection.isSet() && !props.info.sel) Selection.resetSelection()
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    Mouse.blockWheel()
    Selection.resetSelection()
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.reactive.ctxMenuNative && !props.info.sel) Selection.resetSelection()
  }
}

function onMouseUp(e: MouseEvent): void {
  const sameTarget = Mouse.isTarget('trash', props.info.id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (!sameTarget) return

  if (e.button === 0) {
    if (Trash.isRemovedTab(props.info)) Trash.openTab(props.info)
    else if (Trash.isRemovedBookmark(props.info)) Trash.createBookmark(props.info)
    else if (Trash.isRemovedWindow(props.info)) Trash.openWindow(props.info)
  }

  if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.reactive.ctxMenuNative) {
      Selection.selectTrash(props.info.id)
    }
    if (!Settings.reactive.ctxMenuNative) Menu.open(MenuType.Trash, e.clientX, e.clientY)
  }
}

function onCtxMenu(e: MouseEvent): void {
  if (Mouse.isLocked() || !Settings.reactive.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !props.info.sel) {
    Selection.resetSelection()
  }

  if (Menu.isBlocked()) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  browser.menus.overrideContext({ showDefaults: false })

  if (!Selection.isSet()) Selection.selectTrash(props.info.id)

  Menu.open(MenuType.Trash)
}
</script>
