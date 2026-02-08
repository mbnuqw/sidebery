<template lang="pug">
.CountField(
  :data-active="props.value !== off"
  :data-inactive="props.inactive"
  :data-changed="props.default !== undefined && props.default !== value"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @contextmenu.stop="onContextMenu")
  .body
    .label {{translate(props.label)}}
    .input-group(@click.stop)
      TextInput.text-input(
        ref="textInputEl"
        :value="props.value"
        :line="true"
        :filter="valueFilter"
        @update:value="onInput"
        @change="onChange")
      ToggleInput.toggle-input(:value="props.value !== props.off" @update:value="toggle")
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { translate } from 'src/dict'
import type { TextInputComponent } from 'src/types'
import TextInput from './text-input.vue'
import ToggleInput from './toggle-input.vue'

interface CountFieldProps {
  label?: string
  value?: number | string
  or?: number | string
  inactive?: boolean
  off?: number
  min?: number
  dbg?: string
  default?: number | string
}

const emit = defineEmits(['update:value', 'change'])
const props = withDefaults(defineProps<CountFieldProps>(), { min: 0 })
const textInputEl = ref<TextInputComponent | null>(null)

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
  if (e.button === 2) toggle()
}

function onContextMenu(e: PointerEvent) {
  if (props.inactive || rangeIsSelected || getSelection()?.type === 'Range') return
  e.preventDefault()
}

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

function focusTextInput(): void {
  textInputEl.value?.focus()
}

function toggle(): void {
  if (props.inactive) return
  else if (props.value === props.off && props.off) emit('update:value', props.min ?? props.off + 1)
  else emit('update:value', props.off)
}
</script>
