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
  input.opaque(
    size=""
    min="0"
    max="100"
    step="any"
    type="number"
    tabindex="-1"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :value="opaque"
    @input="onOpaqueInput")
  div %
</template>


<script>
import TextInput from './input.text'

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
    }
  },

  computed: {
    isEmpty() {
      return !this.value
    },

    colorValue() {
      if (!this.value) return '#000000'
      if (this.value[0] !== '#') return '#000000'
      return this.value.slice(0, 7)
    },

    textValue() {
      if (!this.value) return '000000'
      if (this.value[0] !== '#') return '000000'
      return this.value.slice(1, 7)
    },

    opaque() {
      if (!this.value) return 100
      if (this.value[0] !== '#') return 100
      if (this.value.length < 9) return 100

      const hex = this.value.slice(7, 9)
      const val = parseInt(hex, 16)
      if (isNaN(val)) return 100
      else return Math.trunc(val / 255 * 100)
    },

    hexOpaq() {
      let hex = Math.trunc((this.opaque / 100) * 255).toString(16)
      return hex.length == 1 ? '0' + hex : hex
    },

    colorOpacity() {
      return this.opaque / 100
    },
  },

  methods: {
    onColorInput(e) {
      let len = e.target.value.length
      if (len < 7) e.target.value += '0'.repeat(6 - len)
      this.$emit('input', e.target.value + this.hexOpaq)
    },

    onTextInput(e) {
      let len = e.target.value.length
      if (len > 6) e.target.value = e.target.value.slice(0, 6)
      if (len === 6) {
        this.$emit('input', '#' + e.target.value + this.hexOpaq)
      }
    },

    onOpaqueInput(e) {
      let hex = Math.trunc((e.target.value / 100) * 255).toString(16)
      hex = hex.length == 1 ? '0' + hex : hex
      this.$emit('input', this.colorValue + hex)
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
  size(18px, 18px)
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
.ColorInput > .opaque
  box(relative)
  size(1px)
  -webkit-appearance: none
  border: none
  outline: none
  margin: 0
  padding: 0
  background-color: transparent
  z-index: 1
  flex-grow: 1

.ColorInput > .opaque
  text-align: right
  -moz-appearance: textfield
  // just trust me
  text-align-last: right
</style>
