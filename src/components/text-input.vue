<template lang="pug">
.TextInput(
  :data-active="isActive"
  :data-empty="!value"
  :data-valid="valid"
  :data-wrong="wrongValueAnimation"
  @animationend="onAnimationEnd")
  input(
    v-if="line"
    ref="text"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :type="password ? 'password' : 'text'"
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
    valid: [String, Boolean],
    padding: {
      type: Number,
      default: () => 0,
    },
    or: String,
    filter: Function,
    line: Boolean,
    tabindex: {
      type: String,
      default: () => '0'
    },
    password: Boolean,
  },

  data() {
    return {
      isActive: false,
      wrongValueAnimation: false,
      val: '',
    }
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
      if (this.$refs.text) this.$emit('blur', this.$refs.text.value)
    },

    onInput(e) {
      let value = e.target.value
      if (this.filter) {
        value = this.filter(e)
        e.target.value = value
      }
      this.recalcTextHeight()
      this.$emit('input', value)
    },

    onChange() {
      if (this.$refs.text) this.$emit('change', this.$refs.text.value)
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
      this.wrongValueAnimation = true
      // this.$el.classList.add('err')
      // this.$el.classList.remove('err-animation')
      // this.$el.offsetHeight
      // this.$el.classList.add('err-animation')
      // this.$el.classList.remove('err')
    },

    onAnimationEnd() {
      this.wrongValueAnimation = false
    },
  },
}
</script>
