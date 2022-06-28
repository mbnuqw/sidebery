<template lang="pug">
.TextInput(
  :data-active="state.isActive"
  :data-empty="!props.value"
  :data-valid="props.valid"
  :data-wrong="state.wrongValueAnimation"
  :data-width="props.width"
  @animationend="onAnimationEnd")
  input(
    v-if="props.line"
    ref="textEl"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :type="props.password ? 'password' : 'text'"
    :tabindex="props.tabindex"
    :value="props.value"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @keydown="onKD")
  textarea(
    v-else
    ref="textEl",
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :tabindex="props.tabindex"
    :value="props.value"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @keydown="onKD")
  .placeholder(v-if="props.or") {{props.or}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'

interface TextInputProps {
  value?: string | number
  valid?: string | boolean
  padding?: number
  or?: string
  filter?: (e: Event) => any
  line?: boolean
  tabindex?: string
  password?: boolean
  width?: string
}

const emit = defineEmits(['update:value', 'focus', 'blur', 'change', 'keydown'])
const props = withDefaults(defineProps<TextInputProps>(), { padding: 0, tabindex: '0' })

const textEl = ref<HTMLInputElement | null>(null)
const state = reactive({ isActive: false, wrongValueAnimation: false })

onMounted(() => {
  recalcTextHeight()
})

function onFocus(): void {
  state.isActive = true
  emit('focus', textEl?.value)
}

function onBlur(): void {
  state.isActive = false
  if (textEl.value) emit('blur', textEl.value)
}

function onInput(e: Event): void {
  let value = (e.target as HTMLInputElement).value
  if (props.filter) {
    value = props.filter(e)
    if (value === undefined) return
    ;(e.target as HTMLInputElement).value = value
  }
  recalcTextHeight()
  emit('update:value', value)
}

function onChange(): void {
  if (textEl.value) emit('change', textEl.value)
}

function onKD(e: KeyboardEvent): void {
  emit('keydown', e)
}

function onAnimationEnd(): void {
  state.wrongValueAnimation = false
}

function recalcTextHeight(): void {
  if (!textEl.value || props.line) return
  textEl.value.style.height = '0'
  textEl.value.style.height = `${textEl.value.scrollHeight - props.padding}px`
}

function focus(): void {
  if (textEl.value) textEl.value.focus({ preventScroll: true })
}

function selectAll(): void {
  if (textEl.value) textEl.value.select()
}

function error(): void {
  state.wrongValueAnimation = true
}

defineExpose({
  focus,
  error,
  recalcTextHeight,
  selectAll,
})
</script>
