<template lang="pug">
.SelectInput
  .opt(
    v-for="o in opts"
    :data-none="o === noneOpt"
    :data-active="o === value"
    @mousedown.stop="select(o)") {{t(label + o, plurNum)}}
</template>


<script>
export default {
  props: {
    value: [String, Number],
    opts:  Array,
    label: String,
    plurNum: [String, Number],
    noneOpt: {
      type: String,
      default: () => 'none'
    },
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
