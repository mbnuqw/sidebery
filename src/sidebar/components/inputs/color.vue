<template lang="pug">
.ColorInput
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
import TextInput from './text'

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
