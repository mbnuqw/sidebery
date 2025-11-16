<template lang="pug">
.SelectField(
  ref="rootEl"
  :data-inactive="props.inactive"
  :data-drop-down="dropDownOpen"
  @mousedown="onMouseDown"
  @contextmenu.stop.prevent=""
  @blur="onBlur"
  @keydown="onKeyDown")
  .focus-fx
  .body
    .label {{translate(props.label)}}
    SelectInput(
      ref="inputComponent"
      :label="props.optLabel"
      :value="props.value"
      :opts="props.opts"
      :noneOpt="props.noneOpt"
      :color="props.color"
      :icon="props.icon"
      :folded="folded"
      :preSelected="preSelected"
      @update:value="select")
  .note(v-if="props.note") {{props.note}}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { translate } from 'src/dict'
import { SelectInputComponent } from 'src/types'
import { Utils } from 'src/services/_services'
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
  optLabel?: string
  opts: readonly InputOption[]
  color?: string
  icon?: string
  noneOpt?: string | number
  note?: string
  folded?: boolean
}

const emit = defineEmits(['update:value'])
const props = defineProps<SelectFieldProps>()
const dropDownOpen = ref(false)
const preSelected = ref<string | number>(-1)
const inputComponent = ref<SelectInputComponent | null>(null)
const rootEl = ref<HTMLElement | null>(null)

function onMouseDown(e: DOMEvent<MouseEvent>) {
  if (props.inactive || !props.opts || Array.isArray(props.value)) return
  if (e.button === 0) switchOption(1)
  if (e.button === 2) switchOption(-1)
}

function switchOption(dir: 1 | -1): void {
  if (props.inactive || !props.opts || Array.isArray(props.value)) return
  if (props.folded && !dropDownOpen.value) {
    dropDownOpen.value = true
    preSelected.value = -1
    if (inputComponent.value) inputComponent.value.open()
    if (rootEl.value) {
      rootEl.value.tabIndex = 0
      rootEl.value.focus()
    }
    return
  }
  let i = props.value !== undefined ? props.opts.indexOf(props.value) : -1
  if (i === -1) i = props.opts.findIndex(o => (o as InputObjOpt).value === props.value)
  if (i === -1) return
  i += dir
  if (i >= props.opts.length) i = 0
  if (i < 0) i = props.opts.length - 1

  let selected = props.opts[i]
  if (selected && (selected as InputObjOpt).value) {
    emit('update:value', (selected as InputObjOpt).value)
  } else {
    emit('update:value', selected)
  }
}

function preSelect(dir: 1 | -1) {
  if (props.inactive || !props.opts || Array.isArray(props.value)) return
  let i
  if (preSelected.value === -1) {
    if (dir > 0) i = -1
    else i = props.opts.length
  } else {
    i = props.opts.indexOf(preSelected.value)
    if (i === -1) i = props.opts.findIndex(o => (o as InputObjOpt).value === preSelected.value)
    if (i === -1) return
  }
  i += dir
  if (i >= props.opts.length) i = 0
  if (i < 0) i = props.opts.length - 1

  let opt
  if (dir > 0) opt = Utils.findFrom(props.opts, i, isNotCurrentValue)
  else opt = Utils.findLastFrom(props.opts, i, isNotCurrentValue)

  if (opt === undefined) {
    if (dir > 0) opt = props.opts[0]
    else opt = props.opts[props.opts.length - 1]
  }

  let optId
  if (opt instanceof Object) {
    preSelected.value = opt.value
    optId = 'opt' + opt.value
  } else {
    preSelected.value = opt
    optId = 'opt' + opt
  }

  const el = document.getElementById(optId)
  if (el) el.scrollIntoView({ block: 'center' })
}

function isNotCurrentValue(opt: InputOption) {
  if (opt instanceof Object) return opt.value !== props.value
  else return opt !== props.value
}

function select(option: string): void {
  emit('update:value', option)
  dropDownOpen.value = false
  if (inputComponent.value) inputComponent.value.close()
  if (rootEl.value) rootEl.value.tabIndex = -1
}

function onBlur(): void {
  dropDownOpen.value = false
  if (inputComponent.value) inputComponent.value.close()
  if (rootEl.value) rootEl.value.tabIndex = -1
}

function onKeyDown(e: KeyboardEvent) {
  // Closed drop-down list
  if (!dropDownOpen.value) {
    if (e.code === 'Enter' || e.code === 'ArrowRight' || (!e.shiftKey && e.code === 'Space')) {
      e.preventDefault()
      switchOption(1)
    } else if (e.code === 'ArrowLeft' || (e.shiftKey && e.code === 'Space')) {
      e.preventDefault()
      switchOption(-1)
    }
  }
  // An open drop-down list
  else {
    if (e.code === 'Escape' || e.code === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      if (inputComponent.value) inputComponent.value.close()
      if (rootEl.value) rootEl.value.removeAttribute('tabindex')
      if (inputComponent.value) inputComponent.value.getFocusEl()?.focus()

      preSelected.value = -1
    } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'ArrowRight') {
      e.preventDefault()
      e.stopPropagation()
      if (inputComponent.value) inputComponent.value.close()
      if (rootEl.value) rootEl.value.removeAttribute('tabindex')
      if (inputComponent.value) inputComponent.value.getFocusEl()?.focus()

      if (preSelected.value !== -1 && preSelected.value !== props.value) {
        emit('update:value', preSelected.value)
      }
    } else if (e.code === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      preSelect(1)
    } else if (e.code === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      preSelect(-1)
    }
  }
}

const publicInterface: SelectInputComponent = {
  open: () => inputComponent.value?.open() ?? undefined,
  close: () => inputComponent.value?.close() ?? undefined,
  getFocusEl: () => inputComponent.value?.getFocusEl() ?? undefined,
}
defineExpose(publicInterface)
</script>
