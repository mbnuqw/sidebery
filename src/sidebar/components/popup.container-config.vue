<template lang="pug">
.ContainerConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Sidebar.reactive.containerConfigPopup" @click.stop)
    h2 {{translate('popup.container.title')}}
    .field
      .field-label {{translate('popup.common.name_label')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Sidebar.reactive.containerConfigPopup.name"
        :or="translate('popup.container.name_placeholder')"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('popup.common.icon_label')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.containerConfigPopup.icon"
        :opts="CONTAINER_ICON_OPTS"
        :color="Sidebar.reactive.containerConfigPopup.color"
      )

    .field
      .field-label {{translate('popup.common.color_label')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.containerConfigPopup.color"
        :opts="COLOR_OPTS"
        :icon="'#' + Sidebar.reactive.containerConfigPopup.icon"
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
import { Sidebar } from 'src/services/sidebar'
import { CONTAINER_ICON_OPTS, COLOR_OPTS } from 'src/defaults'
import TextInput from 'src/components/text-input.vue'
import SelectInput from 'src/components/select-input.vue'
import { SetupPage } from 'src/services/setup-page'
import { TextInputComponent, Container } from 'src/types'
import { Containers } from 'src/services/containers'

const titleInput = ref<TextInputComponent | null>(null)

const container = computed<Container | null>(() => {
  if (!Sidebar.reactive.containerConfigPopup) return null

  let container = Containers.reactive.byId[Sidebar.reactive.containerConfigPopup.id]
  return container ?? null
})

const valid = computed<boolean>(() => {
  if (!Sidebar.reactive.containerConfigPopup) return false
  return !!Sidebar.reactive.containerConfigPopup.name
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
  if (!Sidebar.reactive.containerConfigPopup || !container.value) return

  SetupPage.open(`settings_containers.${Sidebar.reactive.containerConfigPopup.id}`)
  Sidebar.reactive.containerConfigPopup.done(null)
  Sidebar.reactive.containerConfigPopup = null
}

async function onSave(): Promise<void> {
  if (!Sidebar.reactive.containerConfigPopup) return
  const popup = Sidebar.reactive.containerConfigPopup

  if (!valid.value) return

  let container = Containers.reactive.byId[Sidebar.reactive.containerConfigPopup.id]
  if (container) {
    container.name = Sidebar.reactive.containerConfigPopup.name
    container.icon = Sidebar.reactive.containerConfigPopup.icon
    container.color = Sidebar.reactive.containerConfigPopup.color

    await browser.contextualIdentities.update(container.id, {
      name: Sidebar.reactive.containerConfigPopup.name,
      icon: Sidebar.reactive.containerConfigPopup.icon,
      color: Sidebar.reactive.containerConfigPopup.color,
    })
  } else {
    container = await Containers.create(popup.name, popup.color, popup.icon)
  }

  Sidebar.reactive.containerConfigPopup.done(container.id)
  Sidebar.reactive.containerConfigPopup = null
}

function onCancel(): void {
  if (!Sidebar.reactive.containerConfigPopup) return

  Sidebar.reactive.containerConfigPopup.done(null)
  Sidebar.reactive.containerConfigPopup = null
}
</script>
