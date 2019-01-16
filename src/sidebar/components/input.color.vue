<template lang="pug">
.ColorInput(:is-active="isActive", :is-empty="isEmpty")
  .color-wrapper
    input.color(
      ref="hexRgb"
      type="color"
      :style="{ opacity: colorOpacity }"
      :value="colorValue"
      @input="onColorInput")
  div #
  input.text(
    size=""
    type="text"
    tabindex="-1"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :value="textValue"
    @input="onTextInput")
</template>


<script>
import TextInput from './input.text'

const RGBA_RE = /^rgba\((\d+),\s?(\d+),\s?(\d+),\s?(.+)\)$/

export default {
  components: {
    TextInput,
  },

  props: {
    value: {
      type: String,
      default: () => '#000000ff',
    },
  },

  data() {
    return {
      isActive: false,
      opaq: 'ff',
    }
  },

  computed: {
    isEmpty() {
      return !this.value
    },

    colorValue() {
      if (!this.value) return '#000000'
      if (this.value.startsWith('rgba')) {
        let [, r, g, b] = RGBA_RE.exec(this.value)
        r = parseInt(r).toString(16)
        g = parseInt(g).toString(16)
        b = parseInt(b).toString(16)
        return '#' + r + g + b
      }
      if (this.value[0] !== '#') return '#000000'
      return this.value.slice(0, 7)
    },

    textValue() {
      if (!this.value) return '000000'
      if (this.value.startsWith('rgba')) {
        let [, r, g, b, a] = RGBA_RE.exec(this.value)
        r = parseInt(r).toString(16)
        g = parseInt(g).toString(16)
        b = parseInt(b).toString(16)
        a = Math.trunc(parseFloat(a) * 255).toString(16)
        return r + g + b + a
      }
      if (this.value[0] !== '#') return '000000'
      return this.value.slice(1, 9)
    },

    colorOpacity() {
      const num = parseInt(this.opaq, 16)
      if (isNaN(num)) return 1
      return num / 255
    },
  },

  methods: {
    onColorInput(e) {
      let len = e.target.value.length
      if (len < 7) e.target.value += '0'.repeat(6 - len)
      this.$emit('input', e.target.value + this.opaq)
    },

    onTextInput(e) {
      let len = e.target.value.length
      if (len > 8) e.target.value = e.target.value.slice(0, 8)
      if (len === 6) {
        this.$emit('input', '#' + e.target.value)
      }
      if (len === 8) {
        this.opaq = e.target.value.slice(-2)
        this.$emit('input', '#' + e.target.value)
      }
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.ColorInput
  box(relative, flex)
  justify-content: space-between
  align-items: center

.ColorInput > .color-wrapper
  box(relative)
  size(16px, same)
  flex-shrink: 0
  border-radius: 50%
  overflow: hidden
  margin: 0 8px 0 0
  padding: 0
  cursor: pointer
  box-shadow: 0 0 0 1px #cecece,
              0 0 0 2px #323232,
              0 1px 3px 0 #00000024

  > .color
    box(relative)
    size(calc(100% + 2px), same)
    pos(-1px, -1px)
    -webkit-appearance: none
    border: none
    outline: none
    margin: 0
    padding: 0
    background-color: transparent
    z-index: 0
    cursor: pointer

.ColorInput > .text
  box(relative)
  size(1px)
  -webkit-appearance: none
  border: none
  outline: none
  margin: 0
  padding: 0
  background-color: transparent
  z-index: 1
  flex-grow: 2
</style>
