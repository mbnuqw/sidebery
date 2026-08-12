<template lang="pug">
.TextField(
  :data-inactive="props.inactive"
  :data-changed="props.default !== undefined && props.default !== value"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @contextmenu.stop="onContextMenu")
  .body
    .label {{translate(props.label)}}
    TextInput(
      ref="inputEl"
      :value="props.value"
      :padding="props.padding"
      :or="props.or"
      :filter="props.filter"
      :line="props.line"
      :tabindex="props.tabindex"
      :password="props.password"
      :valid="props.valid"
      :width="props.inputWidth"
      @update:value="emit('update:value', $event)"
      @blur="onBlur"
      @keydown="emit('keydown', $event)")
  .note(v-if="props.note") {{props.note}}
  .fnote(v-if="props.fnote")
    component(v-for="(b, i) in fnoteParts" :key="i" :is="b[0]" :class="b[1]") {{b[2]}}
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { translate } from 'src/dict'
import type { TextInputComponent } from 'src/types'
import TextInput from './text-input.vue'

interface TextFieldProps {
  value: string | number
  valid?: string | boolean
  padding?: number
  or?: string
  filter?: (e: Event) => string
  line?: boolean
  tabindex?: string
  password?: boolean
  label?: string
  inactive?: boolean
  note?: string
  fnote?: string
  inputWidth?: string
  dbg?: string
  default?: string | number
}

const emit = defineEmits(['update:value', 'blur', 'keydown'])
const props = withDefaults(defineProps<TextFieldProps>(), { padding: 0, tabindex: '0' })

const inputEl = ref<TextInputComponent | null>(null)

let rangeIsSelected = false

const fnoteParts = computed(() => {
  const parts: [string, string | null, string | undefined][] = []
  if (!props.fnote) return parts

  const re = /(```|`|^- |\n)/g
  const rawParts = props.fnote.split(re)
  let mlineCodeBlock = false
  let mlineCodeBlockContent = []
  let inlineCodeBlock = false
  for (const rawPart of rawParts) {
    if (!rawPart) continue
    // Multiline code
    if (rawPart === '```' && !mlineCodeBlock) {
      mlineCodeBlock = true
      continue
    }
    if (mlineCodeBlock) {
      if (rawPart === '```') {
        mlineCodeBlock = false
        parts.push(['code', 'multiline', mlineCodeBlockContent.join('').trim()])
        continue
      }
      mlineCodeBlockContent.push(rawPart)
      continue
    }
    // Inline code
    if (rawPart === '`' && !inlineCodeBlock) {
      inlineCodeBlock = true
      continue
    }
    if (inlineCodeBlock) {
      if (rawPart === '`') {
        inlineCodeBlock = false
        continue
      }
      parts.push(['code', 'inline', rawPart])
      continue
    }
    // New line
    if (rawPart === '\n') {
      if (mlineCodeBlock || inlineCodeBlock) continue
      if (parts[parts.length - 1]?.[0] === 'code') continue
      parts.push(['br', null, undefined])
      continue
    }
    // Inline text
    if (parts[parts.length - 1]?.[0] === 'br' && rawPart.startsWith('- ')) {
      parts.push(['span', 'list-item', rawPart.replace('- ', '   ')])
    } else {
      parts.push(['span', '', rawPart])
    }
  }

  return parts
})

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
  focus()
}

function onContextMenu(payload: PointerEvent) {
  if (props.inactive || rangeIsSelected || getSelection()?.type === 'Range') return
  payload.preventDefault()
}

function focus(): void {
  inputEl.value?.focus()
}

function onBlur(): void {
  if (inputEl.value) emit('blur', inputEl.value)
}

function error() {
  inputEl.value?.error()
}

function recalcTextHeight() {
  inputEl.value?.recalcTextHeight()
}

function selectAll() {
  inputEl.value?.selectAll()
}

defineExpose<TextInputComponent>({
  focus,
  error,
  recalcTextHeight,
  selectAll,
  getTextInput: () => inputEl.value?.getTextInput(),
})
</script>
