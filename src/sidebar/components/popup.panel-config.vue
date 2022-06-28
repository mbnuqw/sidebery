<template lang="pug">
.PanelConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Sidebar.reactive.panelConfigPopup" @click.stop)
    h2 {{popupTitle}}
    .field
      .field-label {{translate('panel.fast_conf.name')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Sidebar.reactive.panelConfigPopup.name"
        :or="'Panel name'"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('panel.fast_conf.icon')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.panelConfigPopup.iconSVG"
        :opts="iconsOpts"
        :color="Sidebar.reactive.panelConfigPopup.color"
      )

    .field
      .field-label {{translate('panel.fast_conf.color')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.panelConfigPopup.color"
        :opts="COLOR_OPTS"
        :icon="Sidebar.reactive.panelConfigPopup.iconSVG"
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
  if (!Sidebar.reactive.panelConfigPopup) return ''

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.panelConfigPopup.id]
  if (Utils.isTabsPanel(panel)) return translate('panel.fast_conf.title_tabs')
  if (Utils.isBookmarksPanel(panel)) return translate('panel.fast_conf.title_bookmarks')
  return ''
})

const iconsOpts = computed<InputOption[]>(() => {
  if (!Sidebar.reactive.panelConfigPopup) return []

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.panelConfigPopup.id]
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
  if (!Sidebar.reactive.panelConfigPopup) return

  SetupPage.open(`settings_nav.${Sidebar.reactive.panelConfigPopup.id}`)
  Sidebar.reactive.panelConfigPopup.done(true)
  Sidebar.reactive.panelConfigPopup = null
}

function onSave(): void {
  if (!Sidebar.reactive.panelConfigPopup) return

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.panelConfigPopup.id]
  if (!panel) {
    Sidebar.reactive.panelConfigPopup.done(false)
    Sidebar.reactive.panelConfigPopup = null
    return
  }

  panel.name = Sidebar.reactive.panelConfigPopup.name
  panel.iconSVG = Sidebar.reactive.panelConfigPopup.iconSVG
  panel.color = Sidebar.reactive.panelConfigPopup.color

  Sidebar.saveSidebar()

  if (Settings.reactive.updateSidebarTitle && Sidebar.reactive.activePanelId === panel.id) {
    Sidebar.updateSidebarTitle()
  }

  Sidebar.reactive.panelConfigPopup.done(true)
  Sidebar.reactive.panelConfigPopup = null
}

function onCancel(): void {
  if (!Sidebar.reactive.panelConfigPopup) return

  if (Sidebar.reactive.panelConfigPopup.removeOnCancel) {
    Sidebar.removePanel(Sidebar.reactive.panelConfigPopup.id)
  }

  Sidebar.reactive.panelConfigPopup.done(false)
  Sidebar.reactive.panelConfigPopup = null
}
</script>
