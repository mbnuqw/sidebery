<template lang="pug">
section(ref="el")
  h2 {{translate('settings.mouse_title')}}
  ToggleField(label="settings.h_scroll_through_panels" v-model:value="Settings.reactive.hScrollThroughPanels")
  SelectField(
    label="settings.scroll_through_tabs"
    optLabel="settings.scroll_through_tabs_"
    v-model:value="Settings.reactive.scrollThroughTabs"
    :opts="Settings.getOpts('scrollThroughTabs')")
  .sub-fields
    ToggleField(
      label="settings.scroll_through_visible_tabs"
      v-model:value="Settings.reactive.scrollThroughVisibleTabs"
      :inactive="!Settings.reactive.tabsTree || Settings.reactive.scrollThroughTabs === 'none'")
    ToggleField(
      label="settings.scroll_through_tabs_skip_discarded"
      v-model:value="Settings.reactive.scrollThroughTabsSkipDiscarded"
      :inactive="Settings.reactive.scrollThroughTabs === 'none'")
    ToggleField(
      label="settings.scroll_through_tabs_except_overflow"
      v-model:value="Settings.reactive.scrollThroughTabsExceptOverflow"
      :inactive="Settings.reactive.scrollThroughTabs === 'none'")
    ToggleField(
      label="settings.scroll_through_tabs_cyclic"
      v-model:value="Settings.reactive.scrollThroughTabsCyclic"
      :inactive="Settings.reactive.scrollThroughTabs === 'none'")
  ToggleField(
    label="settings.auto_menu_multi_sel"
    v-model:value="Settings.reactive.autoMenuMultiSel")
  NumField.-inline(
    label="settings.long_click_delay"
    unitLabel="settings.long_click_delay_"
    v-model:value="Settings.reactive.longClickDelay"
    :or="300")
  ToggleField(
    label="settings.wheel_threshold"
    v-model:value="Settings.reactive.wheelThreshold")
  .sub-fields
    NumField.-inline(
      label="settings.wheel_threshold_y"
      v-model:value="Settings.reactive.wheelThresholdY"
      :inactive="!Settings.reactive.wheelThreshold"
      :or="60")
    NumField.-inline(
      label="settings.wheel_threshold_x"
      v-model:value="Settings.reactive.wheelThresholdX"
      :inactive="!Settings.reactive.wheelThreshold"
      :or="10")

  .sub-title {{translate('settings.nav_actions_sub_title')}}
  SelectField(
    label="settings.nav_act_tabs_panel_left_click"
    optLabel="settings.nav_act_tabs_panel_left_click_"
    v-model:value="Settings.reactive.navActTabsPanelLeftClickAction"
    :opts="Settings.getOpts('navActTabsPanelLeftClickAction')")
  SelectField(
    label="settings.nav_act_bookmarks_panel_left_click"
    optLabel="settings.nav_act_bookmarks_panel_left_click_"
    v-model:value="Settings.reactive.navActBookmarksPanelLeftClickAction"
    :opts="Settings.getOpts('navActBookmarksPanelLeftClickAction')")
  SelectField(
    label="settings.nav_tabs_panel_mid_click"
    optLabel="settings.nav_tabs_panel_mid_click_"
    v-model:value="Settings.reactive.navTabsPanelMidClickAction"
    :opts="Settings.getOpts('navTabsPanelMidClickAction')"
    :folded="true")
  SelectField(
    label="settings.nav_bookmarks_panel_mid_click"
    optLabel="settings.nav_bookmarks_panel_mid_click_"
    v-model:value="Settings.reactive.navBookmarksPanelMidClickAction"
    :opts="Settings.getOpts('navBookmarksPanelMidClickAction')")
  ToggleField.-last(
    label="settings.nav_switch_panels_wheel"
    v-model:value="Settings.reactive.navSwitchPanelsWheel")

  .sub-title {{translate('settings.tab_actions_sub_title')}}
  SelectField.-no-separator(
    label="settings.tab_double_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.reactive.tabDoubleClick"
    :opts="Settings.getOpts('tabDoubleClick')"
    :folded="true"
    @update:value="onTabDoubleClickUpdate")
  ToggleField(
    label="settings.tabs_second_click_act_prev"
    v-model:value="Settings.reactive.tabsSecondClickActPrev"
    @update:value="onTabsSecondClickActPrevUpdate")
  ToggleField(
    label="settings.activate_on_mouseup"
    v-model:value="Settings.reactive.activateOnMouseUp")
  ToggleField(
    label="settings.shift_selection_from_active"
    v-model:value="Settings.reactive.shiftSelAct")
  SelectField(
    label="settings.tab_long_left_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.reactive.tabLongLeftClick"
    :opts="Settings.getOpts('tabLongLeftClick')"
    :folded="true")
  SelectField(
    label="settings.tab_long_right_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.reactive.tabLongRightClick"
    :opts="Settings.getOpts('tabLongRightClick')"
    :folded="true")
  SelectField(
    label="settings.tab_close_middle_click"
    optLabel="settings.tab_action_"
    v-model:value="Settings.reactive.tabCloseMiddleClick"
    :opts="Settings.getOpts('tabCloseMiddleClick')")

  .sub-title {{translate('settings.tabs_panel_actions_sub_title')}}
  SelectField.-no-separator(
    label="settings.tabs_panel_left_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.reactive.tabsPanelLeftClickAction"
    :opts="Settings.getOpts('tabsPanelLeftClickAction')"
    :folded="true")
  SelectField(
    label="settings.tabs_panel_double_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.reactive.tabsPanelDoubleClickAction"
    :inactive="Settings.reactive.tabsPanelLeftClickAction !== 'none'"
    :opts="Settings.getOpts('tabsPanelDoubleClickAction')"
    :folded="true")
  SelectField(
    label="settings.tabs_panel_right_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.reactive.tabsPanelRightClickAction"
    :opts="Settings.getOpts('tabsPanelRightClickAction')"
    :folded="true")
  SelectField(
    label="settings.tabs_panel_middle_click_action"
    optLabel="settings.tabs_panel_action_"
    v-model:value="Settings.reactive.tabsPanelMiddleClickAction"
    :opts="Settings.getOpts('tabsPanelMiddleClickAction')"
    :folded="true")
  
  .sub-title {{translate('settings.mouse.bookmarks_title')}}
  SelectField(
    label="settings.mouse.bookmarks.left_click_action"
    optLabel="settings.mouse.bookmarks.left_click_action_"
    v-model:value="Settings.reactive.bookmarksLeftClickAction"
    :opts="Settings.getOpts('bookmarksLeftClickAction')"
    :folded="false")
  .sub-fields
    ToggleField(
      label="settings.mouse.bookmarks.new_tab_activate"
      v-model:value="Settings.reactive.bookmarksLeftClickActivate"
      :inactive="Settings.reactive.bookmarksLeftClickAction !== 'open_in_new'")
    SelectField(
      label="settings.mouse.bookmarks.new_tab_pos"
      optLabel="settings.mouse.bookmarks.new_tab_pos_"
      v-model:value="Settings.reactive.bookmarksLeftClickPos"
      :inactive="Settings.reactive.bookmarksLeftClickAction !== 'open_in_new'"
      :opts="Settings.getOpts('bookmarksNewTabPos')"
      :folded="false")
  SelectField(
    label="settings.mouse.bookmarks.mid_click_action"
    optLabel="settings.mouse.bookmarks.mid_click_action_"
    v-model:value="Settings.reactive.bookmarksMidClickAction"
    :opts="Settings.getOpts('bookmarksMidClickAction')"
    :folded="true")
  .sub-fields
    ToggleField(
      label="settings.mouse.bookmarks.new_tab_activate"
      v-model:value="Settings.reactive.bookmarksMidClickActivate"
      :inactive="Settings.reactive.bookmarksMidClickAction !== 'open_in_new'")
    SelectField(
      label="settings.mouse.bookmarks.new_tab_pos"
      optLabel="settings.mouse.bookmarks.new_tab_pos_"
      v-model:value="Settings.reactive.bookmarksMidClickPos"
      :inactive="Settings.reactive.bookmarksMidClickAction !== 'open_in_new'"
      :opts="Settings.getOpts('bookmarksNewTabPos')"
      :folded="false")
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
  if (value) Settings.reactive.tabDoubleClick = 'none'
}

function onTabDoubleClickUpdate(value: string): void {
  if (value !== 'none') Settings.reactive.tabsSecondClickActPrev = false
}
</script>
