<template lang="pug">
.TextInput(:is-active="isActive", :is-empty="isEmpty")
  input(
    v-if="line"
    ref="text"
    type="text"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :tabindex="tabindex"
    :value="value"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @keydown="onKD")
  textarea(
    v-else
    ref="text",
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :tabindex="tabindex"
    :value="value"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @keydown="onKD")
  .placeholder(v-if="or") {{or}}
</template>


<script>
export default {
  props: {
    value: [String, Number],
    padding: {
      type: Number,
      default: () => 0,
    },
    or: String,
    filter: Function,
    line: Boolean,
    tabindex: {
      type: String,
      default: () => '-1'
    },
  },

  data() {
    return {
      isActive: false,
      val: '',
    }
  },

  computed: {
    isEmpty() {
      return !this.value
    },
  },

  mounted() {
    this.recalcTextHeight()
  },

  methods: {
    onFocus() {
      this.isActive = true
      this.$emit('focus', this.$refs.text.value)
    },

    onBlur() {
      this.isActive = false
      this.$emit('blur', this.$refs.text.value)
    },

    onInput(e) {
      if (this.filter) e.target.value = this.filter(e)
      this.recalcTextHeight()
      this.$emit('input', this.$refs.text.value)
    },

    onChange() {
      this.$emit('change', this.$refs.text.value)
    },

    onKD(e) {
      this.$emit('keydown', e)
    },

    recalcTextHeight() {
      if (!this.$refs.text || this.line) return
      this.$refs.text.style.height = '0'
      this.$refs.text.style.height = this.$refs.text.scrollHeight - this.padding + 'px'
    },

    focus() {
      if (this.$refs.text) this.$refs.text.focus()
    },

    error() {
      this.$el.classList.add('err')
      this.$el.classList.remove('err-animation')
      this.$el.offsetHeight
      this.$el.classList.add('err-animation')
      this.$el.classList.remove('err')
    }
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.inherit-text-styles
  font-family: inherit
  font-size: inherit
  font-weight: inherit
  line-height: inherit
  letter-spacing: inherit
  text-indent: inherit
  text-align: inherit
  color: inherit

.TextInput
  box(relative)
  &.err-animation
    animation: shake-it .3s
    // > input
    // > textarea
    // > .placeholder
    //   animation: red-shift 3s

.TextInput[is-empty]
  > .placeholder
    opacity: .5
    transform: translateX(0)

.TextInput[is-active]
  > .placeholder
    transform: translateX(3px)

.TextInput > input
.TextInput > textarea
  @extend .inherit-text-styles
  box(relative, block)
  size(100%)
  -webkit-appearance: none
  border: none
  outline: none
  margin: 0
  padding: 0
  background-color: transparent
  resize: none
  z-index: 1

.TextInput > .placeholder
  @extend .inherit-text-styles
  box(absolute)
  pos(0, 0)
  padding: 0
  margin: 0
  opacity: 0
  transform: translateX(16px)
  transition: opacity var(--d-fast), transform var(--d-fast)


@keyframes red-shift
  0%
    // filter: deop-shadow()
    opacity: 1
  100%
    // filter: brightness(0)
    opacity: .5

@keyframes shake-it
  0%
    transform: translateX(0)
  20%
    transform: translateX(-12px)
  40%
    transform: translateX(12px)
  55%
    transform: translateX(-8px)
  70%
    transform: translateX(6px)
  80%
    transform: translateX(-4px)
  90%
    transform: translateX(2px)
  100%
    transform: translateX(0)
</style>
