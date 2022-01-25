<template lang="pug">
.IconSelectInput
  .icon(
    v-for="opt in opts"
    :data-active="opt === value"
    :data-color="fill"
    @click="select(opt)")
    svg: use(:xlink:href="'#' + opt")
</template>

<script lang="ts" setup>
const emit = defineEmits(['input'])
defineProps<{ value?: string; opts?: string[]; fill?: string }>()

function select(opt: string): void {
  emit('input', opt)
}
</script>
