<template lang="pug">
section(ref="el")
  h2 {{translate('settings.tabs_title')}}
  SelectField(
    label="settings.warn_on_multi_tab_close"
    optLabel="settings.warn_on_multi_tab_close_"
    v-model:value="Settings.state.warnOnMultiTabClose"
    :opts="Settings.getOpts('warnOnMultiTabClose')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_rm_undo_note"
    v-model:value="Settings.state.tabsRmUndoNote"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.activate_last_tab_on_panel_switching"
    :value="Settings.state.activateLastTabOnPanelSwitching"
    @update:value="toggleActivateLastTabOnPanelSwitching")
  ToggleField(
    label="settings.show_tab_rm_btn"
    v-model:value="Settings.state.showTabRmBtn"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.hide_inactive_panel_tabs"
    :value="Settings.state.hideInact"
    @update:value="toggleHideInact")
  SelectField(
    label="settings.activate_after_closing"
    optLabel="settings.activate_after_closing_"
    v-model:value="Settings.state.activateAfterClosing"
    :folded="true"
    :opts="Settings.getOpts('activateAfterClosing')"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.activate_after_closing_stay_in_panel"
      v-model:value="Settings.state.activateAfterClosingStayInPanel"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.activate_after_closing_global"
      v-model:value="Settings.state.activateAfterClosingGlobal"
      :inactive="Settings.state.activateAfterClosing !== 'prev_act'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.activate_after_closing_no_folded"
      v-model:value="Settings.state.activateAfterClosingNoFolded"
      :inactive="Settings.state.activateAfterClosing !== 'prev_act'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.activate_after_closing_no_discarded"
      v-model:value="Settings.state.activateAfterClosingNoDiscarded"
      :inactive="Settings.state.activateAfterClosing === 'none'"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.ask_new_bookmark_place"
    v-model:value="Settings.state.askNewBookmarkPlace"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.native_highlight"
    v-model:value="Settings.state.nativeHighlight"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_unread_mark"
    v-model:value="Settings.state.tabsUnreadMark"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tabs_update_mark"
    optLabel="settings.tabs_update_mark_"
    v-model:value="Settings.state.tabsUpdateMark"
    :opts="Settings.getOpts('tabsUpdateMark')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  CountField.-inline(
    label="settings.tabs_reload_limit"
    v-model:value="Settings.state.tabsReloadLimit"
    :min="1"
    @update:value="Settings.saveDebounced(500)")
  .sub-fields
    ToggleField(
      label="settings.tabs_reload_limit_notif"
      v-model:value="Settings.state.tabsReloadLimitNotif"
      :inactive="!(Settings.state.tabsReloadLimit > 0)"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_panel_switch_act_move"
    :value="Settings.state.tabsPanelSwitchActMove"
    @update:value="toggleTabsPanelSwitchActMove")
  SelectField(
    label="settings.tabs_url_in_tooltip"
    optLabel="settings.tabs_url_in_tooltip_"
    v-model:value="Settings.state.tabsUrlInTooltip"
    :opts="Settings.getOpts('tabsUrlInTooltip')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.show_new_tab_btns"
    v-model:value="Settings.state.showNewTabBtns"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    SelectField(
      label="settings.new_tab_bar_position"
      optLabel="settings.new_tab_bar_position_"
      v-model:value="Settings.state.newTabBarPosition"
      :inactive="!Settings.state.showNewTabBtns"
      :opts="Settings.getOpts('newTabBarPosition')"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.open_sub_panel_on_mouse_hover"
    v-model:value="Settings.state.openSubPanelOnMouseHover"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.colorize_tabs"
    v-model:value="Settings.state.colorizeTabs"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    SelectField(
      label="settings.colorize_tabs_src"
      optLabel="settings.colorize_tabs_src_"
      v-model:value="Settings.state.colorizeTabsSrc"
      :inactive="!Settings.state.colorizeTabs"
      :opts="Settings.getOpts('colorizeTabsSrc')"
      @update:value="Settings.saveDebounced(150)")
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
  Settings.state.activateLastTabOnPanelSwitching = !Settings.state.activateLastTabOnPanelSwitching

  if (!Settings.state.activateLastTabOnPanelSwitching && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }

  Settings.saveDebounced(150)
}

async function toggleHideInact(): Promise<void> {
  if (!Settings.state.hideInact && !Permissions.reactive.tabHide) {
    const result = await Permissions.request('tabHide')
    if (!result) return
  }

  Settings.state.hideInact = !Settings.state.hideInact

  if (Settings.state.hideInact && !Settings.state.activateLastTabOnPanelSwitching) {
    Settings.state.activateLastTabOnPanelSwitching = true
  }

  if (Settings.state.hideInact && !Settings.state.tabsPanelSwitchActMove) {
    Settings.state.tabsPanelSwitchActMove = true
  }

  Settings.saveDebounced(150)
}

function toggleTabsPanelSwitchActMove(): void {
  Settings.state.tabsPanelSwitchActMove = !Settings.state.tabsPanelSwitchActMove

  if (!Settings.state.tabsPanelSwitchActMove && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }

  Settings.saveDebounced(150)
}

onMounted(() => SetupPage.registerEl('settings_tabs', el.value))
</script>
