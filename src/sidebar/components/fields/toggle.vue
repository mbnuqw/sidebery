<template lang="pug">
.ToggleField(:class="{ inline, inactive }", @click="toggle")
  .label(:style="{ color }") {{t(label)}}
  toggle-input.input(:value="value")
</template>


<script>
import ToggleInput from '../inputs/toggle'

export default {
  components: {
    ToggleInput,
  },

  props: {
    value: Boolean,
    label: String,
    inactive: Boolean,
    field: Boolean,
    inline: Boolean,
    color: String,
  },

  data() {
    return {}
  },

  methods: {
    toggle() {
      if (this.inactive) return
      this.$emit('input', !this.value)
    },
  },
}
</script>
