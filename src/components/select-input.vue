<template lang="pug">
.SelectInput(:data-color="color")
  .opt(
    v-for="o in opts"
    :data-none="o === noneOpt"
    :data-color="o.color ? o.color : false"
    :data-active="isActive(o)"
    @mousedown.stop="select(o)")
      svg(v-if="icon || o.icon"): use(:xlink:href="'#' + (icon || o.icon)")
      p(v-else) {{t(label + o, plurNum)}}
</template>

<script>
export default {
  props: {
    value: [String, Number],
    opts: Array,
    label: String,
    plurNum: [String, Number],
    color: String,
    icon: String,
    noneOpt: {
      type: String,
      default: () => 'none',
    },
  },

  data() {
    return {}
  },

  methods: {
    isActive(opt) {
      if (opt && opt.value !== undefined) return opt.value === this.value
      else return this.value === opt
    },

    select(option) {
      if (option && option.value) this.$emit('input', option.value)
      else this.$emit('input', option)
    },
  },
}
</script>
