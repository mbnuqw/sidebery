<template lang="pug">
.ToggleInput(:data-active="props.value" @click="toggle")
  .focus-el(ref="focusEl" tabindex="-1")
  .opt.-true: p {{translate('settings.opt_true')}}
  .opt.-false: p {{translate('settings.opt_false')}}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { translate } from 'src/dict'
import { ToggleInputComponent } from 'src/types'

const emit = defineEmits(['update:value'])
const props = defineProps<{ value: boolean | null | undefined }>()
const focusEl = ref<HTMLElement | null>(null)

function toggle(): void {
  emit('update:value', !props.value)
}

const publicInterface: ToggleInputComponent = {
  getFocusEl: () => focusEl.value ?? undefined,
}
defineExpose(publicInterface)
</script>
