<template lang="pug">
.SelectInput(@mousedown="select")
  .opt(v-for="o in opts", :opt-none="o === 'none'", :opt-true="o === value") {{t(label + o)}}
</template>


<script>
export default {
  props: {
    value: String,
    opts:  Array,
    label: String,
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
@import '../../styles/mixins'

.SelectInput
  box(relative, flex)
  flex-wrap: wrap
  cursor: pointer
  &[opt-true]
    .opt
      color: var(--settings-opt-active-fg)

.SelectInput > .opt
  box(relative)
  text(s: rem(14))
  margin: 0 7px 0 0
  color: var(--settings-opt-inactive-fg)
  transition: color var(--d-fast)
  &[opt-true]
    color: var(--settings-opt-active-fg)
    &[opt-none]
      color: var(--settings-opt-false-fg)
</style>
