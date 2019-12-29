<template lang="pug">
.ToggleInput(:data-active="value" @click="toggle")
  .opt.-false {{t('settings.opt_false')}}
  .opt.-true {{t('settings.opt_true')}}
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
