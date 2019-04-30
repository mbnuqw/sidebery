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
