<template lang="pug">
.ContainerConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Sidebar.reactive.fastContainerConfig" @click.stop)
    h2 {{translate('panel.fast_conf.title')}}
    .field
      .field-label {{translate('panel.fast_conf.name')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Sidebar.reactive.fastContainerConfig.name"
        :or="'Panel name'"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('panel.fast_conf.icon')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.fastContainerConfig.icon"
        :opts="CONTAINER_ICON_OPTS"
        :color="Sidebar.reactive.fastContainerConfig.color"
      )

    .field
      .field-label {{translate('panel.fast_conf.color')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.fastContainerConfig.color"
        :opts="COLOR_OPTS"
        :icon="Sidebar.reactive.fastContainerConfig.icon"
      )

    .ctrls
      .btn.-wide(@click="openFullConfig") {{translate('panel.fast_conf.btn_more')}}
      .btn(@click="onSave") {{translate('btn.save')}}
      .btn.-warn(@click="onCancel") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import Utils from 'src/utils'
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
  if (!Sidebar.reactive.fastContainerConfig) return

  SetupPage.open(`settings_containers.${Sidebar.reactive.fastContainerConfig.id}`)
  Sidebar.reactive.fastContainerConfig.done(false)
  Sidebar.reactive.fastContainerConfig = null
}

async function onSave(): Promise<void> {
  if (!Sidebar.reactive.fastContainerConfig) return

  const container = Containers.reactive.byId[Sidebar.reactive.fastContainerConfig.id]
  if (!container) {
    Sidebar.reactive.fastContainerConfig.done(false)
    Sidebar.reactive.fastContainerConfig = null
    return
  }

  container.name = Sidebar.reactive.fastContainerConfig.name
  container.icon = Sidebar.reactive.fastContainerConfig.icon
  container.color = Sidebar.reactive.fastContainerConfig.color

  await browser.contextualIdentities.update(container.id, {
    name: Sidebar.reactive.fastContainerConfig.name,
    icon: Sidebar.reactive.fastContainerConfig.icon,
    color: Sidebar.reactive.fastContainerConfig.color,
  })

  Sidebar.reactive.fastContainerConfig.done(true)
  Sidebar.reactive.fastContainerConfig = null
}

async function onCancel(): Promise<void> {
  if (!Sidebar.reactive.fastContainerConfig) return

  if (Sidebar.reactive.fastContainerConfig.removeOnCancel) {
    await browser.contextualIdentities.remove(Sidebar.reactive.fastContainerConfig.id as string)
  }

  Sidebar.reactive.fastContainerConfig.done(false)
  Sidebar.reactive.fastContainerConfig = null
}
</script>
