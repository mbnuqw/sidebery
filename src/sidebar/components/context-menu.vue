<template lang="pug">
.CtxMenu(:is-active="aIsActive || bIsActive", @mouseenter="onME", @mouseleave="onML")
  .container(:is-active="aIsActive")
    .box(ref="aBox", :style="aPosStyle")
      .opt(v-for="(opt, i) in aOpts"
        :key="opt[0]"
        :title="getTitle(opt[0])"
        :is-selected="isSelected(i)"
        @click="onClick(opt)"
        @mousedown.stop="")
        span(v-for="out in parseLabel(opt[0])"
          :style="{color: out.color, fontWeight: out.w}") {{out.label}}
  .container(:is-active="bIsActive")
    .box(ref="bBox", :style="bPosStyle")
      .opt(v-for="(opt, i) in bOpts"
        :key="opt[0]"
        :title="getTitle(opt[0])"
        :is-selected="isSelected(i)"
        @click="onClick(opt)"
        @mousedown.stop="")
        span(v-for="out in parseLabel(opt[0])"
          :style="{color: out.color, fontWeight: out.w}") {{out.label}}
</template>


<script>
import Store from '../store'
import State from '../store.state'
import Getters from '../store.getters'
import EventBus from '../event-bus'

export default {
  data() {
    return {
      aIsActive: false,
      aOpts: [],
      aPos: 0,
      aX: 0,
      aDown: true,
      bIsActive: false,
      bOpts: [],
      bPos: 0,
      bX: 0,
      bDown: true,
      selected: -1,
    }
  },

  computed: {
    aPosStyle() {
      let style = { transform: `translateY(${this.aPos}px) translateX(${this.aX}px)` }
      if (!this.aDown) style.bottom = '0px'
      return style
    },
    bPosStyle() {
      let style = { transform: `translateY(${this.bPos}px) translateX(${this.bX}px)` }
      if (!this.bDown) style.bottom = '0px'
      return style
    },
  },

  created() {
    EventBus.$on('selectOption', this.onSelectOption)
    EventBus.$on('activateOption', this.onActivateOption)

    Store.watch(Getters.ctxMenu, (c, p) => {
      if (this.leaveT) clearTimeout(this.leaveT)
      this.selected = -1

      let h = this.$root.$el.offsetHeight

      if (c) {
        let rect
        if (c.el.start && c.el.end) rect = { top: c.el.start, bottom: c.el.end, left: 120, right: 120 }
        else  rect = c.el.getBoundingClientRect()
        if (this.aOpts.length) {
          this.bOpts = c.opts
          this.bIsActive = true
          this.aIsActive = false
          this.$nextTick(() => {
            this.bDown = this.$refs.bBox.offsetHeight + rect.bottom < h
            this.bPos = this.bDown ? rect.bottom : rect.top
            const fullWidth = this.$el.offsetWidth
            const menuWidth = this.$refs.bBox.offsetWidth
            if (rect.right < fullWidth - menuWidth) this.bX = rect.right
            else if (rect.left > menuWidth) this.bX = rect.left - menuWidth
            else this.bX = this.$el.offsetWidth - menuWidth
          })
          setTimeout(() => (this.aOpts = []), 128)
        } else {
          this.aOpts = c.opts
          this.aIsActive = true
          this.bIsActive = false
          this.$nextTick(() => {
            this.aDown = this.$refs.aBox.offsetHeight + rect.bottom < h
            this.aPos = this.aDown ? rect.bottom : rect.top
            const fullWidth = this.$el.offsetWidth
            const menuWidth = this.$refs.aBox.offsetWidth
            if (rect.right < fullWidth - menuWidth) this.aX = rect.right
            else if (rect.left > menuWidth) this.aX = rect.left - menuWidth
            else this.aX = this.$el.offsetWidth - menuWidth
          })
          setTimeout(() => (this.bOpts = []), 128)
        }
      }

      if (!c && p) {
        this.aIsActive = false
        this.bIsActive = false
      }
    })
  },

  methods: {
    onME() {
      if (this.leaveT) clearTimeout(this.leaveT)
    },
    onML() {
      if (State.autoHideCtxMenu === 'none') return
      this.leaveT = setTimeout(() => {
        Store.commit('closeCtxMenu')
      }, State.autoHideCtxMenu)
    },

    onClick(opt) {
      let func = opt[1]
      let args = opt.slice(2)
      if (typeof func === 'string') {
        Store.dispatch(func, args[0])
      }
      if (typeof func === 'function') {
        func(...args)
      }
      Store.commit('closeCtxMenu')
    },

    onSelectOption(dir) {
      if (!dir) return

      const opts = this.aIsActive ? this.aOpts : this.bOpts

      if (this.selected < 0) {
        if (dir > 0) this.selected = 0
        else this.selected = opts.length - 1
        return
      }

      if (this.selected >= 0) {
        this.selected += dir
        if (this.selected < 0) this.selected = 0
        if (this.selected >= opts.length) this.selected = opts.length - 1
      }
    },

    onActivateOption() {
      if (this.selected < 0) return
      const opts = this.aIsActive ? this.aOpts : this.bOpts
      this.onClick(opts[this.selected])
    },

    isSelected(index) {
      return this.selected === index
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
      return input
        .split('||')
        .map(part => {
          let parsed = part.split('>>')
          return parsed[parsed.length - 1]
        })
        .join('')
    },
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
    z-index: 5000

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
  size(max-w: calc(100% - 28px))
  z-index: 30
  padding: 0 0 0 0
  margin: 0
  overflow: hidden
  border-radius: 3px
  background-color: var(--ctx-menu-bg)
  box-shadow: var(--ctx-menu-shadow)

.CtxMenu .opt
  box(relative, flex)
  // text(s: rem(14))
  font: var(--ctx-menu-font)
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
  &[is-selected]
    background-color: var(--ctx-menu-bg-hover)
</style>
