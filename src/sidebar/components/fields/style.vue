<template lang="pug">
.StyleField
  .label {{t(label)}}
  .input-group(:is-activated="isActive")
    text-input.text-input(
      :value="value"
      :line="true"
      :or="or"
      @input="onInput"
      @change="onChange")
    toggle-input.toggle(:value="isActive", @input="toggle")
</template>


<script>
import ToggleInput from '../inputs/toggle'
import TextInput from '../inputs/text'

export default {
  components: {
    ToggleInput,
    TextInput,
  },

  props: {
    value: String,
    or: String,
    label: String,
    optFill: String,
    opts: Array,
  },

  data() {
    return {}
  },

  computed: {
    isActive() {
      return !!this.value
    }
  },

  methods: {
    onInput(val) {
      this.$emit('input', val)
    },

    onChange() {
      this.$emit('change', this.value)
    },

    toggle() {
      this.$emit('toggle')
    },
  },
}
</script>
