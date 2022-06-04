<template lang="pug">
section(ref="el")
  h2 {{translate('settings.tabs_title')}}
  SelectField(
    label="settings.warn_on_multi_tab_close"
    optLabel="settings.warn_on_multi_tab_close_"
    v-model:value="Settings.reactive.warnOnMultiTabClose"
    :opts="Settings.getOpts('warnOnMultiTabClose')")
  ToggleField(label="settings.tabs_rm_undo_note" v-model:value="Settings.reactive.tabsRmUndoNote")
  ToggleField(label="settings.activate_on_mouseup" v-model:value="Settings.reactive.activateOnMouseUp")
  ToggleField(
    label="settings.activate_last_tab_on_panel_switching"
    :value="Settings.reactive.activateLastTabOnPanelSwitching"
    @update:value="toggleActivateLastTabOnPanelSwitching")
  ToggleField(label="settings.show_tab_rm_btn" v-model:value="Settings.reactive.showTabRmBtn")
  ToggleField(
    label="settings.hide_inactive_panel_tabs"
    :value="Settings.reactive.hideInact"
    @update:value="toggleHideInact")
  SelectField(
    label="settings.activate_after_closing"
    optLabel="settings.activate_after_closing_"
    v-model:value="Settings.reactive.activateAfterClosing"
    :folded="true"
    :opts="Settings.getOpts('activateAfterClosing')")
  .sub-fields
    ToggleField(
      label="settings.activate_after_closing_global"
      v-model:value="Settings.reactive.activateAfterClosingGlobal"
      :inactive="Settings.reactive.activateAfterClosing !== 'prev_act'")
    ToggleField(
      label="settings.activate_after_closing_no_folded"
      v-model:value="Settings.reactive.activateAfterClosingNoFolded"
      :inactive="Settings.reactive.activateAfterClosing !== 'prev_act'")
    ToggleField(
      label="settings.activate_after_closing_no_discarded"
      v-model:value="Settings.reactive.activateAfterClosingNoDiscarded"
      :inactive="Settings.reactive.activateAfterClosing === 'none'")
  ToggleField(
    label="settings.shift_selection_from_active"
    v-model:value="Settings.reactive.shiftSelAct")
  ToggleField(
    label="settings.ask_new_bookmark_place"
    v-model:value="Settings.reactive.askNewBookmarkPlace")
  ToggleField(label="settings.native_highlight" v-model:value="Settings.reactive.nativeHighlight")
  ToggleField(label="settings.tabs_unread_mark" v-model:value="Settings.reactive.tabsUnreadMark")
  CountField.-inline(
    label="settings.tabs_reload_limit"
    v-model:value="Settings.reactive.tabsReloadLimit"
    :min="1")
  .sub-fields
    ToggleField(
      label="settings.tabs_reload_limit_notif"
      v-model:value="Settings.reactive.tabsReloadLimitNotif"
      :inactive="!(Settings.reactive.tabsReloadLimit > 0)")
  ToggleField(
    label="settings.tabs_panel_switch_act_move"
    :value="Settings.reactive.tabsPanelSwitchActMove"
    @update:value="toggleTabsPanelSwitchActMove")
  ToggleField(
    label="settings.show_new_tab_btns"
    v-model:value="Settings.reactive.showNewTabBtns")
  .sub-fields
    SelectField(
      label="settings.new_tab_bar_position"
      optLabel="settings.new_tab_bar_position_"
      v-model:value="Settings.reactive.newTabBarPosition"
      :inactive="!Settings.reactive.showNewTabBtns"
      :opts="Settings.getOpts('newTabBarPosition')")
  ToggleField(
    label="settings.open_sub_panel_on_mouse_hover"
    v-model:value="Settings.reactive.openSubPanelOnMouseHover")
  ToggleField(
    label="settings.colorize_tabs"
    v-model:value="Settings.reactive.colorizeTabs")
  .sub-fields
    SelectField(
      label="settings.colorize_tabs_src"
      optLabel="settings.colorize_tabs_src_"
      v-model:value="Settings.reactive.colorizeTabsSrc"
      :inactive="!Settings.reactive.colorizeTabs"
      :opts="Settings.getOpts('colorizeTabsSrc')")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import CountField from '../../components/count-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

function toggleActivateLastTabOnPanelSwitching(): void {
  Settings.reactive.activateLastTabOnPanelSwitching =
    !Settings.reactive.activateLastTabOnPanelSwitching

  if (!Settings.reactive.activateLastTabOnPanelSwitching && Settings.reactive.hideInact) {
    Settings.reactive.hideInact = false
  }
}

function toggleHideInact(): void {
  if (!Settings.reactive.hideInact && !Permissions.reactive.tabHide) location.hash = 'tab-hide'
  else Settings.reactive.hideInact = !Settings.reactive.hideInact

  if (Settings.reactive.hideInact && !Settings.reactive.activateLastTabOnPanelSwitching) {
    Settings.reactive.activateLastTabOnPanelSwitching = true
  }

  if (Settings.reactive.hideInact && !Settings.reactive.tabsPanelSwitchActMove) {
    Settings.reactive.tabsPanelSwitchActMove = true
  }
}

function toggleTabsPanelSwitchActMove(): void {
  Settings.reactive.tabsPanelSwitchActMove = !Settings.reactive.tabsPanelSwitchActMove

  if (!Settings.reactive.tabsPanelSwitchActMove && Settings.reactive.hideInact) {
    Settings.reactive.hideInact = false
  }
}

onMounted(() => SetupPage.registerEl('settings_tabs', el.value))
</script>
