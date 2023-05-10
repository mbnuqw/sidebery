<template lang="pug">
.ToggleField(:data-inactive="props.inactive" @click="toggle")
  .body
    .label(:style="{ color: props.color }") {{translate(props.label)}}
    ToggleInput.input(:value="props.value")
  .note(v-if="props.note") {{props.note}}
  slot
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import ToggleInput from './toggle-input.vue'

interface ToggleFieldProps {
  value: boolean | null | undefined
  label: string
  inactive?: boolean
  field?: boolean
  color?: string
  note?: string
}

const emit = defineEmits(['toggle', 'update:value'])
const props = defineProps<ToggleFieldProps>()

function toggle(): void {
  if (props.inactive) return
  emit('update:value', !props.value)
  emit('toggle', !props.value)
}
</script>
