<template lang="pug">
.SelectOptInput
  .icon(v-for="o in opts", :data-on="o === value", @click="select(o)")
    svg(:style="{ fill }"): use(:xlink:href="'#' + o")
</template>


<script>
export default {
  props: {
    value: String,
    opts:  Array,
    fill: String,
  },

  data() {
    return {}
  },

  methods: {
    select(opt) {
      this.$emit('input', opt)
    },
  },
}
</script>
