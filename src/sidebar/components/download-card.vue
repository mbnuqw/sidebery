<template lang="pug">
.DownloadItem(
  :id="'download' + info.uid"
  :title="infoTooltip"
  :data-active="isActive"
  :data-state="info.state"
  :data-sel="info.sel"
  :data-progressless="progressPerc === 0"
  :data-paused="info.paused"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @contextmenu.stop="onCtxMenu")
  .line.-filename
    svg.status-icon(v-if="info.id === -1")
      use(xlink:href="#icon_download_archive")
    svg.status-icon(v-else-if="!isErr && info.state === 'complete'")
      use(xlink:href="#icon_ok_12")
    svg.status-icon(v-else-if="!isErr && info.state === 'in_progress'")
      use(xlink:href="#icon_download_in_progress")
    svg.status-icon(v-else-if="info.paused")
      use(xlink:href="#icon_pause_12")
    svg.status-icon(v-else-if="info.error !== 'USER_CANCELED'")
      use(xlink:href="#icon_excl")
    svg.status-icon(v-else)
      use(xlink:href="#icon_stop")
    .line.-title(@click="openFile" :title="info.name && info.ext && (info.name + info.ext)")
      .name {{info.name}}
      .ext {{info.ext}}
    .line.-speed-info(v-if="isActive && !info.paused && info.state === 'in_progress'")
      .left {{translate('panel.downloads.left', info.leftMS)}}
      .speed {{translate('panel.downloads.bps', info.bytesPerSecond)}}
  .line.-url
    .fav(v-if="favicon"): img(:src="favicon")
    .url(:title="info.referrer || info.url" @click="Downloads.openRef(info)") {{info.referrer || info.url}}
  .line
    .dir(@click="openDir" :title="info.dirPath") {{info.dirPath}}
    .size(v-if="!isErr") {{size}}

    svg.ctrl(v-if="isActive && info.paused" @click="resume(info.id)")
      use(xlink:href="#icon_play")
    svg.ctrl(v-if="isActive && !info.paused && info.state === 'in_progress'" @click="pause(info.id)")
      use(xlink:href="#icon_pause")
    svg.ctrl(v-if="isCancelable" @click="stop(info.id)"): use(xlink:href="#icon_stop")
    svg.ctrl(v-if="isReloadable" @click="Downloads.reload(info)"): use(xlink:href="#icon_reload")
  .progress(v-if="isActive && (info.paused || info.state === 'in_progress')")
    .progress-bar(:style="{ transform: progressTransform }")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { translate } from 'src/dict'
import { DownloadItem, MenuType } from 'src/types'
import Utils from 'src/utils'
import { Favicons } from 'src/services/favicons'
import { Downloads } from 'src/services/downloads'
import { Mouse } from 'src/services/mouse'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'

const props = defineProps<{ info: DownloadItem }>()

const isActive = computed(() => props.info.id > -1)

const isCancelable = computed<boolean>(() => {
  if (props.info.id === -1) return false
  return props.info.state === 'in_progress' || props.info.paused
})

const isReloadable = computed<boolean>(() => {
  if (props.info.id === -1) return false
  return props.info.state === 'interrupted' && !props.info.paused
})

const isErr = computed<boolean>(() => {
  return !props.info.paused && props.info.state === 'interrupted'
})

const favicon = computed<string | undefined>(() => {
  if (props.info.srcDomain) {
    return Favicons.reactive.list[Favicons.reactive.domains[props.info.srcDomain]]
  }
  return undefined
})

const infoTooltip = computed<string>(() => {
  const time = props.info.endMS ?? props.info.startMS
  let state = 'Complete'
  if (props.info.id === -1) state = 'Archived'
  else if (props.info.paused) state = 'Paused'
  else if (props.info.state === 'in_progress') state = 'In progress'
  else if (props.info.state === 'interrupted') state = 'Interrupted'
  const tooltip = `Status: ${state}
Full path: ${props.info.filename}
Time: ${time ? Utils.uTime(time) : '---'}`
  return tooltip
})

const size = computed<string>(() => {
  if (props.info.fileSize > -1) return Utils.bytesToStr(props.info.fileSize)
  if (props.info.bytesReceived > 0 && props.info.bytesReceived < props.info.totalBytes) {
    const total = props.info.totalBytes
    const recv = props.info.bytesReceived
    let tVal = total
    let rVal = recv
    let tD = 0
    let rD = 0

    if (total < 1000) return `${recv} / ${total} b`

    tVal = total / 1024
    rVal = recv / 1024
    if (tVal < 10) return `${rVal.toFixed(2)} / ${Math.round(tVal * 100) / 100} kb`
    if (tVal < 100) return `${rVal.toFixed(1)} / ${Math.round(tVal * 10) / 10} kb`
    if (tVal < 1000) return `${rVal.toFixed(0)} / ${Math.round(tVal)} kb`

    tVal = total / 1048576
    rVal = recv / 1048576
    if (tVal < 10) return `${rVal.toFixed(2)} / ${Math.round(tVal * 100) / 100} mb`
    if (tVal < 100) return `${rVal.toFixed(1)} / ${Math.round(tVal * 10) / 10} mb`
    if (tVal < 1000) return `${rVal.toFixed(0)} / ${Math.round(tVal)} mb`

    tVal = total / 1073741824
    rVal = recv / 1073741824
    if (tVal < 10) return `${rVal.toFixed(2)} / ${Math.round(tVal * 100) / 100} gb`
    if (tVal < 100) return `${rVal.toFixed(1)} / ${Math.round(tVal * 10) / 10} gb`
    return `${rVal.toFixed(0)} / ${Math.round(tVal)} gb`
  }
  if (props.info.totalBytes > -1) return Utils.bytesToStr(props.info.totalBytes)
  return ''
})

const progressPerc = computed<number>(() => {
  const total = props.info.totalBytes
  const recv = props.info.bytesReceived
  if (recv === -1 || total === -1) return 0
  let perc = Math.round((recv / total) * 1000) / 10
  if (perc < 0.1) perc = 0
  if (perc > 100) perc = 100
  return perc
})

let prevProgressTransform = ''
const progressTransform = computed<string>(() => {
  if (progressPerc.value === 0) return prevProgressTransform

  prevProgressTransform = `translateX(${progressPerc.value || 1}%)`
  return prevProgressTransform
})

function openDir(): void {
  if (props.info.id > -1) browser.downloads.show(props.info.id)
}

function openFile(): void {
  if (props.info.id > -1) browser.downloads.open(props.info.id)
}

function resume(id: number): void {
  if (props.info.id > -1) browser.downloads.resume(id)
}

function pause(id: number): void {
  if (props.info.id > -1) browser.downloads.pause(id)
}

function stop(id: number): void {
  if (props.info.id > -1) browser.downloads.cancel(id)
}

function onMouseDown(e: MouseEvent): void {
  const id = props.info.id > -1 ? props.info.id : props.info.uid
  if (!id) return

  Mouse.setTarget('download', id)
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!props.info.sel) Selection.selectDownload(id)
      else Selection.deselectDownload(id)
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
  const id = props.info.id > -1 ? props.info.id : props.info.uid
  if (!id) return

  const sameTarget = Mouse.isTarget('download', id)
  Mouse.resetTarget()
  Mouse.stopLongClick()
  if (!sameTarget) return

  if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.reactive.ctxMenuNative) Selection.selectDownload(id)
    if (!Settings.reactive.ctxMenuNative) Menu.open(MenuType.Downloads, e.clientX, e.clientY)
  }
}

function onCtxMenu(e: MouseEvent): void {
  const id = props.info.id > -1 ? props.info.id : props.info.uid
  if (!id) return

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

  if (!Selection.isSet()) Selection.selectDownload(id)

  Menu.open(MenuType.Downloads)
}
</script>
