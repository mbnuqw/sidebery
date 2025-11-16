<template lang="pug">
.ToggleField(
  :data-inactive="props.inactive"
  :data-loading="loading"
  @click="toggle"
  @keydown="onKeyDown")
  .focus-fx
  .body
    .label(:style="{ color: props.color }") {{translate(props.label)}}
    LoadingDots(v-if="loading")
    ToggleInput.input(ref="inputComponent" :value="props.value")
  .note(v-if="props.note") {{props.note}}
  .note(v-if="props.noteWithLinks" @click.stop="")
    template(v-for="v, i in getNoteWithLinksParts(props.noteWithLinks)")
      template(v-if="!(i%2)") {{v}}
      a(v-else :href="getHref(v)") {{getStr(v)}}
  slot
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { translate } from 'src/dict'
import { ToggleInputComponent } from 'src/types'
import ToggleInput from './toggle-input.vue'
import LoadingDots from './loading-dots.vue'

interface ToggleFieldProps {
  value: boolean | null | undefined
  label: string
  inactive?: boolean
  field?: boolean
  color?: string
  loading?: boolean
  note?: string
  noteWithLinks?: string
}

const emit = defineEmits(['toggle', 'update:value'])
const props = defineProps<ToggleFieldProps>()
const inputComponent = ref<ToggleInputComponent | null>(null)

function toggle(): void {
  if (props.inactive) return
  if (props.loading) return
  emit('update:value', !props.value)
  emit('toggle', !props.value)
}

function getNoteWithLinksParts(note: string): string[] {
  return note.split(/<a |<\/a>/)
}

const hrefRe = /href="(.*)"/
function getHref(str: string): string {
  return hrefRe.exec(str)?.[1] ?? ''
}

const strRe = />(.*)/
function getStr(str: string): string {
  return strRe.exec(str)?.[1] ?? ''
}

function onKeyDown(e: KeyboardEvent) {
  if (
    e.code === 'ArrowLeft' ||
    e.code === 'ArrowRight' ||
    e.code === 'Space' ||
    e.code === 'Enter'
  ) {
    if (!props.loading) toggle()
    e.preventDefault()
  }
}

const publicInterface: ToggleInputComponent = {
  getFocusEl: () => inputComponent.value?.getFocusEl() ?? undefined,
}
defineExpose(publicInterface)
</script>
