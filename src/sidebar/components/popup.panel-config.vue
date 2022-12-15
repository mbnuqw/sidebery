<template lang="pug">
.PanelConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Sidebar.reactive.panelConfigPopup" @click.stop)
    h2 {{popupTitle}}
    .field
      .field-label {{translate('popup.common.name_label')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Sidebar.reactive.panelConfigPopup.config.name"
        :or="'Panel name'"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('popup.common.icon_label')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.panelConfigPopup.config.iconSVG"
        :opts="iconsOpts"
        :color="Sidebar.reactive.panelConfigPopup.config.color"
      )

    .field
      .field-label {{translate('popup.common.color_label')}}
      SelectInput.input(
        v-model:value="Sidebar.reactive.panelConfigPopup.config.color"
        :opts="COLOR_OPTS"
        :icon="Sidebar.reactive.panelConfigPopup.config.iconSVG"
      )

    .ctrls
      .btn.-wide(v-if="panelExists" @click="openFullConfig") {{translate('popup.common.btn_more')}}
      .btn(v-if="panelExists" :class="{ '-inactive': !valid }" @click="onSave") {{translate('btn.save')}}
      .btn(v-else :class="{ '-inactive': !valid }" @click="onSave") {{translate('btn.create')}}
      .btn.-warn(@click="onCancel") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Sidebar } from 'src/services/sidebar'
import { PANEL_ICON_OPTS, COLOR_OPTS } from 'src/defaults'
import TextInput from 'src/components/text-input.vue'
import SelectInput from 'src/components/select-input.vue'
import { SetupPage } from 'src/services/setup-page'
import { InputOption, TextInputComponent, TabsPanelConfig, BookmarksPanelConfig } from 'src/types'
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

const valid = computed<boolean>(() => {
  if (!Sidebar.reactive.panelConfigPopup) return false
  return !!Sidebar.reactive.panelConfigPopup.config.name
})

const panelExists = computed<boolean>(() => {
  if (!Sidebar.reactive.panelConfigPopup) return false

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.panelConfigPopup.config.id]
  return !!panel
})

const popupTitle = computed<string>(() => {
  if (!Sidebar.reactive.panelConfigPopup) return ''
  const popup = Sidebar.reactive.panelConfigPopup

  if (Utils.isTabsPanel(popup.config)) return translate('popup.tabs_panel.title')
  if (Utils.isBookmarksPanel(popup.config)) return translate('popup.bookmarks_panel.title')
  return ''
})

const iconsOpts = computed<InputOption[]>(() => {
  if (!Sidebar.reactive.panelConfigPopup) return []
  const popup = Sidebar.reactive.panelConfigPopup

  if (Utils.isTabsPanel(popup.config)) return TABS_PANEL_ICON_OPTS
  if (Utils.isBookmarksPanel(popup.config)) return BOOKMARKS_PANEL_ICON_OPTS
  return []
})

function onTitleKD(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    onSave()
  }
}

function openFullConfig(): void {
  if (!Sidebar.reactive.panelConfigPopup || !panelExists.value) return

  SetupPage.open(`settings_nav.${Sidebar.reactive.panelConfigPopup.config.id}`)
  Sidebar.reactive.panelConfigPopup.done(null)
  Sidebar.reactive.panelConfigPopup = null
}

function onSave(): void {
  if (!Sidebar.reactive.panelConfigPopup) return
  const popup = Sidebar.reactive.panelConfigPopup

  if (!valid.value) return

  let panel = Sidebar.reactive.panelsById[popup.config.id]

  // Update existed panel
  if (panel) {
    Utils.updateObject(panel, popup.config, ['name', 'iconSVG', 'color'])
    Sidebar.saveSidebar()
  }

  // Create panel
  else {
    const isTabsPanel = Utils.isTabsPanel(popup.config)
    const isBookmarksPanel = Utils.isBookmarksPanel(popup.config)
    if (isTabsPanel) {
      panel = Sidebar.createTabsPanel(popup.config as TabsPanelConfig)
    } else if (isBookmarksPanel) {
      panel = Sidebar.createBookmarksPanel(popup.config as BookmarksPanelConfig)
    } else {
      return
    }

    if (panel.index === -1) {
      if (isTabsPanel) {
        panel.index = Utils.findLastIndex(Sidebar.reactive.nav, id => {
          return Utils.isTabsPanel(Sidebar.reactive.panelsById[id])
        })
      } else if (isBookmarksPanel) {
        panel.index = Utils.findLastIndex(Sidebar.reactive.nav, id => {
          return Utils.isBookmarksPanel(Sidebar.reactive.panelsById[id])
        })
      }
      if (panel.index === -1) panel.index = Sidebar.reactive.nav.length
      else panel.index++
    }

    if (!panel.id) panel.id = Utils.uid()
    Sidebar.reactive.panelsById[panel.id] = panel
    Sidebar.reactive.nav.splice(panel.index, 0, panel.id)
    Sidebar.recalcPanels()
    if (isTabsPanel) Sidebar.recalcTabsPanels()
    else if (isBookmarksPanel) Sidebar.recalcBookmarksPanels()
    Sidebar.saveSidebar(300)
  }

  if (Settings.state.updateSidebarTitle && Sidebar.reactive.activePanelId === panel.id) {
    Sidebar.updateSidebarTitle()
  }

  Sidebar.reactive.panelConfigPopup.done(panel.id)
  Sidebar.reactive.panelConfigPopup = null
}

function onCancel(): void {
  if (!Sidebar.reactive.panelConfigPopup) return

  Sidebar.reactive.panelConfigPopup.done(null)
  Sidebar.reactive.panelConfigPopup = null
}
</script>
