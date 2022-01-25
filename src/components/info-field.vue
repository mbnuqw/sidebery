<template lang="pug">
.InfoField(:data-inactive="props.inactive" @click="onClick")
  .body
    .label {{translate(props.label)}}
    .info(v-if="props.value") {{props.value}}
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'

const emit = defineEmits(['click'])
const props = defineProps<{ value?: string; label?: string; inactive?: boolean }>()

function onClick(e: DOMEvent<MouseEvent>): void {
  emit('click', e)
}
</script>
