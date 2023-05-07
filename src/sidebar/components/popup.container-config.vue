<template lang="pug">
.ContainerConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Popups.reactive.containerConfigPopup" @click.stop)
    h2 {{translate('popup.container.title')}}
    .field
      .field-label {{translate('popup.common.name_label')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Popups.reactive.containerConfigPopup.name"
        :or="translate('popup.container.name_placeholder')"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('popup.common.icon_label')}}
      SelectInput.input(
        v-model:value="Popups.reactive.containerConfigPopup.icon"
        :opts="CONTAINER_ICON_OPTS"
        :color="Popups.reactive.containerConfigPopup.color"
      )

    .field
      .field-label {{translate('popup.common.color_label')}}
      SelectInput.input(
        v-model:value="Popups.reactive.containerConfigPopup.color"
        :opts="COLOR_OPTS"
        :icon="'#' + Popups.reactive.containerConfigPopup.icon"
      )

    .ctrls
      .btn.-wide(v-if="container"
        @click="openFullConfig") {{translate('popup.common.btn_more')}}
      .btn(v-if="container" :class="{ '-inactive': !valid }" @click="onSave") {{translate('btn.save')}}
      .btn(v-else :class="{ '-inactive': !valid }" @click="onSave") {{translate('btn.create')}}
      .btn.-warn(@click="onCancel") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { CONTAINER_ICON_OPTS, COLOR_OPTS } from 'src/defaults'
import TextInput from 'src/components/text-input.vue'
import SelectInput from 'src/components/select-input.vue'
import { SetupPage } from 'src/services/setup-page'
import { TextInputComponent, Container } from 'src/types'
import { Containers } from 'src/services/containers'
import * as Popups from 'src/services/popups'

const titleInput = ref<TextInputComponent | null>(null)

const container = computed<Container | null>(() => {
  if (!Popups.reactive.containerConfigPopup) return null

  let container = Containers.reactive.byId[Popups.reactive.containerConfigPopup.id]
  return container ?? null
})

const valid = computed<boolean>(() => {
  if (!Popups.reactive.containerConfigPopup) return false
  return !!Popups.reactive.containerConfigPopup.name
})

onMounted(() => {
  titleInput.value?.focus()
})

function onTitleKD(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    onSave()
  }
}

function openFullConfig(): void {
  if (!Popups.reactive.containerConfigPopup || !container.value) return

  SetupPage.open(`settings_containers.${Popups.reactive.containerConfigPopup.id}`)
  Popups.reactive.containerConfigPopup.done(null)
  Popups.reactive.containerConfigPopup = null
}

async function onSave(): Promise<void> {
  if (!Popups.reactive.containerConfigPopup) return
  const popup = Popups.reactive.containerConfigPopup

  if (!valid.value) return

  let container = Containers.reactive.byId[Popups.reactive.containerConfigPopup.id]
  if (container) {
    container.name = Popups.reactive.containerConfigPopup.name
    container.icon = Popups.reactive.containerConfigPopup.icon
    container.color = Popups.reactive.containerConfigPopup.color

    await browser.contextualIdentities.update(container.id, {
      name: Popups.reactive.containerConfigPopup.name,
      icon: Popups.reactive.containerConfigPopup.icon,
      color: Popups.reactive.containerConfigPopup.color,
    })
  } else {
    container = await Containers.create(popup.name, popup.color, popup.icon)
  }

  Popups.reactive.containerConfigPopup.done(container.id)
  Popups.reactive.containerConfigPopup = null
}

function onCancel(): void {
  if (!Popups.reactive.containerConfigPopup) return

  Popups.reactive.containerConfigPopup.done(null)
  Popups.reactive.containerConfigPopup = null
}
</script>
