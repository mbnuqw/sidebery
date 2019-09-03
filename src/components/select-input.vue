<template lang="pug">
.SelectInput(@mousedown="select")
  .opt(
    v-for="o in opts"
    :data-none="o === noneOpt"
    :data-active="o === value") {{t(label + o, plurNum)}}
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
    select(e) {
      let i = this.opts.indexOf(this.value)
      if (e.button === 0) i++
      if (e.button === 2) i--
      if (i >= this.opts.length) i = 0
      if (i < 0) i = this.opts.length - 1
      this.$emit('input', this.opts[i])
    },
  },
}
</script>
