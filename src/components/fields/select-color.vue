<template lang="pug">
.SelectOptField
  .label {{t(label)}}
  select-color-input(
    :value="value"
    :opts="opts"
    :fill="optFill"
    @input="select")
</template>


<script>
import SelectColorInput from '../inputs/select-color'

export default {
  components: {
    SelectColorInput,
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
