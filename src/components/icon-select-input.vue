<template lang="pug">
.IconSelectInput
  .icon(v-for="o in opts" :data-active="o === value" @click="select(o)")
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
