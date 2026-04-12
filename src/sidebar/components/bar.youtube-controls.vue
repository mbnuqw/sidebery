<template lang="pug">
.YouTubeControlsBar(:data-disabled="!tab")
  .YouTubeControlsBar-inner
    .tool-btn(
      :data-disabled="!tab"
      @click="onPrev"
      :title="translate('bar.youtube.prev')")
      svg: use(href="#icon_arrow_down")
    .tool-btn(
      :data-disabled="!tab"
      @click="onPlayPause"
      :title="tab && isPaused ? translate('bar.youtube.play') : translate('bar.youtube.pause')")
      svg(v-if="tab && isPaused"): use(href="#icon_play")
      svg(v-else): use(href="#icon_pause")
    .tool-btn(
      :data-disabled="!tab"
      @click="onNext"
      :title="translate('bar.youtube.next')")
      svg: use(href="#icon_arrow_down")
    .tool-btn(
      :data-disabled="!tab"
      @click="onMuteToggle"
      :title="tab && muted ? translate('bar.youtube.unmute') : translate('bar.youtube.mute')")
      svg(v-if="tab && muted"): use(href="#icon_mute")
      svg(v-else): use(href="#icon_loud")
  .YouTubeControlsBar-hint(v-if="!tab") {{ translate('bar.youtube.no_playing') }}
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { translate } from 'src/dict'
import * as YouTube from 'src/services/youtube.fg'

const tab = computed(() => YouTube.getTargetTab())

const isPaused = computed(() => {
  const t = tab.value
  if (!t) return true
  if (t.reactive.mediaPaused || t.mediaPaused) return true
  if (t.reactive.mediaAudible || t.audible) return false
  // Active-tab fallback: treat as playing unless Sidebery marked paused (muted YouTube, etc.)
  if (t.reactive.active) return false
  return true
})

const muted = computed(() => {
  const t = tab.value
  if (!t) return false
  return YouTube.isTargetMuted(t)
})

function onPlayPause(): void {
  if (!tab.value) return
  if (isPaused.value) void YouTube.play()
  else void YouTube.pause()
}

function onMuteToggle(): void {
  const t = tab.value
  if (!t) return
  if (YouTube.isTargetMuted(t)) YouTube.unmute()
  else YouTube.mute()
}

function onPrev(): void {
  void YouTube.prevVideo()
}

function onNext(): void {
  void YouTube.nextVideo()
}
</script>

<style lang="stylus">
/* Layout lives in sidebar.styl (dock + row); keep only icon rotation here */
.YouTubeControlsBar .tool-btn:first-child > svg
  transform: rotate(90deg)
.YouTubeControlsBar .tool-btn:nth-child(3) > svg
  transform: rotate(-90deg)
</style>
