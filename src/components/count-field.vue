<template lang="pug">
.CountField(:data-active="props.value !== off" :data-inactive="props.inactive" @click="toggle")
  .body
    .label {{translate(props.label)}}
    .input-group(@click.stop)
      TextInput.text-input(
        :value="props.value"
        :line="true"
        :filter="valueFilter"
        @update:value="onInput"
        @change="onChange")
      ToggleInput.toggle-input(:value="props.value !== props.off" @update:value="toggle")
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import TextInput from './text-input.vue'
import ToggleInput from './toggle-input.vue'

interface CountFieldProps {
  label?: string
  value?: number | string
  or?: number | string
  inactive?: boolean
  off?: number
  min?: number
}

const emit = defineEmits(['update:value', 'change'])
const props = withDefaults(defineProps<CountFieldProps>(), { min: 0 })

function onInput(val: string): void {
  emit('update:value', val)
}

function onChange(): void {
  emit('change', props.value)
}

function valueFilter(e: Event): number {
  let val = parseInt((e.target as HTMLInputElement).value)
  if (isNaN(val)) return 0
  else if (props.min !== undefined && val < props.min) return props.min
  else return val
}

function toggle(): void {
  if (props.inactive) return
  else if (props.value === props.off && props.off) emit('update:value', props.min ?? props.off + 1)
  else emit('update:value', props.off)
}
</script>
