<template lang="pug">
.IconSelectField
  .label {{translate(props.label)}}
  SelectIconInput(
    :value="props.value"
    :opts="props.opts"
    :fill="props.optFill"
    @update:value="select")
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import SelectIconInput from './icon-select-input.vue'

const emit = defineEmits(['update:value'])
const props = defineProps<{
  value?: string
  label?: string
  optFill?: string
  opts?: string[]
}>()

function select(option: string): void {
  emit('update:value', option)
}
</script>
