<template lang="pug">
.ToggleInput(:opt-true="value", @click="toggle")
  .opt.-true {{t('settings.opt_true')}}
  .opt.-false {{t('settings.opt_false')}}
</template>


<script>
export default {
  props: {
    value: Boolean,
  },

  data() {
    return {}
  },

  methods: {
    toggle() {
      this.$emit('input', !this.value)
    },
  },
}
</script>
