<template lang="pug">
.SelectInput(@mousedown="select")
  .opt(v-for="o in opts", :opt-none="o === noneOpt", :opt-true="o === value") {{t(label + o)}}
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


<style lang="stylus">
@import '../../../styles/mixins'

.SelectInput
  box(relative, flex)
  flex-wrap: wrap
  cursor: pointer
  &[opt-true]
    .opt
      color: var(--active-fg)

.SelectInput > .opt
  box(relative)
  text(s: rem(14))
  margin: 0 7px 0 0
  color: var(--inactive-fg)
  transition: color var(--d-fast)
  &[opt-true]
    color: var(--active-fg)
    &[opt-none]
      color: var(--false-fg)
</style>
