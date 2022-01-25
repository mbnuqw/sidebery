<template lang="pug">
.TextField(:data-inactive="props.inactive" @click="focus")
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
      @keydown="emit('keydown', $event)")
  .note(v-if="props.note") {{props.note}}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { translate } from 'src/dict'
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
  inputWidth?: string
}

const emit = defineEmits(['update:value', 'keydown'])
const props = withDefaults(defineProps<TextFieldProps>(), { padding: 0, tabindex: '0' })

const inputEl = ref<HTMLInputElement | null>(null)

function focus(): void {
  inputEl.value?.focus()
}

defineExpose({
  focus,
})
</script>
