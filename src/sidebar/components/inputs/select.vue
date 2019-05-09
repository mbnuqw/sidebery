<template lang="pug">
.SelectInput(@mousedown="select")
  .opt(
    v-for="o in opts"
    :class="{ '-none': o === noneOpt, '-true': o === value }") {{t(label + o)}}
</template>


<script>
export default {
  props: {
    value: [String, Number],
    opts:  Array,
    label: String,
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
