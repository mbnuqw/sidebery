<template lang="pug">
.Dialog.popup-container(@click="answer(null)")
  .popup(@click.stop)
    h2 {{dialog.title}}
    .note(v-if="dialog.note") {{dialog.note}}
    ToggleField(
      v-if="dialog.checkbox"
      :label="dialog.checkbox.label"
      v-model:value="dialog.checkbox.value"
      @update:value="dialog.checkbox?.update")
    .ctrls(:data-centered="dialog.buttonsCentered")
      .btn.-wide.-wrap(
        v-for="btn of dialog.buttons"
        :class="{ '-warn': btn.warn }"
        @click="answer(btn.value)") {{btn.label}}
</template>

<script lang="ts" setup>
import { Dialog } from 'src/types'
import ToggleField from 'src/components/toggle-field.vue'

const props = defineProps<{ dialog: Dialog }>()

function answer(value: string | null): void {
  if (!props.dialog) return
  props.dialog.result(value)
}
</script>
