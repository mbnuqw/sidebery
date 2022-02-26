<template lang="pug">
.NumField(:data-active="!!props.value" :data-inactive="props.inactive")
  .label {{translate(props.label)}}
  .input-group
    TextInput.text-input(
      :value="props.value"
      :line="true"
      :filter="valueFilter"
      @update:value="emit('update:value', $event)")
    SelectInput.unit-input(
      v-if="props.unitOpts && props.unitLabel"
      :value="validUnit"
      :opts="props.unitOpts"
      :label="props.unitLabel"
      :plurNum="props.value"
      @update:value="select")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { translate } from 'src/dict'
import { InputOption } from 'src/types'
import TextInput from './text-input.vue'
import SelectInput from './select-input.vue'

interface NumFieldProps {
  label?: string
  value?: number | string
  or?: number | string
  inactive?: boolean
  unit?: string
  unitOpts?: readonly InputOption[]
  unitLabel?: string
}

const emit = defineEmits(['update:value', 'update:unit'])
const props = defineProps<NumFieldProps>()

const validUnit = computed((): string => {
  return !props.value ? 'none' : props.unit ?? 'none'
})

function valueFilter(e: Event): number {
  const val = parseInt((e.target as HTMLInputElement).value)
  if (isNaN(val)) return 0
  return val
}
function select(unit: string): void {
  if (!props.inactive) emit('update:unit', unit)
}
</script>
