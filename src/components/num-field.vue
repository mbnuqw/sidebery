<template lang="pug">
.NumField(
  :data-active="!!props.value"
  :data-inactive="props.inactive"
  @contextmenu.stop="onContextMenu"
  @mousedown="onMouseDown")
  .body
    .label {{translate(props.label)}}
    .input-group
      TextInput.text-input(
        :value="props.value"
        :line="true"
        :filter="valueFilter"
        @keydown="onKD"
        @update:value="emit('update:value', $event)")
      SelectInput.unit-input(
        v-if="props.unitOpts && props.unitLabel"
        :value="validUnit"
        :opts="props.unitOpts"
        :label="props.unitLabel"
        :plurNum="props.value"
        @update:value="select")
  .note(v-if="props.note") {{props.note}}
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { translate } from 'src/dict'
import type { InputOption } from 'src/types'
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
  allowNegative?: boolean
  note?: string
  maxValue?: number
}

const emit = defineEmits(['update:value', 'update:unit'])
const props = defineProps<NumFieldProps>()

const validUnit = computed((): string => {
  return !props.value ? 'none' : (props.unit ?? 'none')
})

let rangeIsSelected = false

function onMouseDown(e: DOMEvent<MouseEvent>) {
  rangeIsSelected = getSelection()?.type === 'Range'
  if (e.detail > 1) e.preventDefault()
}

function onContextMenu(payload: PointerEvent) {
  if (rangeIsSelected || getSelection()?.type === 'Range') return
  payload.preventDefault()
}

function valueFilter(e: Event): number | void {
  const target = e.target as HTMLInputElement
  let raw = target.value
  if (props.allowNegative && (raw === '-0' || raw === '0-')) {
    target.value = '-'
    return
  }
  let val = parseInt(raw)
  if (isNaN(val) || (!props.allowNegative && val < 0)) return 0
  if (props.maxValue !== undefined && val > props.maxValue) val = props.maxValue
  return val
}

function select(unit: string): void {
  if (props.inactive) return

  emit('update:unit', unit)

  if (props.value !== undefined) {
    let val
    if (typeof props.value === 'string') val = parseInt(props.value)
    else val = props.value
    if (isNaN(val)) return
    if (val === 0) emit('update:value', 1)
  }
}

function onKD(e: KeyboardEvent) {
  if (props.inactive) return
  if (props.value === undefined) return

  let val
  if (typeof props.value === 'string') val = parseInt(props.value)
  else val = props.value
  if (isNaN(val)) return

  if (e.key === 'ArrowUp') {
    emit('update:value', val + 1)
  } else if (e.key === 'ArrowDown') {
    if (val <= 0) return
    emit('update:value', val - 1)
  }
}
</script>
