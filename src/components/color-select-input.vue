<template lang="pug">
.IconSelectInput
  .icon(
    v-for="o in opts"
    :data-active="o === value"
    :data-color="o"
    @click="select(o)")
    svg: use(:xlink:href="'#circle'")
</template>

<script>
export default {
  props: {
    value: String,
    opts: Array,
  },

  methods: {
    select(opt) {
      this.$emit('input', opt)
    },
  },
}
</script>
