<template lang="pug">
.ThemeEditor(v-noise:300.g:12:af.a:0:42.s:0:9="", :is-active="active")
  .title(@click="close") Edit theme
  scroll-box(ref="scrollBox")
    .box
      section.section
        .title Common
        .field
          .label Background
          .input-group
            color-input.color-input(
              v-model="bg"
              v-debounce:input.128="() => updateStyle('bg')")
            toggle-input.toggle(:value="isStyleOn('bg')", @input="toggleStyle('bg')")

        .field
          .label Favicons placeholder color
          .input-group
            color-input.color-input(
              v-model="favicons_placehoder_bg"
              v-debounce:input.128="() => updateStyle('favicons_placehoder_bg')")
            toggle-input.toggle(
              :value="isStyleOn('favicons_placehoder_bg')"
              @input="toggleStyle('favicons_placehoder_bg')")

</template>


<script>
import EventBus from '../event-bus'
import Store from '../store'
import State from '../store.state'
import ScrollBox from './scroll-box'
import ColorInput from './input.color'
import ToggleInput from './input.toggle'

const UNDERSCORE_RE = /_/g

export default {
  components: {
    ScrollBox,
    ColorInput,
    ToggleInput,
  },

  data() {
    return {
      active: false,

      bg: '#000000ff',
      favicons_placehoder_bg: '#000000ff',
    }
  },

  created() {
    EventBus.$on('open-theme-editor', () => this.open())
  },

  mounted() {
    const loadedTheme = State.customTheme
    const compStyle = getComputedStyle(this.$el)

    this.bg = loadedTheme.bg || compStyle.getPropertyValue('--bg').trim()
    this.favicons_placehoder_bg =
      loadedTheme.favicons_placehoder_bg ||
      compStyle.getPropertyValue('--favicons-placehoder-bg').trim()
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
      return !!this.$store.state.customTheme[key]
    },

    /**
     * Toggle style
     */
    toggleStyle(key) {
      let current = State.customTheme[key]
      if (current) {
        this.$set(State.customTheme, key, null)
        this.$root.$el.style.removeProperty('--' + key.replace(UNDERSCORE_RE, '-'))
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
      this.$root.$el.style.setProperty('--' + key.replace(UNDERSCORE_RE, '-'), this[key])
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
  text(c: #ccc, s: rem(24))
  text-align: center
  padding: 12px 16px

.ThemeEditor > .box
  box(relative)
  padding: 0 0 1px

.ThemeEditor .section
  box(relative)

.ThemeEditor .section > .title
  box(relative)
  text(c: #ccc, s: rem(21))
  padding: 2px 16px

.ThemeEditor .section > .field
  box(relative)
  padding: 8px 16px
  > .label
    box(relative)
    text(c: #afafaf, s: rem(15))
  > .input-group
    box(relative, flex)
    align-items: center
    margin: 8px 0 0
  .color-input
    box(relative)
    size(100%)
    text(c: #afafaf, s: rem(15))
    margin: 0 16px 0 0

.ThemeEditor .toggle
  flex-shrink: 0
</style>
