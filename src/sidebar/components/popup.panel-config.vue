<template lang="pug">
.PanelConfigPopup.popup-container(@click="onCancel")
  .popup(v-if="Popups.reactive.panelConfigPopup" @click.stop)
    h2 {{popupTitle}}
    .field
      .field-label {{translate('popup.common.name_label')}}
      TextInput.input(
        ref="titleInput"
        v-model:value="Popups.reactive.panelConfigPopup.config.name"
        :or="'Panel name'"
        :tabindex="'-1'"
        :line="true"
        @keydown="onTitleKD")

    .field
      .field-label {{translate('popup.common.icon_label')}}
      SelectInput.input(
        v-model:value="Popups.reactive.panelConfigPopup.config.iconSVG"
        :opts="iconsOpts"
        :color="Popups.reactive.panelConfigPopup.config.color"
      )

    .field
      .field-label {{translate('popup.common.color_label')}}
      SelectInput.input(
        v-model:value="Popups.reactive.panelConfigPopup.config.color"
        :opts="COLOR_OPTS"
        :icon="'#' + Popups.reactive.panelConfigPopup.config.iconSVG"
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
import * as Popups from 'src/services/popups'
import { translate } from 'src/dict'
import { Sidebar } from 'src/services/sidebar'
import { PANEL_ICON_OPTS, COLOR_OPTS } from 'src/defaults'
import TextInput from 'src/components/text-input.vue'
import SelectInput from 'src/components/select-input.vue'
import { SetupPage } from 'src/services/setup-page'
import { InputOption, TextInputComponent, TabsPanelConfig, BookmarksPanelConfig } from 'src/types'
import { Settings } from 'src/services/settings'

const TABS_PANEL_ICON_OPTS = [{ value: 'icon_tabs', icon: '#icon_tabs' }, ...PANEL_ICON_OPTS]
const BOOKMARKS_PANEL_ICON_OPTS = [
  { value: 'icon_bookmarks', icon: '#icon_bookmarks' },
  ...PANEL_ICON_OPTS,
]

const titleInput = ref<TextInputComponent | null>(null)

onMounted(() => {
  titleInput.value?.focus()
})

const valid = computed<boolean>(() => {
  if (!Popups.reactive.panelConfigPopup) return false
  return !!Popups.reactive.panelConfigPopup.config.name
})

const panelExists = computed<boolean>(() => {
  if (!Popups.reactive.panelConfigPopup) return false

  const panel = Sidebar.panelsById[Popups.reactive.panelConfigPopup.config.id]
  return !!panel
})

const popupTitle = computed<string>(() => {
  if (!Popups.reactive.panelConfigPopup) return ''
  const popup = Popups.reactive.panelConfigPopup

  if (Utils.isTabsPanel(popup.config)) return translate('popup.tabs_panel.title')
  if (Utils.isBookmarksPanel(popup.config)) return translate('popup.bookmarks_panel.title')
  return ''
})

const iconsOpts = computed<InputOption[]>(() => {
  if (!Popups.reactive.panelConfigPopup) return []
  const popup = Popups.reactive.panelConfigPopup

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
  if (!Popups.reactive.panelConfigPopup || !panelExists.value) return

  SetupPage.open(`settings_nav.${Popups.reactive.panelConfigPopup.config.id}`)
  Popups.reactive.panelConfigPopup.done(null)
  Popups.reactive.panelConfigPopup = null
}

function onSave(): void {
  if (!Popups.reactive.panelConfigPopup) return
  const popup = Popups.reactive.panelConfigPopup

  if (!valid.value) return

  let panel = Sidebar.panelsById[popup.config.id]

  // Update existed panel
  if (panel) {
    Utils.updateObject(panel, popup.config, ['name', 'iconSVG', 'color'])
    panel.reactive.name = panel.name
    panel.reactive.color = panel.color
    panel.reactive.iconSVG = panel.iconSVG
    panel.reactive.tooltip = Sidebar.getPanelTooltip(panel)
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

    panel.reactive.name = panel.name
    panel.reactive.color = panel.color
    panel.reactive.iconSVG = panel.iconSVG

    if (popup.index !== undefined && popup.index >= 0) {
      panel.index = popup.index
    } else if (panel.index === -1) {
      if (isTabsPanel) {
        panel.index = Utils.findLastIndex(Sidebar.reactive.nav, id => {
          return Utils.isTabsPanel(Sidebar.panelsById[id])
        })
      } else if (isBookmarksPanel) {
        panel.index = Utils.findLastIndex(Sidebar.reactive.nav, id => {
          return Utils.isBookmarksPanel(Sidebar.panelsById[id])
        })
      }
      if (panel.index === -1) panel.index = Sidebar.reactive.nav.length
      else panel.index++
    }

    if (!panel.id) panel.id = Utils.uid()
    Sidebar.panelsById[panel.id] = panel
    Sidebar.reactive.nav.splice(panel.index, 0, panel.id)
    Sidebar.recalcPanels()
    if (isTabsPanel) Sidebar.recalcTabsPanels()
    else if (isBookmarksPanel) Sidebar.recalcBookmarksPanels()
    Sidebar.saveSidebar(300)
  }

  if (Settings.state.updateSidebarTitle && Sidebar.reactive.activePanelId === panel.id) {
    Sidebar.updateSidebarTitle()
  }

  Popups.reactive.panelConfigPopup.done(panel.id)
  Popups.reactive.panelConfigPopup = null
}

function onCancel(): void {
  if (!Popups.reactive.panelConfigPopup) return

  Popups.reactive.panelConfigPopup.done(null)
  Popups.reactive.panelConfigPopup = null
}
</script>
