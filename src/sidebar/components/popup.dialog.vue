<template lang="pug">
.Dialog.popup-container(@click="answer(null)")
  .popup(@click.stop)
    h2 {{dialog.title}}
    .note(v-if="dialog.text") {{dialog.text}}
    .ctrls
      .btn.-wide.-wrap(
        v-for="btn of dialog.buttons"
        :class="{ '-warn': btn.warn }"
        @click="answer(btn.value)") {{btn.label}}
</template>

<script lang="ts" setup>
import { Dialog } from 'src/types'

const props = defineProps<{ dialog: Dialog }>()

function answer(value: string | null): void {
  if (!props.dialog) return
  props.dialog.result(value)
}
</script>
