<template lang="pug">
.StylesEditor(v-noise:300.g:12:af.a:0:42.s:0:9="", :is-active="active")
  .title(@click="close") Edit styles
  scroll-box(ref="scrollBox")
    .box
      section.section
        .title Common
        color-field(
          label="Background"
          v-model="$store.state.customStyles.bg"
          @change="updateStyle('bg')"
          @toggle="toggleStyle('bg')")
        color-field(
          label="Favicons placeholder color"
          v-model="$store.state.customStyles.favicons_placehoder_bg"
          @change="updateStyle('favicons_placehoder_bg')"
          @toggle="toggleStyle('favicons_placehoder_bg')")

      section.section
        .title Button
        color-field(
          label="Button background"
          v-model="$store.state.customStyles.btn_bg"
          @change="updateStyle('btn_bg')"
          @toggle="toggleStyle('btn_bg')")
        color-field(
          label="Button hover background"
          v-model="$store.state.customStyles.btn_bg_hover"
          @change="updateStyle('btn_bg_hover')"
          @toggle="toggleStyle('btn_bg_hover')")
        color-field(
          label="Button active background"
          v-model="$store.state.customStyles.btn_bg_active"
          @change="updateStyle('btn_bg_active')"
          @toggle="toggleStyle('btn_bg_active')")
        color-field(
          label="Button foreground"
          v-model="$store.state.customStyles.btn_fg"
          @change="updateStyle('btn_fg')"
          @toggle="toggleStyle('btn_fg')")
        color-field(
          label="Button hover foreground"
          v-model="$store.state.customStyles.btn_fg_hover"
          @change="updateStyle('btn_fg_hover')"
          @toggle="toggleStyle('btn_fg_hover')")
        color-field(
          label="Button active foreground"
          v-model="$store.state.customStyles.btn_fg_active"
          @change="updateStyle('btn_fg_active')"
          @toggle="toggleStyle('btn_fg_active')")
      
      section.section
        .title Scroll Box
      
      section.section
        .title Context Menu
      
      section.section
        .title Navigation Strip
      
      section.section
        .title Panel Menu
      
      section.section
        .title Tabs
      
      section.section
        .title Bookmarks
</template>


<script>
import EventBus from '../event-bus'
import Utils from '../../libs/utils'
import Store from '../store'
import State from '../store.state'
import ScrollBox from './scroll-box'
import ColorField from './field.color'

export default {
  components: {
    ScrollBox,
    ColorField,
  },

  data() {
    return {
      active: false,
    }
  },

  created() {
    EventBus.$on('open-theme-editor', () => this.open())
  },

  methods: {
    /**
     * Open this panel
     */
    async open() {
      this.active = true
      await this.$nextTick()
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    /**
     * Close this panel
     */
    close() {
      this.active = false
    },

    /**
     * Close this panel
     */
    cancel() {
      this.close()
    },

    /**
     * Get current state of theme parameter
     */
    isStyleOn(key) {
      return !!this.$store.state.customStyles[key]
    },

    /**
     * Toggle style
     */
    toggleStyle(key) {
      if (State.customStyles[key]) {
        Store.dispatch('removeStyle', key)
        Store.dispatch('saveStyles')
      } else {
        const compStyle = getComputedStyle(this.$el)
        const value = compStyle.getPropertyValue(Utils.CSSVar(key)).trim()
        Store.dispatch('setStyle', { key, val: value })
        Store.dispatch('saveStyles')
      }
    },

    /**
     * Update style
     */
    updateStyle(key) {
      if (!State.customStyles[key]) return
      Store.dispatch('setStyle', { key, val: State.customStyles[key] })
      Store.dispatch('saveStyles')
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.StylesEditor
  box(absolute, flex)
  pos(0, 0)
  size(100%, same)
  flex-direction: column
  background-color: var(--bg)
  z-index: -1
  opacity: 0
  transition: opacity var(--d-fast), z-index var(--d-fast)
.StylesEditor[is-active]
  opacity: 1
  z-index: 1500

.StylesEditor > .title
  box(relative)
  text(c: #ccc, s: rem(24))
  text-align: center
  padding: 12px 16px

.StylesEditor > .box
  box(relative)
  padding: 0 0 16px

.StylesEditor .section
  box(relative)
  margin: 24px 0 0
  &:first-of-type
    margin: 0

.StylesEditor .section > .title
  box(relative)
  text(c: #ccc, s: rem(21))
  padding: 2px 16px
</style>
