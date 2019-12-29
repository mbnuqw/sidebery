<template lang="pug">
.IconSelectField
  .label {{t(label)}}
  select-icon-input(
    :value="value"
    :opts="opts"
    :fill="optFill"
    @input="select")
</template>

<script>
import SelectIconInput from './icon-select-input'

export default {
  components: {
    SelectIconInput,
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
    select(option) {
      this.$emit('input', option)
    },
  },
}
</script>
