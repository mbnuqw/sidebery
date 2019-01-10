<template lang="pug">
.ThemeEditor(v-noise:300.g:12:af.a:0:42.s:0:9="", :is-active="active", @click="cancel")
  .title Edit theme
  scroll-box(ref="scrollBox")
    .box
      section.section
        .title Colors
        .field
          .label Background
          .input(:opt-true="!!$store.state.customTheme.bg", @click="toggleStyle('bg')")
            .opt.-true {{t('settings.opt_true')}}
            .opt.-false {{t('settings.opt_false')}}
          color-input.input(
            v-model="bg"
            v-debounce:input.128="() => updateStyle('bg')")
</template>


<script>
import EventBus from '../event-bus'
import Store from '../store'
import State from '../store.state'
import ScrollBox from './scroll-box'
import ColorInput from './input.color'

export default {
  components: {
    ScrollBox,
    ColorInput,
  },

  data() {
    return {
      active: false,

      bg: '#00000000'
    }
  },

  created() {
    EventBus.$on('open-theme-editor', () => this.open())
  },

  mounted() {
    const loadedTheme = State.customTheme
    const compStyle = getComputedStyle(this.$el)

    this.bg = loadedTheme.bg || compStyle.getPropertyValue('--bg').trim()
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
     * Toggle style
     */
    toggleStyle(key) {
      let current = State.customTheme[key]
      if (current) {
        this.$set(State.customTheme, key, null)
        this.$root.$el.style.removeProperty('--' + key.replace('_', '-'))
        Store.dispatch('saveState')
      } else {
        State.customTheme[key] = true
        this.updateStyle(key)
      }
    },

    /**
     * Update theme
     */
    updateStyle(key) {
      if (!State.customTheme[key]) return
      this.$root.$el.style.setProperty('--' + key.replace('_', '-'), this[key])
      this.$set(State.customTheme, key, this[key])
      Store.dispatch('saveState')
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.ThemeEditor
  box(absolute, flex)
  pos(0, 0)
  size(100%, same)
  flex-direction: column
  background-color: var(--bg)
  z-index: -1
  opacity: 0
  // opacity: 1
  // z-index: 1500
  transition: opacity var(--d-fast), z-index var(--d-fast)
.ThemeEditor[is-active]
  opacity: 1
  z-index: 1500

.ThemeEditor > .title
  box(relative)
  text(c: #ccc, s: rem(21))
  text-align: center
  padding: 12px 16px

.ThemeEditor > .box
  box(relative)
  padding: 0 0 1px

.ThemeEditor .section
  box(relative)

.ThemeEditor .section > .title
  box(relative)
  text(c: #ccc, s: rem(18))
  padding: 2px 16px

.ThemeEditor .section > .field
  box(relative)
  padding: 8px 16px
  > .label
    box(relative)
    text(c: #ccc, s: rem(16))
  > .input
    box(relative)
    size(100%)
    text(c: #ccc, s: rem(15))
    margin: 8px 0 0

.ThemeEditor .field > .input
  box(relative, flex)
  flex-wrap: wrap
  cursor: pointer

  &[opt-true]
    .opt
      color: var(--settings-opt-active-fg)
    .opt.-true
      color: var(--settings-opt-true-fg)
    .opt.-false
      color: var(--settings-opt-inactive-fg)

.ThemeEditor .opt
  box(relative)
  text(s: rem(14))
  margin: 0 7px 0 0
  color: var(--settings-opt-inactive-fg)
  transition: color var(--d-fast)
  &.-false
    color: var(--settings-opt-false-fg)
  &[opt-true]
    color: var(--settings-opt-active-fg)
    &[opt-none]
      color: var(--settings-opt-false-fg)
</style>
