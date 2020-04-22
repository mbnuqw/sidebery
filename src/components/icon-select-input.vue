<template lang="pug">
.IconSelectInput
  .icon(
    v-for="o in opts"
    :data-active="o === value"
    :data-color="fill"
    @click="select(o)")
    svg: use(:xlink:href="'#' + o")
</template>

<script>
export default {
  props: {
    value: String,
    opts: Array,
    fill: String,
  },

  methods: {
    select(opt) {
      this.$emit('input', opt)
    },
  },
}
</script>
