<template lang="pug">
.ColorField
  .label {{t(label)}}
  .input-group(:data-active="!!value")
    color-input.color-input(
      v-debounce:input.128="debouncedInput"
      :value="value"
      @input="onInput")
    toggle-input.toggle(:value="!!value", @input="toggle")
</template>


<script>
import ToggleInput from '../inputs/toggle'
import ColorInput from '../inputs/color'

export default {
  components: {
    ToggleInput,
    ColorInput,
  },

  props: {
    value: String,
    label: String,
    optFill: String,
    opts: Array,
  },

  data() {
    return {}
  },

  methods: {
    onInput(val) {
      this.$emit('input', val)
    },

    debouncedInput() {
      this.$emit('change', this.value)
    },

    toggle() {
      this.$emit('toggle')
    },
  },
}
</script>
