<template lang="pug">
.StyleField(
  :class="{ '-no-separator': noSeparator }"
  :data-active="!!props.value"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @contextmenu.stop="onContextMenu")
  .label
    .desc {{translate(props.label) || props.name}}
    .var(v-if="props.name") {{props.name}}
  .input-group
    .color-wrapper(v-if="isColor")
      input.color(
        type="color"
        :style="{ opacity: colorOpacity }"
        :value="colorValue"
        @input="onColorInput")
    TextInput.text-input(
      ref="textInputEl"
      :value="props.value"
      :line="true"
      :or="props.or"
      @update:value="onInput"
      @change="onChange"
      @keydown="onKeyDown")
    ToggleInput.toggle(:value="props.active", @update:value="toggle")
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import type { TextInputComponent } from 'src/types'
import TextInput from './text-input.vue'
import ToggleInput from './toggle-input.vue'

interface StyleFieldProps {
  value: string
  active: boolean
  or: string
  label: string
  name?: string
  isColor: boolean
  noSeparator?: boolean
}

const emit = defineEmits(['update:value', 'change', 'toggle'])
const props = defineProps<StyleFieldProps>()
const textInputEl = ref<TextInputComponent | null>(null)

const opaq = ref('ff')

const colorValue = computed((): string => {
  if (!props.value) return '#000000'

  if (props.value[0] === '#' && props.value.length === 7) return props.value.toLowerCase()

  const rgb = Utils.toRGBA(props.value)
  if (!rgb) return '#000000'

  return `#${rgb[0].toString(16)}${rgb[1].toString(16)}${rgb[2].toString(16)}`
})
const colorOpacity = computed((): number => {
  const num = parseInt(opaq.value, 16)
  if (isNaN(num)) return 1
  return num / 255
})

let rangeIsSelected = false

function onMouseDown(e: DOMEvent<MouseEvent>) {
  rangeIsSelected = getSelection()?.type === 'Range'
  if (e.detail > 1) e.preventDefault()
}

function onMouseUp(e: DOMEvent<MouseEvent>) {
  if (rangeIsSelected || getSelection()?.type === 'Range') return
  if (e.button === 0) focusTextInput()
  if (e.button === 2) toggle()
}

function onContextMenu(payload: PointerEvent) {
  if (rangeIsSelected || getSelection()?.type === 'Range') return
  payload.preventDefault()
}

function onColorInput(e: Event): void {
  const len = (e.target as HTMLInputElement).value.length
  if (len < 7) (e.target as HTMLInputElement).value += '0'.repeat(6 - len)
  emit('update:value', (e.target as HTMLInputElement).value + opaq.value)
}

function onInput(val: string): void {
  emit('update:value', val)
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.active) toggle()
  if (e.key === 'Enter') toggle()
  if (e.key === 'ArrowUp') upValue(e)
  if (e.key === 'ArrowDown') downValue(e)
}

function onChange(): void {
  emit('change', props.value)
}

function focusTextInput(): void {
  textInputEl.value?.focus()
}

function toggle(): void {
  emit('toggle')
}

function upValue(e: KeyboardEvent): void {
  const parsedNum = parseFloat(props.value)
  if (isNaN(parsedNum)) return

  e.preventDefault()
  e.stopPropagation()

  let newNum = parsedNum
  if (e.shiftKey && e.ctrlKey) {
    newNum = Math.ceil((newNum + 0.01) * 100) / 100
  } else if (e.shiftKey) {
    newNum = Math.ceil((newNum + 0.1) * 10) / 10
  } else {
    newNum = Math.ceil(newNum + 1)
  }

  const newVal = props.value.replace(parsedNum.toString(), newNum.toString())
  emit('update:value', newVal)
}

function downValue(e: KeyboardEvent): void {
  const parsedNum = parseFloat(props.value)
  if (isNaN(parsedNum)) return

  e.preventDefault()
  e.stopPropagation()

  let newNum = parsedNum
  if (e.shiftKey && e.ctrlKey) {
    newNum = Math.floor((newNum - 0.01) * 100) / 100
  } else if (e.shiftKey) {
    newNum = Math.floor((newNum - 0.1) * 10) / 10
  } else {
    newNum = Math.floor(newNum - 1)
  }

  const newVal = props.value.replace(parsedNum.toString(), newNum.toString())
  emit('update:value', newVal)
}
</script>
