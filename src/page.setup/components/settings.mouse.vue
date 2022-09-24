<template lang="pug">
section(ref="el")
  h2 {{translate('settings.mouse_title')}}
  SelectField(
    label="settings.h_scroll_action"
    optLabel="settings.h_scroll_action_"
    v-model:value="Settings.state.hScrollAction"
    :opts="Settings.getOpts('hScrollAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.scroll_through_tabs"
    optLabel="settings.scroll_through_tabs_"
    v-model:value="Settings.state.scrollThroughTabs"
    :opts="Settings.getOpts('scrollThroughTabs')"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.scroll_through_visible_tabs"
      v-model:value="Settings.state.scrollThroughVisibleTabs"
      :inactive="!Settings.state.tabsTree || Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.scroll_through_tabs_skip_discarded"
      v-model:value="Settings.state.scrollThroughTabsSkipDiscarded"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.scroll_through_tabs_except_overflow"
      v-model:value="Settings.state.scrollThroughTabsExceptOverflow"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.scroll_through_tabs_cyclic"
      v-model:value="Settings.state.scrollThroughTabsCyclic"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    NumField.-inline(
      label="settings.scroll_through_tabs_scroll_area"
      v-model:value="Settings.state.scrollThroughTabsScrollArea"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      :or="0"
      :allowNegative="true"
      :note="translate('settings.scroll_through_tabs_scroll_area_note')"
      @update:value="Settings.saveDebounced(500)")
  ToggleField(
    label="settings.auto_menu_multi_sel"
    v-model:value="Settings.state.autoMenuMultiSel"
    :note="translate('settings.auto_menu_multi_sel_note')"
    @update:value="Settings.saveDebounced(150)")
  NumField.-inline(
    label="settings.long_click_delay"
    unitLabel="settings.long_click_delay_"
    v-model:value="Settings.state.longClickDelay"
    :or="300"
    @update:value="Settings.saveDebounced(500)")
  ToggleField(
    label="settings.wheel_threshold"
    v-model:value="Settings.state.wheelThreshold"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    NumField.-inline(
      label="settings.wheel_threshold_y"
      v-model:value="Settings.state.wheelThresholdY"
      :inactive="!Settings.state.wheelThreshold"
      :or="60"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.wheel_threshold_x"
      v-model:value="Settings.state.wheelThresholdX"
      :inactive="!Settings.state.wheelThreshold"
      :or="10"
      @update:value="Settings.saveDebounced(500)")

  .sub-title {{translate('settings.nav_actions_sub_title')}}
  SelectField.-no-separator(
    label="settings.nav_act_tabs_panel_left_click"
    optLabel="settings.nav_act_tabs_panel_left_click_"
    v-model:value="Settings.state.navActTabsPanelLeftClickAction"
    :opts="Settings.getOpts('navActTabsPanelLeftClickAction')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.nav_act_bookmarks_panel_left_click"
    optLabel="settings.nav_act_bookmarks_panel_left_click_"
    v-model:value="Settings.state.navActBookmarksPanelLeftClickAction"
    :opts="Settings.getOpts('navActBookmarksPanelLeftClickAction')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.nav_tabs_panel_mid_click"
    optLabel="settings.nav_tabs_panel_mid_click_"
    v-model:value="Settings.state.navTabsPanelMidClickAction"
    :opts="Settings.getOpts('navTabsPanelMidClickAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.nav_bookmarks_panel_mid_click"
    optLabel="settings.nav_bookmarks_panel_mid_click_"
    v-model:value="Settings.state.navBookmarksPanelMidClickAction"
    :opts="Settings.getOpts('navBookmarksPanelMidClickAction')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField.-last(
    label="settings.nav_switch_panels_wheel"
    v-model:value="Settings.state.navSwitchPanelsWheel"
    @update:value="Settings.saveDebounced(150)")

  .sub-title {{translate('settings.tab_actions_sub_title')}}
  SelectField.-no-separator(
    label="settings.tab_double_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.state.tabDoubleClick"
    :opts="Settings.getOpts('tabDoubleClick')"
    :folded="true"
    @update:value="onTabDoubleClickUpdate")
  ToggleField(
    label="settings.tabs_second_click_act_prev"
    v-model:value="Settings.state.tabsSecondClickActPrev"
    @update:value="onTabsSecondClickActPrevUpdate")
  ToggleField(
    label="settings.activate_on_mouseup"
    v-model:value="Settings.state.activateOnMouseUp"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.shift_selection_from_active"
    v-model:value="Settings.state.shiftSelAct"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tab_long_left_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.state.tabLongLeftClick"
    :opts="Settings.getOpts('tabLongLeftClick')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tab_long_right_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.state.tabLongRightClick"
    :opts="Settings.getOpts('tabLongRightClick')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tab_close_middle_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.state.tabCloseMiddleClick"
    :opts="Settings.getOpts('tabCloseMiddleClick')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.multiple_middle_close"
    v-model:value="Settings.state.multipleMiddleClose"
    :note="translate('settings.multiple_middle_close_note')"
    @update:value="Settings.saveDebounced(150)")

  .sub-title {{translate('settings.tabs_panel_actions_sub_title')}}
  SelectField.-no-separator(
    label="settings.tabs_panel_left_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.state.tabsPanelLeftClickAction"
    :opts="Settings.getOpts('tabsPanelLeftClickAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tabs_panel_double_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.state.tabsPanelDoubleClickAction"
    :inactive="Settings.state.tabsPanelLeftClickAction !== 'none'"
    :opts="Settings.getOpts('tabsPanelDoubleClickAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tabs_panel_right_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.state.tabsPanelRightClickAction"
    :opts="Settings.getOpts('tabsPanelRightClickAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tabs_panel_middle_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.state.tabsPanelMiddleClickAction"
    :opts="Settings.getOpts('tabsPanelMiddleClickAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")

  .sub-title {{translate('settings.mouse.new_tab_button_title')}}
  SelectField.-no-separator(
    label="settings.mouse.new_tab_middle_click_action"
    optLabel="settings.mouse.new_tab_action_"
    v-model:value="Settings.state.newTabMiddleClickAction"
    :opts="Settings.getOpts('newTabAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")

  .sub-title {{translate('settings.mouse.bookmarks_title')}}
  SelectField.-no-separator(
    label="settings.mouse.bookmarks.left_click_action"
    optLabel="settings.mouse.bookmarks.left_click_action_"
    v-model:value="Settings.state.bookmarksLeftClickAction"
    :opts="Settings.getOpts('bookmarksLeftClickAction')"
    :folded="false"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.mouse.bookmarks.new_tab_activate"
      v-model:value="Settings.state.bookmarksLeftClickActivate"
      :inactive="Settings.state.bookmarksLeftClickAction !== 'open_in_new'"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.mouse.bookmarks.new_tab_pos"
      optLabel="settings.mouse.bookmarks.new_tab_pos_"
      v-model:value="Settings.state.bookmarksLeftClickPos"
      :inactive="Settings.state.bookmarksLeftClickAction !== 'open_in_new'"
      :opts="Settings.getOpts('bookmarksNewTabPos')"
      :folded="false"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.mouse.bookmarks.mid_click_action"
    optLabel="settings.mouse.bookmarks.mid_click_action_"
    v-model:value="Settings.state.bookmarksMidClickAction"
    :opts="Settings.getOpts('bookmarksMidClickAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.mouse.bookmarks.new_tab_activate"
      v-model:value="Settings.state.bookmarksMidClickActivate"
      :inactive="Settings.state.bookmarksMidClickAction !== 'open_in_new'"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.mouse.bookmarks.new_tab_pos"
      optLabel="settings.mouse.bookmarks.new_tab_pos_"
      v-model:value="Settings.state.bookmarksMidClickPos"
      :inactive="Settings.state.bookmarksMidClickAction !== 'open_in_new'"
      :opts="Settings.getOpts('bookmarksNewTabPos')"
      :folded="false"
      @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'
import NumField from '../../components/num-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_mouse', el.value))

function onTabsSecondClickActPrevUpdate(value: boolean): void {
  if (value) Settings.state.tabDoubleClick = 'none'
  Settings.saveDebounced(150)
}

function onTabDoubleClickUpdate(value: string): void {
  if (value !== 'none') Settings.state.tabsSecondClickActPrev = false
  Settings.saveDebounced(150)
}
</script>
