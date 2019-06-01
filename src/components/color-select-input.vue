<template lang="pug">
.IconSelectInput
  .icon(v-for="o in opts" :data-active="o.color === value" @click="select(o.color)")
    svg(:style="{ fill: o.colorCode }"): use(:xlink:href="'#circle'")
</template>


<script>
export default {
  props: {
    value: String,
    opts: Array,
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
