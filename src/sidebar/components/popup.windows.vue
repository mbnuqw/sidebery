<template lang="pug">
.WindowsPopup.popup-container(:data-ready="isReady" @click="cancel")
  .popup(@click.stop="")
    h2(v-if="Windows.reactive.choosingTitle") {{Windows.reactive.choosingTitle}}
    .list
      ScrollBox
        .box(
          v-for="(win, i) in Windows.reactive.choosing"
          :key="win.id"
          :data-no-screenshot="!win.screen"
          :data-selected="win.sel")
          .win(@click.stop="win.choose")
            .window-title {{normalizeWinTitle(win.title)}}
            img(v-if="win.screen" :src="win.screen" @load="onScreenLoad(i)")
    LoadingDots(v-if="!Windows.reactive.choosing?.length")
    .ctrls
      .btn.-warn(@click="cancel") Cancel
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Windows } from 'src/services/windows'
import ScrollBox from './scroll-box.vue'
import LoadingDots from './loading-dots.vue'
import { Settings } from 'src/services/settings'

const isReady = computed((): boolean => {
  if (!Windows.reactive.choosing || !Windows.reactive.choosing.length) return false
  if (!Windows.reactive.choosing[0].screen) return true
  return Windows.reactive.choosing.reduce<boolean>((o, w) => o && !!w.loaded, true)
})

function onScreenLoad(index: number): void {
  if (!Windows.reactive.choosing) return
  let win = Windows.reactive.choosing[index]
  Windows.reactive.choosing.splice(index, 1, { ...win, loaded: true })
}

function normalizeWinTitle(title: string): string {
  if (Settings.reactive.markWindowPreface) {
    return title.replace(Settings.reactive.markWindowPreface, '')
  }

  return title
}

function cancel(): void {
  if (!Windows.reactive.choosing) return
  Windows.reactive.choosing = Windows.reactive.choosing.map(w => {
    return { ...w, loaded: false }
  })
  setTimeout(() => {
    Windows.reactive.choosing = null
  }, 120)
}
</script>
