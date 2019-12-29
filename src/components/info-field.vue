<template lang="pug">
.InfoField(@click="onClick")
  .label {{t(label)}}
  .info {{value}}
</template>

<script>
export default {
  props: {
    value: String,
    label: String,
  },

  data() {
    return {}
  },

  methods: {
    onClick(e) {
      this.$emit('click', e)
    },
  },
}
</script>
