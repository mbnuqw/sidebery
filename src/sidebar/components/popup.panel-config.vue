<template lang="pug">
.PanelConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Sidebar.reactive.fastPanelConfig" @click.stop)
    h2 {{popupTitle}}
    .field
      .field-label {{translate('panel.fast_conf.name')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Sidebar.reactive.fastPanelConfig.name"
        :or="'Panel name'"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('panel.fast_conf.icon')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.fastPanelConfig.iconSVG"
        :opts="iconsOpts"
        :color="Sidebar.reactive.fastPanelConfig.color"
      )

    .field
      .field-label {{translate('panel.fast_conf.color')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.fastPanelConfig.color"
        :opts="COLOR_OPTS"
        :icon="Sidebar.reactive.fastPanelConfig.iconSVG"
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
import { PANEL_ICON_OPTS, COLOR_OPTS } from 'src/defaults'
import TextInput from 'src/components/text-input.vue'
import SelectInput from 'src/components/select-input.vue'
import { SetupPage } from 'src/services/setup-page'
import { InputOption, TextInputComponent } from 'src/types'
import { Settings } from 'src/services/settings'

const TABS_PANEL_ICON_OPTS = [{ value: 'icon_tabs', icon: 'icon_tabs' }, ...PANEL_ICON_OPTS]
const BOOKMARKS_PANEL_ICON_OPTS = [
  { value: 'icon_bookmarks', icon: 'icon_bookmarks' },
  ...PANEL_ICON_OPTS,
]

const titleInput = ref<TextInputComponent | null>(null)

onMounted(() => {
  titleInput.value?.focus()
})

const popupTitle = computed<string>(() => {
  if (!Sidebar.reactive.fastPanelConfig) return ''

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.fastPanelConfig.id]
  if (Utils.isTabsPanel(panel)) return translate('panel.fast_conf.title_tabs')
  if (Utils.isBookmarksPanel(panel)) return translate('panel.fast_conf.title_bookmarks')
  return ''
})

const iconsOpts = computed<InputOption[]>(() => {
  if (!Sidebar.reactive.fastPanelConfig) return []

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.fastPanelConfig.id]
  if (Utils.isTabsPanel(panel)) return TABS_PANEL_ICON_OPTS
  if (Utils.isBookmarksPanel(panel)) return BOOKMARKS_PANEL_ICON_OPTS
  return []
})

function onTitleKD(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    onSave()
  }
}

function openFullConfig(): void {
  if (!Sidebar.reactive.fastPanelConfig) return

  SetupPage.open(`settings_nav.${Sidebar.reactive.fastPanelConfig.id}`)
  Sidebar.reactive.fastPanelConfig.done(true)
  Sidebar.reactive.fastPanelConfig = null
}

function onSave(): void {
  if (!Sidebar.reactive.fastPanelConfig) return

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.fastPanelConfig.id]
  if (!panel) {
    Sidebar.reactive.fastPanelConfig.done(false)
    Sidebar.reactive.fastPanelConfig = null
    return
  }

  panel.name = Sidebar.reactive.fastPanelConfig.name
  panel.iconSVG = Sidebar.reactive.fastPanelConfig.iconSVG
  panel.color = Sidebar.reactive.fastPanelConfig.color

  Sidebar.saveSidebar()

  if (Settings.reactive.updateSidebarTitle && Sidebar.reactive.activePanelId === panel.id) {
    Sidebar.updateSidebarTitle()
  }

  Sidebar.reactive.fastPanelConfig.done(true)
  Sidebar.reactive.fastPanelConfig = null
}

function onCancel(): void {
  if (!Sidebar.reactive.fastPanelConfig) return

  if (Sidebar.reactive.fastPanelConfig.removeOnCancel) {
    Sidebar.removePanel(Sidebar.reactive.fastPanelConfig.id)
  }

  Sidebar.reactive.fastPanelConfig.done(false)
  Sidebar.reactive.fastPanelConfig = null
}
</script>
