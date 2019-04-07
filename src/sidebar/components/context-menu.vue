<template lang="pug">
.CtxMenu(:is-active="aIsActive || bIsActive", @mouseenter="onME", @mouseleave="onML")
  .container(:is-active="aIsActive")
    .box(ref="aBox", :style="aPosStyle")
      .inline-group(
        v-for="iOpts in aInline"
        v-if="iOpts.length"
        @wheel.prevent.stop="")
        .icon-opt(
          v-for="(opt, i) in iOpts"
          :btn-width="btnWidth(iOpts, i)"
          :title="getTitle(opt.label)"
          :is-selected="isSelected(opt)"
          @click="onClick(opt)"
          @mousedown.stop="")
          svg(:style="{fill: opt.color}")
            use(:xlink:href="'#' + opt.icon")
      .opt(v-for="(opt, i) in aOpts"
        :key="opt.label"
        :title="getTitle(opt.label)"
        :is-selected="isSelected(opt)"
        @click="onClick(opt)"
        @mousedown.stop="")
        span(v-for="out in parseLabel(opt.label)"
          :style="{color: out.color, fontWeight: out.w}") {{out.label}}
  .container(:is-active="bIsActive")
    .box(ref="bBox", :style="bPosStyle")
      .inline-group(
        v-for="iOpts in bInline"
        v-if="iOpts.length"
        @wheel.prevent.stop="")
        .icon-opt(
          v-for="(opt, i) in iOpts"
          :btn-width="btnWidth(iOpts, i)"
          :title="getTitle(opt.label)"
          :is-selected="isSelected(opt)"
          @click="onClick(opt)"
          @mousedown.stop="")
          svg(:style="{fill: opt.color}")
            use(:xlink:href="'#' + opt.icon")
      .opt(v-for="(opt, i) in bOpts"
        :key="opt.label"
        :title="getTitle(opt.label)"
        :is-selected="isSelected(opt)"
        @click="onClick(opt)"
        @mousedown.stop="")
        span(v-for="out in parseLabel(opt.label)"
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
      aInline: [],
      aPos: 0,
      aX: 0,
      aDown: true,
      bIsActive: false,
      bOpts: [],
      bInline: [],
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
    aAll() {
      return this.aInline.reduce((a, v) => a.concat(v), []).concat(this.aOpts)
    },
    bPosStyle() {
      let style = { transform: `translateY(${this.bPos}px) translateX(${this.bX}px)` }
      if (!this.bDown) style.bottom = '0px'
      return style
    },
    bAll() {
      return this.bInline.reduce((a, v) => a.concat(v), []).concat(this.bOpts)
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
        else rect = c.el.getBoundingClientRect()

        if (this.aOpts.length) {
          this.bOpts = c.opts
          this.bInline = c.inline
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
          setTimeout(() => {
            this.aOpts = []
            this.aInline = []
          }, 128)
        } else {
          this.aOpts = c.opts
          this.aInline = c.inline
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
          setTimeout(() => {
            this.bOpts = []
            this.bInline = []
          }, 128)
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
      if (typeof opt.action === 'string') {
        Store.dispatch(opt.action, opt.args)
      }
      if (typeof opt.action === 'function') {
        opt.action(...opt.args)
      }
      Store.commit('closeCtxMenu')
    },

    onSelectOption(dir) {
      if (!dir) return

      const opts = this.aIsActive ? this.aAll : this.bAll

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
      const opts = this.aIsActive ? this.aAll : this.bAll
      this.onClick(opts[this.selected])
    },

    btnWidth(opts, i) {
      if (i < 5) return 0
      const k = opts.length % 5
      const p = opts.length - k
      if (i < p) return 0
      else return 5
    },

    isSelected(opt) {
      const opts = this.aIsActive ? this.aAll : this.bAll
      return opts[this.selected] === opt
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
  size(max-w: calc(100% - 28px), min-w: 160px)
  z-index: 30
  padding: 0 0 0 0
  margin: 0
  overflow: hidden
  border-radius: 3px
  background-color: var(--ctx-menu-bg)
  box-shadow: var(--ctx-menu-shadow)

.CtxMenu .inline-group
  box(relative, flex)
  overflow: hidden
  flex-wrap: wrap
  &:not(:last-of-type)
    padding: 0 0 1px
    box-shadow: inset 0 -1px 0 0 #00000032

.CtxMenu .icon-opt
  box(relative)
  size(auto, 30px, min-w: 30px)
  flex-grow: 1
  flex-shrink: 0
  &[btn-width="5"]
    size(20%)
    flex-grow: 0
  &:hover
  &[is-selected]
    background-color: var(--ctx-menu-bg-hover)
    svg
      opacity: 1
  &:active
    opacity: .7
  svg
    box(absolute)
    size(16px, same)
    pos(calc(50% - 8px), calc(50% - 8px))
    opacity: .8
    fill: var(--ctx-menu-fg)

.CtxMenu .opt
  box(relative, flex)
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
  &:active
    opacity: .7
</style>
