<template lang="pug">
.NumField(
  :data-active="!!props.value"
  :data-inactive="props.inactive"
  :data-changed="isChanged"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @contextmenu.stop="onContextMenu")
  .body
    .label {{translate(props.label)}}
    .input-group
      TextInput.text-input(
        ref="textInputEl"
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
import { ref } from 'vue'
import { computed } from 'vue'
import { translate } from 'src/dict'
import type { InputOption, InputObjOpt, TextInputComponent } from 'src/types'
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
  dbg?: string
  default?: number | string
  defaultUnit?: string
}

const emit = defineEmits(['update:value', 'update:unit'])
const props = defineProps<NumFieldProps>()
const textInputEl = ref<TextInputComponent | null>(null)

const isChanged = computed(() => {
  if (props.value !== undefined && props.value !== props.default) return true
  if (props.unit !== undefined && props.unit !== props.defaultUnit) return true
  return false
})
const validUnit = computed((): string => {
  return !props.value ? 'none' : (props.unit ?? 'none')
})

let rangeIsSelected = false

function onMouseDown(e: DOMEvent<MouseEvent>) {
  rangeIsSelected = getSelection()?.type === 'Range'
  if (e.detail > 1) e.preventDefault()
}

function onMouseUp(e: DOMEvent<MouseEvent>) {
  if (e.altKey && e.ctrlKey && e.button === 0) {
    navigator.clipboard.writeText(props.dbg ?? '')
    return
  }
  if (props.inactive || rangeIsSelected || getSelection()?.type === 'Range') return
  if (e.button === 0) focusTextInput()
  if (e.button === 2) switchUnitOption(-1)
}

function onContextMenu(e: PointerEvent) {
  if (props.inactive || rangeIsSelected || getSelection()?.type === 'Range') return
  e.preventDefault()
}

function switchUnitOption(dir: 1 | -1): void {
  if (props.inactive || !props.unitOpts || Array.isArray(props.unit)) return
  let i = props.unit !== undefined ? props.unitOpts.indexOf(props.unit) : -1
  if (i === -1) i = props.unitOpts.findIndex(o => (o as InputObjOpt).value === props.unit)
  if (i === -1) return
  i += dir
  if (i >= props.unitOpts.length) i = 0
  if (i < 0) i = props.unitOpts.length - 1
  let selected = props.unitOpts[i]
  if (selected && (selected as InputObjOpt).value) {
    emit('update:unit', (selected as InputObjOpt).value)
  } else {
    emit('update:unit', selected)
  }
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

function focusTextInput(): void {
  textInputEl.value?.focus()
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
