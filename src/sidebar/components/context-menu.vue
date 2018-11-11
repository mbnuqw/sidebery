<template lang="pug">
.CtxMenu(:is-active="aIsActive || bIsActive", @mouseenter="onME", @mouseleave="onML")
  .container(:is-active="aIsActive")
    .box(ref="aBox", :style="aPosStyle")
      .opt(v-for="(opt, i) in aOpts", :key="opt[0]", :title="getTitle(opt[0])", @click="onClick(opt)", @mousedown.stop="")
        span(v-for="out in parseLabel(opt[0])", :style="{color: out.color, fontWeight: out.w}") {{out.label}}
  .container(:is-active="bIsActive")
    .box(ref="bBox", :style="bPosStyle")
      .opt(v-for="(opt, i) in bOpts", :key="opt[0]", :title="getTitle(opt[0])", @click="onClick(opt)", @mousedown.stop="")
        span(v-for="out in parseLabel(opt[0])", :style="{color: out.color, fontWeight: out.w}") {{out.label}}
</template>


<script>
import Store from '../store'
import Getters from '../store.getters'

export default {
  data() {
    return {
      aIsActive: false,
      aOpts: [],
      aPos: 0,
      aDown: true,
      bIsActive: false,
      bOpts: [],
      bPos: 0,
      bDown: true,
    }
  },

  computed: {
    aPosStyle() {
      let style = { transform: `translateY(${this.aPos}px)` }
      if (!this.aDown) style.bottom = '0px'
      return style
    },
    bPosStyle() {
      let style = { transform: `translateY(${this.bPos}px)` }
      if (!this.bDown) style.bottom = '0px'
      return style
    },
  },

  created() {
    Store.watch(Getters.ctxMenu, (c, p) => {
      if (this.leaveT) clearTimeout(this.leaveT)

      let h = this.$root.$el.offsetHeight
      if (c && !p) {
        let rect = c.el.getBoundingClientRect()
        this.aOpts = c.opts
        this.aIsActive = true
        this.$nextTick(() => {
          this.aDown = this.$refs.aBox.offsetHeight + rect.bottom < h
          this.aPos = this.aDown ? rect.bottom : rect.top
        })
      }

      if (c && p) {
        let rect = c.el.getBoundingClientRect()
        if (this.aOpts.length) {
          this.bOpts = c.opts
          this.bIsActive = true
          this.aIsActive = false
          this.$nextTick(() => {
            this.bDown = this.$refs.bBox.offsetHeight + rect.bottom < h
            this.bPos = this.bDown ? rect.bottom : rect.top
          })
          setTimeout(() => {
            this.aOpts = []
          }, 128)
        } else {
          this.aOpts = c.opts
          this.aIsActive = true
          this.bIsActive = false
          this.$nextTick(() => {
            this.aDown = this.$refs.aBox.offsetHeight + rect.bottom < h
            this.aPos = this.aDown ? rect.bottom : rect.top
          })
          setTimeout(() => {
            this.bOpts = []
          }, 128)
        }
      }

      if (!c && p) {
        this.aIsActive = false
        this.bIsActive = false
        setTimeout(() => {
          this.aOpts = []
          this.bOpts = []
        }, 128)
      }
    })
  },

  methods: {
    onME() {
      if (this.leaveT) clearTimeout(this.leaveT)
    },
    onML() {
      this.leaveT = setTimeout(() => {
        Store.commit('closeCtxMenu')
      }, 500)
    },

    onClick(opt) {
      let func = opt[1]
      if (!func) return
      let args = opt.slice(2)
      func(...args)
      Store.commit('closeCtxMenu')
    },

    parseLabel(input) {
      return input.split('||').map(part => {
        let parsed = part.split('>>')
        return {
          label: parsed[parsed.length - 1],
          color: parsed.length > 1 ? parsed[0] : '',
          w: parsed.length > 1 ? '600' : '',
        }
      })
    },

    getTitle(input) {
      return input.split('||').map(part => {
        let parsed = part.split('>>')
        return parsed[parsed.length - 1]
      }).join('')
    }
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.CtxMenu
  box(absolute)
  size(100%, 1px, max-h: 100%)
  pos(0, 0)
  z-index: -1
  opacity: 0
  transition: opacity var(--d-fast), z-index var(--d-fast)
  &[is-active]
    opacity: 1
    z-index: 2000

.CtxMenu .container
  box(absolute)
  pos(0, b: 0)
  size(100%, 0px)
  z-index: -1
  opacity: 0
  transform: translateX(16px)
  transition: opacity var(--d-fast), z-index var(--d-fast), transform var(--d-fast)
  &[is-active]
    opacity: 1
    z-index: 100
    transform: translateX(0)

.CtxMenu .box
  box(absolute)
  pos(r: 0)
  size(max-w: calc(100% - 12px))
  z-index: 30
  padding: 0 0 0 0
  margin: 0
  overflow: hidden
  border-top-left-radius: 3px
  border-bottom-left-radius: 3px
  background-color: var(--ctx-menu-bg)
  box-shadow: var(--ctx-menu-shadow)

.CtxMenu .opt
  box(relative, flex)
  text(s: rem(14))
  align-items: center
  justify-content: flex-start
  padding: 2px 0 2px 8px
  color: var(--ctx-menu-fg)
  white-space: pre
  > span
    box(relative)
    &:last-of-type
      size(100%)
      mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)
      padding: 0 12px 0 0
  &:before
    content: ''
    box(absolute)
    size(100%, same)
    pos(0, 0)
  &:first-of-type
    padding-top: 4px
  &:last-of-type
    padding-bottom: 4px
  &:hover:before
    background-color: var(--ctx-menu-bg-hover)
</style>
