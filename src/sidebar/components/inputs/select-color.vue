<template lang="pug">
.SelectColorInput
  .icon(v-for="o in opts", :data-on="o.color === value", @click="select(o.color)")
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


<style lang="stylus">
@import '../../../styles/mixins'

.SelectColorInput
  box(relative, flex)
  flex-wrap: wrap

.SelectColorInput > .icon
  box(relative, flex)
  size(26px, same)
  justify-content: center
  align-items: center
  margin: 0
  opacity: .5
  border-radius: 3px
  filter: grayscale(0.5)
  &:hover
    opacity: .7
  &[data-on]
    opacity: 1
    filter: grayscale(0)
  
  > svg
    box(absolute)
    size(16px, same)
    transition: opacity var(--d-fast)
</style>
