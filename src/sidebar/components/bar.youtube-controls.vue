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
  return t.reactive.mediaPaused || t.mediaPaused || !t.reactive.mediaAudible
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
.YouTubeControlsBar
  position: relative
  width: 100%
  flex-shrink: 0
  z-index: 9
  border-top: 1px solid var(--s-darker-border-color, var(--border, transparent))
  background-color: var(--frame-bg)

.YouTubeControlsBar-inner
  display: flex
  width: 100%
  grid-gap: var(--general-margin)
  padding: var(--general-margin)
  padding-top: calc(var(--general-margin) * 0.75)

.YouTubeControlsBar .tool-btn
  position: relative
  display: flex
  justify-content: center
  align-items: center
  width: 100%
  min-width: var(--bottom-bar-height)
  height: var(--bottom-bar-height)
  border-radius: var(--general-border-radius)
  background-color: var(--frame-el-bg)
  box-shadow: var(--frame-el-shadow)
  transition: opacity var(--d-fast)
  > svg
    position: relative
    width: 16px
    height: 16px
    fill: var(--frame-fg)
    opacity: .7
  &:first-child > svg
    transform: rotate(90deg)
  &:nth-child(3) > svg
    transform: rotate(-90deg)
  &:before
    content: ''
    position: absolute
    width: 100%
    height: 100%
    border-radius: var(--general-border-radius)
  &:hover
    > svg
      opacity: 1
    &:before
      background-color: var(--frame-el-overlay-hover-bg)
  &:active:before
    background-color: var(--frame-el-overlay-clicked-bg)
  &[data-disabled="true"]
    pointer-events: none
    box-shadow: none
    > svg
      opacity: .3

.YouTubeControlsBar-hint
  padding: 0 var(--general-margin) var(--general-margin)
  font-size: calc(var(--general-font-size, 12px) * 0.92)
  color: var(--toolbar-fg)
  opacity: .55
  text-align: center
  line-height: 1.25
</style>
