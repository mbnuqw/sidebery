<template lang="pug">
.Dialog.popup-container(@click="answer(null)")
  .focus-stealer(
    v-if="dialog.buttonsDefaultFocus"
    tabindex="0"
    ref="focusStealer"
    @keydown.prevent.stop="onKBKey"
    @focus="onFocus"
    @blur="onBlur")
  .popup(@click.stop)
    h2 {{dialog.title}}
    .note(v-if="dialog.note") {{dialog.note}}
    ToggleField(
      v-if="dialog.checkbox"
      :label="dialog.checkbox.label"
      v-model:value="dialog.checkbox.value"
      @update:value="dialog.checkbox?.update")
    .ctrls(:data-centered="dialog.buttonsCentered" :data-inline="dialog.buttonsInline")
      .btn.-wrap(
        v-for="(btn, i) of dialog.buttons"
        :class="{ '-warn': btn.warn, '-wide': !dialog.buttonsInline, '-focused': focusedBtnIndex === i }"
        @click="answer(btn.value)") {{btn.label}}
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Dialog } from 'src/types'
import ToggleField from 'src/components/toggle-field.vue'

const props = defineProps<{ dialog: Dialog }>()
const focusedBtnIndex = ref(-1)
let prevFocusedBtnIndex = -1
const focusStealer = ref<HTMLElement | null>(null)

onMounted(() => {
  if (document.hasFocus() && focusStealer.value) {
    focusStealer.value.focus()
  }
})

function initFocusedBtn() {
  if (!document.hasFocus()) return
  if (props.dialog.buttonsDefaultFocus === undefined) return

  if (prevFocusedBtnIndex === -1) {
    const defaultValue = props.dialog.buttonsDefaultFocus
    const index = props.dialog.buttons.findIndex(b => b.value === defaultValue)
    if (index !== -1) focusedBtnIndex.value = index
  } else {
    focusedBtnIndex.value = prevFocusedBtnIndex
  }
}

function onKBKey(e: KeyboardEvent) {
  // Select next button
  if (e.code === 'ArrowRight' || (e.code === 'Tab' && !e.shiftKey) || e.code === 'KeyL') {
    const index = focusedBtnIndex.value
    const btn = props.dialog.buttons[index]
    if (!btn) return

    const nextButton = props.dialog.buttons[index + 1]
    if (nextButton) focusedBtnIndex.value = index + 1
  }

  // Select prev button
  else if (e.code === 'ArrowLeft' || (e.code === 'Tab' && e.shiftKey) || e.code === 'KeyH') {
    const index = focusedBtnIndex.value
    const btn = props.dialog.buttons[index]
    if (!btn) return

    const nextButton = props.dialog.buttons[index - 1]
    if (nextButton) focusedBtnIndex.value = index - 1
  }

  // Enter
  else if (e.code === 'Enter') {
    const index = focusedBtnIndex.value
    const btn = props.dialog.buttons[index]
    if (!btn) return

    answer(btn.value)
  }
}

function onFocus() {
  initFocusedBtn()
}

function onBlur() {
  prevFocusedBtnIndex = focusedBtnIndex.value
  focusedBtnIndex.value = -1
}

function answer(value: string | null): void {
  if (!props.dialog) return
  props.dialog.result(value)
}
</script>
