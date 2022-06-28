<template lang="pug">
.GroupConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Sidebar.reactive.groupConfigPopup" @click.stop)
    h2 {{translate('popup.group_config.popup_title')}}
    .field
      .field-label {{translate('popup.group_config.title')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Sidebar.reactive.groupConfigPopup.config.title"
        :or="translate('popup.group_config.title_placeholder')"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .ctrls
      .btn(@click="onOk") {{translate('btn.create')}}
      .btn.-warn(@click="onCancel") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { GroupConfigResult, Sidebar } from 'src/services/sidebar'
import TextInput from 'src/components/text-input.vue'
import { TextInputComponent } from 'src/types'

const titleInput = ref<TextInputComponent | null>(null)

onMounted(() => {
  titleInput.value?.focus()
  titleInput.value?.selectAll()
})

function onTitleKD(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    onOk()
  }
}

function onOk(): void {
  if (!Sidebar.reactive.groupConfigPopup) return

  Sidebar.reactive.groupConfigPopup.done(GroupConfigResult.Ok)
  Sidebar.reactive.groupConfigPopup = null
}

function onCancel(): void {
  if (!Sidebar.reactive.groupConfigPopup) return

  Sidebar.reactive.groupConfigPopup.done(GroupConfigResult.Cancel)
  Sidebar.reactive.groupConfigPopup = null
}
</script>
