<template lang="pug">
.DownloadsIcon(:data-mode="mode" :data-done="state.done" :data-error="state.error")
  svg.icon: use(xlink:href="#icon_arrow_down")
  .progress.-zero
  .progress.-a(
    :data-loading="mode > 0 && items[0]?.state === 'in_progress'"
    :data-paused="mode > 0 && !!items[0]?.paused")
    .bar(:style="{ transform: getTransform(items[0]) }")
  .progress.-b(
    :data-loading="mode > 0 && items[1]?.state === 'in_progress'"
    :data-paused="mode > 0 && !!items[1]?.paused")
    .bar(:style="{ transform: getTransform(items[1]) }")
  .progress.-c(
    :data-loading="mode > 0 && items[2]?.state === 'in_progress'"
    :data-paused="mode > 0 && !!items[2]?.paused")
    .bar(:style="{ transform: getTransform(items[2]) }")
</template>

<script lang="ts" setup>
import { reactive, computed, watch } from 'vue'
import { DownloadItem } from 'src/types'
import { Downloads } from 'src/services/downloads'
import { Sidebar } from 'src/services/sidebar'

const state = reactive({
  done: false,
  error: false,
})

const items = computed<DownloadItem[]>(() => {
  const output: DownloadItem[] = []

  for (let item: DownloadItem, i = Downloads.reactive.list.length; i--; ) {
    item = Downloads.reactive.list[i]
    if (item.id > -1 && (item.paused || item.state === 'in_progress')) output.push(item)
    if (output.length === 3) break
  }

  return output
})

const mode = computed<number>(() => {
  let value = 0

  for (const item of items.value) {
    if (item.bytesReceived > 0) value++
  }

  return value
})

watch(items, (items, prevItems) => {
  // Start
  if (!prevItems.length && items.length) {
    const panel = Sidebar.reactive.panelsById.downloads
    if (panel && panel.loading) panel.loading = false
  }

  // End
  if (prevItems.length && !items.length) {
    const firstPrevItem = prevItems[0]
    if (firstPrevItem && firstPrevItem.state === 'complete') state.done = true
    else state.error = true

    setTimeout(() => {
      const panel = Sidebar.reactive.panelsById.downloads
      if (panel && Sidebar.reactive.activePanelId !== 'downloads') {
        if (state.done) panel.loading = 'ok'
        if (state.error) panel.loading = 'err'
      }

      state.done = false
      state.error = false
    }, 1111)
  }
})

function getTransform(item?: DownloadItem): string | undefined {
  if (!item || mode.value === 0) return undefined

  const total = item.totalBytes
  const recv = item.bytesReceived
  if (recv === -1 || total === -1) return 'translateX(0%)'
  let perc = Math.round((recv / total) * 1000) / 10
  if (perc < 0.1) perc = 0
  if (perc > 100) perc = 100
  return `translateX(${perc}%)`
}
</script>
