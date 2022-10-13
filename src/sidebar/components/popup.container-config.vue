<template lang="pug">
.ContainerConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Sidebar.reactive.containerConfigPopup" @click.stop)
    h2 {{translate('panel.fast_conf.title')}}
    .field
      .field-label {{translate('panel.fast_conf.name')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Sidebar.reactive.containerConfigPopup.name"
        :or="'Panel name'"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('panel.fast_conf.icon')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.containerConfigPopup.icon"
        :opts="CONTAINER_ICON_OPTS"
        :color="Sidebar.reactive.containerConfigPopup.color"
      )

    .field
      .field-label {{translate('panel.fast_conf.color')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.containerConfigPopup.color"
        :opts="COLOR_OPTS"
        :icon="Sidebar.reactive.containerConfigPopup.icon"
      )

    .ctrls
      .btn.-wide(@click="openFullConfig") {{translate('panel.fast_conf.btn_more')}}
      .btn(@click="onSave") {{translate('btn.save')}}
      .btn.-warn(@click="onCancel") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Sidebar } from 'src/services/sidebar'
import { CONTAINER_ICON_OPTS, COLOR_OPTS } from 'src/defaults'
import TextInput from 'src/components/text-input.vue'
import SelectInput from 'src/components/select-input.vue'
import { SetupPage } from 'src/services/setup-page'
import { InputOption, TextInputComponent } from 'src/types'
import { Settings } from 'src/services/settings'
import { Containers } from 'src/services/containers'

const titleInput = ref<TextInputComponent | null>(null)

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
  if (!Sidebar.reactive.containerConfigPopup) return

  SetupPage.open(`settings_containers.${Sidebar.reactive.containerConfigPopup.id}`)
  Sidebar.reactive.containerConfigPopup.done(false)
  Sidebar.reactive.containerConfigPopup = null
}

async function onSave(): Promise<void> {
  if (!Sidebar.reactive.containerConfigPopup) return

  const container = Containers.reactive.byId[Sidebar.reactive.containerConfigPopup.id]
  if (!container) {
    Sidebar.reactive.containerConfigPopup.done(false)
    Sidebar.reactive.containerConfigPopup = null
    return
  }

  container.name = Sidebar.reactive.containerConfigPopup.name
  container.icon = Sidebar.reactive.containerConfigPopup.icon
  container.color = Sidebar.reactive.containerConfigPopup.color

  await browser.contextualIdentities.update(container.id, {
    name: Sidebar.reactive.containerConfigPopup.name,
    icon: Sidebar.reactive.containerConfigPopup.icon,
    color: Sidebar.reactive.containerConfigPopup.color,
  })

  Sidebar.reactive.containerConfigPopup.done(true)
  Sidebar.reactive.containerConfigPopup = null
}

async function onCancel(): Promise<void> {
  if (!Sidebar.reactive.containerConfigPopup) return

  if (Sidebar.reactive.containerConfigPopup.removeOnCancel) {
    await browser.contextualIdentities.remove(Sidebar.reactive.containerConfigPopup.id as string)
  }

  Sidebar.reactive.containerConfigPopup.done(false)
  Sidebar.reactive.containerConfigPopup = null
}
</script>
