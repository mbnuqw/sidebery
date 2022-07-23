<template lang="pug">
section(ref="el")
  h2 {{translate('settings.tabs_title')}}
  SelectField(
    label="settings.warn_on_multi_tab_close"
    optLabel="settings.warn_on_multi_tab_close_"
    v-model:value="Settings.state.warnOnMultiTabClose"
    :opts="Settings.getOpts('warnOnMultiTabClose')")
  ToggleField(label="settings.tabs_rm_undo_note" v-model:value="Settings.state.tabsRmUndoNote")
  ToggleField(
    label="settings.activate_last_tab_on_panel_switching"
    :value="Settings.state.activateLastTabOnPanelSwitching"
    @update:value="toggleActivateLastTabOnPanelSwitching")
  ToggleField(label="settings.show_tab_rm_btn" v-model:value="Settings.state.showTabRmBtn")
  ToggleField(
    label="settings.hide_inactive_panel_tabs"
    :value="Settings.state.hideInact"
    @update:value="toggleHideInact")
  SelectField(
    label="settings.activate_after_closing"
    optLabel="settings.activate_after_closing_"
    v-model:value="Settings.state.activateAfterClosing"
    :folded="true"
    :opts="Settings.getOpts('activateAfterClosing')")
  .sub-fields
    ToggleField(
      label="settings.activate_after_closing_global"
      v-model:value="Settings.state.activateAfterClosingGlobal"
      :inactive="Settings.state.activateAfterClosing !== 'prev_act'")
    ToggleField(
      label="settings.activate_after_closing_no_folded"
      v-model:value="Settings.state.activateAfterClosingNoFolded"
      :inactive="Settings.state.activateAfterClosing !== 'prev_act'")
    ToggleField(
      label="settings.activate_after_closing_no_discarded"
      v-model:value="Settings.state.activateAfterClosingNoDiscarded"
      :inactive="Settings.state.activateAfterClosing === 'none'")
  ToggleField(
    label="settings.ask_new_bookmark_place"
    v-model:value="Settings.state.askNewBookmarkPlace")
  ToggleField(label="settings.native_highlight" v-model:value="Settings.state.nativeHighlight")
  ToggleField(label="settings.tabs_unread_mark" v-model:value="Settings.state.tabsUnreadMark")
  CountField.-inline(
    label="settings.tabs_reload_limit"
    v-model:value="Settings.state.tabsReloadLimit"
    :min="1")
  .sub-fields
    ToggleField(
      label="settings.tabs_reload_limit_notif"
      v-model:value="Settings.state.tabsReloadLimitNotif"
      :inactive="!(Settings.state.tabsReloadLimit > 0)")
  ToggleField(
    label="settings.tabs_panel_switch_act_move"
    :value="Settings.state.tabsPanelSwitchActMove"
    @update:value="toggleTabsPanelSwitchActMove")
  SelectField(
    label="settings.tabs_url_in_tooltip"
    optLabel="settings.tabs_url_in_tooltip_"
    v-model:value="Settings.state.tabsUrlInTooltip"
    :opts="Settings.getOpts('tabsUrlInTooltip')")
  ToggleField(
    label="settings.show_new_tab_btns"
    v-model:value="Settings.state.showNewTabBtns")
  .sub-fields
    SelectField(
      label="settings.new_tab_bar_position"
      optLabel="settings.new_tab_bar_position_"
      v-model:value="Settings.state.newTabBarPosition"
      :inactive="!Settings.state.showNewTabBtns"
      :opts="Settings.getOpts('newTabBarPosition')")
  ToggleField(
    label="settings.open_sub_panel_on_mouse_hover"
    v-model:value="Settings.state.openSubPanelOnMouseHover")
  ToggleField(
    label="settings.colorize_tabs"
    v-model:value="Settings.state.colorizeTabs")
  .sub-fields
    SelectField(
      label="settings.colorize_tabs_src"
      optLabel="settings.colorize_tabs_src_"
      v-model:value="Settings.state.colorizeTabsSrc"
      :inactive="!Settings.state.colorizeTabs"
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
  Settings.state.activateLastTabOnPanelSwitching =
    !Settings.state.activateLastTabOnPanelSwitching

  if (!Settings.state.activateLastTabOnPanelSwitching && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }
}

function toggleHideInact(): void {
  if (!Settings.state.hideInact && !Permissions.reactive.tabHide) location.hash = 'tab-hide'
  else Settings.state.hideInact = !Settings.state.hideInact

  if (Settings.state.hideInact && !Settings.state.activateLastTabOnPanelSwitching) {
    Settings.state.activateLastTabOnPanelSwitching = true
  }

  if (Settings.state.hideInact && !Settings.state.tabsPanelSwitchActMove) {
    Settings.state.tabsPanelSwitchActMove = true
  }
}

function toggleTabsPanelSwitchActMove(): void {
  Settings.state.tabsPanelSwitchActMove = !Settings.state.tabsPanelSwitchActMove

  if (!Settings.state.tabsPanelSwitchActMove && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }
}

onMounted(() => SetupPage.registerEl('settings_tabs', el.value))
</script>
