<template lang="pug">
.SelectField(
  :data-inline="props.inline"
  :data-inactive="props.inactive"
  @mousedown="switchOption"
  @contextmenu.stop.prevent)
  .body
    .label {{translate(props.label)}}
    SelectInput(
      :label="props.optLabel"
      :value="props.value"
      :opts="props.opts"
      :noneOpt="props.noneOpt"
      :color="props.color"
      :icon="props.icon"
      @update:value="select")
  .note(v-if="props.note") {{props.note}}
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import SelectInput from './select-input.vue'

type InputObjOpt = {
  value: string | number
  tooltip?: string
  color?: string
  icon?: string
}
type InputOption = string | number | InputObjOpt

interface SelectFieldProps {
  value: InputOption | InputOption[]
  label: string
  inactive?: boolean
  inline?: boolean
  optLabel?: string
  opts: readonly InputOption[]
  color?: string
  icon?: string
  noneOpt?: string | number
  note?: string
}

const emit = defineEmits(['update:value'])
const props = defineProps<SelectFieldProps>()

function switchOption(e: DOMEvent<MouseEvent>): void {
  if (props.inactive || !props.opts || Array.isArray(props.value)) return
  let i = props.value !== undefined ? props.opts.indexOf(props.value) : -1
  if (i === -1) i = props.opts.findIndex(o => (o as InputObjOpt).value === props.value)
  if (i === -1) return
  if (e.button === 0) i++
  if (e.button === 2) i--
  if (i >= props.opts.length) i = 0
  if (i < 0) i = props.opts.length - 1

  let selected = props.opts[i]
  if (selected && (selected as InputObjOpt).value) {
    emit('update:value', (selected as InputObjOpt).value)
  } else {
    emit('update:value', selected)
  }
}

function select(option: string): void {
  emit('update:value', option)
}
</script>
