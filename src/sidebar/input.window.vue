<template lang="pug">
.WinInput(v-noise:300.g:12:af.a:0:42.s:0:9="", :ready="isReady", @click="cancel")
  scroll-box(ref="scrollBox")
    .box(v-for="(w, i) in $root.winChoosing", :key="w.id")
      .win(@click.stop="w.choose")
        .title {{w.title}}
        img(:src="w.screen", @load="onScreenLoad(i)")
  .ctrls
    .btn {{t('window_input.cancel')}}
</template>


<script>
import ScrollBox from './scroll-box'

export default {
  components: {
    ScrollBox,
  },

  data() {
    return {}
  },

  computed: {
    isReady() {
      if (!this.$root.winChoosing || !this.$root.winChoosing.length) return false
      return this.$root.winChoosing.reduce((o, w) => o && w.loaded, true)
    },
  },

  methods: {
    onScreenLoad(index) {
      let win = this.$root.winChoosing[index]
      this.$root.winChoosing.splice(index, 1, { ...win, loaded: true })
    },

    cancel() {
      this.$root.winChoosing = this.$root.winChoosing.map(w => {
        return { ...w, loaded: false }
      })
      setTimeout(() => {
        this.$root.winChoosing = null
      }, 120)
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

.WinInput
  box(absolute, flex)
  pos(0, 0)
  size(100%, same)
  flex-direction: column
  z-index: -1
  background-color: var(--bg)
  opacity: 0
  transition: opacity var(--d-fast), z-index var(--d-fast)
.WinInput[is-active]
  opacity: 1
  z-index: 1500
  
.WinInput[is-active][ready]
  .box
    opacity: 1
    transform: translateY(0)
  .box:nth-child(1)
    transition: opacity var(--d-fast), transform var(--d-fast)
  .box:nth-child(2)
    transition: opacity var(--d-fast) .1s, transform var(--d-fast) .1s
  .box:nth-child(3)
    transition: opacity var(--d-fast) .2s, transform var(--d-fast) .2s
  .box:nth-child(4)
    transition: opacity var(--d-fast) .3s, transform var(--d-fast) .3s
  .box:nth-child(5)
    transition: opacity var(--d-fast) .4s, transform var(--d-fast) .4s

.WinInput .box
  box(relative)
  padding: 16px
  opacity: 0
  transform: translateY(16px)
  transition: opacity var(--d-fast), transform var(--d-fast)

.WinInput .win
  box(relative)
  size(100%, max-h: 240px)
  border-radius: 3px
  overflow: hidden
  box-shadow: 0 0 0 1px var(--window-input-border), 0 2px 12px 0 #12121228
  cursor: pointer
  opacity: .8
  transition: opacity var(--d-fast)
  &:hover
    opacity: 1
  &:active
    transition: none
    opacity: .8

.WinInput .win > .title
  box(relative)
  text(s: rem(14))
  color: var(--window-input-title-fg)
  padding: 2px 8px
  margin: 0 0 1px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  background-color: var(--window-input-title-bg)
  box-shadow: 0 1px 0 0 var(--window-input-border)

.WinInput .win > img
  box(relative, block)
  size(max-w: 100%)
  margin: 0
  padding: 0

.WinInput .ctrls
  box(relative, flex)
  size(100%, 48px)
  justify-content: center
  align-items: center

.WinInput .ctrls > .btn
  text(s: rem(14))
  padding: 3px 10px
  margin: 0 8px
</style>
