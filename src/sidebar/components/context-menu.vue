<template lang="pug">
.CtxMenu(
  :data-active="aIsActive || bIsActive"
  @mouseenter="onME"
  @mouseleave="onML"
  @wheel.prevent.stop="")
  transition(name="menu"): .container(v-show="aIsActive")
    .box(ref="aBox" :style="aPosStyle")
      div(
        v-for="group in aMenuGroups"
        v-if="group.options.length"
        :class="group.inline ? 'inline-group' : 'list-group'")
        .icon-opt(
          v-if="group.inline"
          v-for="(opt, i) in group.options"
          :data-width="btnWidth(group.options)"
          :data-selected="isSelected(opt)"
          :data-separator="isSeparator(opt)"
          :data-color="opt.color ? opt.color : false"
          :data-inactive="opt.inactive"
          :title="getTitle(opt.label)"
          @click="onClick(opt)"
          @mousedown.stop="")
          svg: use(:xlink:href="'#' + opt.icon")
        .opt(
          v-if="!group.inline"
          v-for="(opt, i) in group.options"
          :data-selected="isSelected(opt)"
          :data-separator="isSeparator(opt)"
          :data-inactive="opt.inactive"
          :title="getTitle(opt.label)"
          @click="onClick(opt)"
          @mousedown.stop="")
          span(
            v-for="out in parseLabel(opt.label)"
            :data-color="out.color ? opt.color : false"
            :style="{fontWeight: out.w}") {{out.label}}
  transition(name="menu"): .container(v-show="bIsActive")
    .box(ref="bBox" :style="bPosStyle")
      div(
        v-for="group in bMenuGroups"
        v-if="group.options.length"
        :class="group.inline ? 'inline-group' : 'list-group'")
        .icon-opt(
          v-if="group.inline"
          v-for="(opt, i) in group.options"
          :data-width="btnWidth(group.options)"
          :data-selected="isSelected(opt)"
          :data-separator="isSeparator(opt)"
          :data-color="opt.color ? opt.color : false"
          :data-inactive="opt.inactive"
          :title="getTitle(opt.label)"
          @click="onClick(opt)"
          @mousedown.stop="")
          svg: use(:xlink:href="'#' + opt.icon")
        .opt(
          v-if="!group.inline"
          v-for="(opt, i) in group.options"
          :key="opt.label"
          :data-selected="isSelected(opt)"
          :data-separator="isSeparator(opt)"
          :data-inactive="opt.inactive"
          :title="getTitle(opt.label)"
          @click="onClick(opt)"
          @mousedown.stop="")
          span(
            v-for="out in parseLabel(opt.label)"
            :data-color="out.color ? opt.color : false"
            :style="{fontWeight: out.w}") {{out.label}}
</template>


<script>
import EventBus from '../../event-bus'
import Store from '../store'
import State from '../store/state'
import Actions from '../actions'

export default {
  data() {
    return {
      aIsActive: false,
      aMenuGroups: [],
      aPos: 0,
      aX: 0,
      aDown: true,
      bIsActive: false,
      bMenuGroups: [],
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
      return this.aMenuGroups.reduce((a, v) => a.concat(v.options), [])
    },
    bPosStyle() {
      let style = { transform: `translateY(${this.bPos}px) translateX(${this.bX}px)` }
      if (!this.bDown) style.bottom = '0px'
      return style
    },
    bAll() {
      return this.bMenuGroups.reduce((a, v) => a.concat(v.options), [])
    },
  },

  created() {
    EventBus.$on('selectOption', this.onSelectOption)
    EventBus.$on('activateOption', this.onActivateOption)

    Store.watch(Object.getOwnPropertyDescriptor(State, 'ctxMenu').get, (c, p) => {
      if (this.leaveT) clearTimeout(this.leaveT)
      this.selected = -1

      let h = this.$root.$el.offsetHeight

      if (c) {
        if (this.aMenuGroups.length) {
          this.bMenuGroups = c.opts
          this.bPos = c.y
          this.bIsActive = true
          this.aIsActive = false
          this.$nextTick(() => {
            this.bDown = this.$refs.bBox.offsetHeight + c.y < h
            let fullWidth = this.$el.offsetWidth
            let menuWidth = this.$refs.bBox.offsetWidth
            if (c.x < fullWidth - menuWidth) this.bX = c.x
            else if (c.x > menuWidth) this.bX = c.x - menuWidth
            else this.bX = fullWidth - menuWidth
          })
          setTimeout(() => { this.aMenuGroups = [] }, 128)
        } else {
          this.aMenuGroups = c.opts
          this.aPos = c.y
          this.aIsActive = true
          this.bIsActive = false
          this.$nextTick(() => {
            this.aDown = this.$refs.aBox.offsetHeight + c.y < h
            let fullWidth = this.$el.offsetWidth
            let menuWidth = this.$refs.aBox.offsetWidth
            if (c.x < fullWidth - menuWidth) this.aX = c.x
            else if (c.x > menuWidth) this.aX = c.x - menuWidth
            else this.aX = fullWidth - menuWidth
          })
          setTimeout(() => { this.bMenuGroups = [] }, 128)
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
        Actions.closeCtxMenu()
      }, State.autoHideCtxMenu)
    },

    onClick(opt) {
      if (opt.inactive) return
      if (typeof opt.action === 'string') {
        if (opt.args) Actions[opt.action](...opt.args)
        else Actions[opt.action]()
      }
      if (typeof opt.action === 'function') {
        if (opt.args) opt.action(...opt.args)
        else Actions[opt.action]()
      }
      Actions.closeCtxMenu()
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

    btnWidth(opts) {
      if (opts.filter(o => typeof o !== 'string').length > 5) return 'wrap'
      else 'norm'
    },

    isSelected(opt) {
      const opts = this.aIsActive ? this.aAll : this.bAll
      return opts[this.selected] === opt
    },

    isSeparator(opt) {
      return typeof opt === 'string' && opt.startsWith('separator')
    },

    parseLabel(input) {
      if (!input) return []
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
      if (!input) return ''
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
