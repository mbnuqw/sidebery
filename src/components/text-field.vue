<template lang="pug">
.TextField(:data-inactive="inactive" @click="focus")
  .body
    .label {{t(label)}}
    TextInput(
      ref="input"
      :value="value"
      :padding="padding"
      :or="or"
      :filter="filter"
      :line="line"
      :tabindex="tabindex"
      :password="password"
      :valid="valid"
      :width="inputWidth"
      @input="$emit('input', $event)"
      @keydown="$emit('keydown', $event)")
  .note(v-if="note") {{note}}
</template>

<script>
import TextInput from './text-input'

export default {
  components: {
    TextInput,
  },

  props: {
    value: [String, Number],
    valid: [String, Boolean],
    padding: {
      type: Number,
      default: () => 0,
    },
    or: String,
    filter: Function,
    line: Boolean,
    tabindex: {
      type: String,
      default: () => '0',
    },
    password: Boolean,
    label: String,
    inactive: Boolean,
    note: String,
    inputWidth: String,
  },

  methods: {
    focus() {
      if (!this.$refs.input) return
      this.$refs.input.focus()
    },
  },
}
</script>
