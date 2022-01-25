<template lang="pug">
.ToggleInput(:data-active="props.value" @click="toggle")
  .opt.-true: p {{translate('settings.opt_true')}}
  .opt.-false: p {{translate('settings.opt_false')}}
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'

const emit = defineEmits(['update:value'])
const props = defineProps<{ value: boolean | null | undefined }>()

function toggle(): void {
  emit('update:value', !props.value)
}
</script>
