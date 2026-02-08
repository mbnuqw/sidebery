<template lang="pug">
section(ref="el")
  h2 {{translate('settings.mouse_title')}}
  span.header-shadow
  SelectField(
    label="settings.h_scroll_action"
    optLabel="settings.h_scroll_action_"
    v-model:value="Settings.state.hScrollAction"
    dbg="hScrollAction"
    :default="DEFAULT_SETTINGS.hScrollAction"
    :opts="Settings.getOpts('hScrollAction')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.one_panel_switch_per_scroll"
      v-model:value="Settings.state.onePanelSwitchPerScroll"
      dbg="onePanelSwitchPerScroll"
      :default="DEFAULT_SETTINGS.onePanelSwitchPerScroll"
      :inactive="Settings.state.hScrollAction !== 'switch_panels'"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.scroll_through_tabs"
    optLabel="settings.scroll_through_tabs_"
    v-model:value="Settings.state.scrollThroughTabs"
    dbg="scrollThroughTabs"
    :default="DEFAULT_SETTINGS.scrollThroughTabs"
    :folded="true"
    :opts="Settings.getOpts('scrollThroughTabs')"
    :note="(Settings.state.scrollThroughTabs === 'psp' || Settings.state.scrollThroughTabs === 'psg') ? translate('settings.scroll_through_tabs_preselect_note') : undefined"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.scroll_through_tabs_glob_pin_isolate"
      v-model:value="Settings.state.scrollThroughTabsGlobPinIsolate"
      dbg="scrollThroughTabsGlobPinIsolate"
      :default="DEFAULT_SETTINGS.scrollThroughTabsGlobPinIsolate"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.scroll_through_visible_tabs"
      v-model:value="Settings.state.scrollThroughVisibleTabs"
      dbg="scrollThroughVisibleTabs"
      :default="DEFAULT_SETTINGS.scrollThroughVisibleTabs"
      :inactive="!Settings.state.tabsTree || Settings.state.scrollThroughTabs === 'none' || Settings.state.scrollThroughTabs === 'psp' || Settings.state.scrollThroughTabs === 'psg'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.scroll_through_tabs_skip_discarded"
      v-model:value="Settings.state.scrollThroughTabsSkipDiscarded"
      dbg="scrollThroughTabsSkipDiscarded"
      :default="DEFAULT_SETTINGS.scrollThroughTabsSkipDiscarded"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.scroll_through_tabs_except_overflow"
      v-model:value="Settings.state.scrollThroughTabsExceptOverflow"
      dbg="scrollThroughTabsExceptOverflow"
      :default="DEFAULT_SETTINGS.scrollThroughTabsExceptOverflow"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.scroll_through_tabs_cyclic"
      v-model:value="Settings.state.scrollThroughTabsCyclic"
      dbg="scrollThroughTabsCyclic"
      :default="DEFAULT_SETTINGS.scrollThroughTabsCyclic"
      :inactive="Settings.state.scrollThroughTabs === 'none'"
      @update:value="Settings.saveDebounced(150)")
    NumField.-inline(
      label="settings.scroll_through_tabs_scroll_area"
      v-model:value="Settings.state.scrollThroughTabsScrollArea"
      dbg="scrollThroughTabsScrollArea"
      :default="DEFAULT_SETTINGS.scrollThroughTabsScrollArea"
      :inactive="Settings.state.scrollThroughTabs === 'none' || Settings.state.scrollThroughTabsExceptOverflow"
      :or="0"
      :allowNegative="true"
      :note="translate('settings.scroll_through_tabs_scroll_area_note')"
      @update:value="Settings.saveDebounced(500)")
    ToggleField(
      label="settings.select_active_tab_first"
      v-model:value="Settings.state.scrollThroughTabsPreselAct"
      dbg="scrollThroughTabsPreselAct"
      :default="DEFAULT_SETTINGS.scrollThroughTabsPreselAct"
      :inactive="!Settings.state.scrollThroughTabs.startsWith('ps')"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.auto_menu_multi_sel"
    v-model:value="Settings.state.autoMenuMultiSel"
    dbg="autoMenuMultiSel"
    :default="DEFAULT_SETTINGS.autoMenuMultiSel"
    :note="translate('settings.auto_menu_multi_sel_note')"
    @update:value="Settings.saveDebounced(150)")
  NumField.-inline(
    label="settings.long_click_delay"
    unitLabel="settings.long_click_delay_"
    v-model:value="Settings.state.longClickDelay"
    dbg="longClickDelay"
    :default="DEFAULT_SETTINGS.longClickDelay"
    :or="300"
    @update:value="Settings.saveDebounced(500)")
  ToggleField(
    label="settings.wheel_threshold"
    v-model:value="Settings.state.wheelThreshold"
    dbg="wheelThreshold"
    :default="DEFAULT_SETTINGS.wheelThreshold"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    NumField.-inline(
      label="settings.wheel_threshold_y"
      v-model:value="Settings.state.wheelThresholdY"
      dbg="wheelThresholdY"
      :default="DEFAULT_SETTINGS.wheelThresholdY"
      :inactive="!Settings.state.wheelThreshold"
      :or="60"
      @update:value="Settings.saveDebounced(500)")
    ToggleField(
      label="settings.wheel_accumulation_y"
      v-model:value="Settings.state.wheelAccumulationY"
      dbg="wheelAccumulationY"
      :default="DEFAULT_SETTINGS.wheelAccumulationY"
      :inactive="!Settings.state.wheelThreshold"
      @update:value="Settings.saveDebounced(150)")
    NumField.-inline(
      label="settings.wheel_threshold_x"
      v-model:value="Settings.state.wheelThresholdX"
      dbg="wheelThresholdX"
      :default="DEFAULT_SETTINGS.wheelThresholdX"
      :inactive="!Settings.state.wheelThreshold"
      :or="10"
      @update:value="Settings.saveDebounced(500)")
    ToggleField.-no-separator(
      label="settings.wheel_accumulation_x"
      v-model:value="Settings.state.wheelAccumulationX"
      dbg="wheelAccumulationX"
      :default="DEFAULT_SETTINGS.wheelAccumulationX"
      :inactive="!Settings.state.wheelThreshold"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="navEl")
    .sub-title: .text {{translate('settings.nav_settings_mouse_nav')}}
    SelectField.-no-separator(
      label="settings.nav_act_tabs_panel_left_click"
      optLabel="settings.nav_act_tabs_panel_left_click_"
      v-model:value="Settings.state.navActTabsPanelLeftClickAction"
      dbg="navActTabsPanelLeftClickAction"
      :default="DEFAULT_SETTINGS.navActTabsPanelLeftClickAction"
      :folded="true"
      :opts="Settings.getOpts('navActTabsPanelLeftClickAction')"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields(v-if="Settings.state.navActTabsPanelLeftClickAction === 'new_tab'")
      SelectField(
        label="settings.new_tab_in_panel_pos"
        optLabel="settings.new_tab_in_panel_pos_"
        v-model:value="Settings.state.navActTabsPanelLeftClickTabPos"
        dbg="navActTabsPanelLeftClickTabPos"
        :default="DEFAULT_SETTINGS.navActTabsPanelLeftClickTabPos"
        :folded="true"
        :opts="Settings.getOpts('newTabInPanelPos')"
        @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.nav_act_bookmarks_panel_left_click"
      optLabel="settings.nav_act_bookmarks_panel_left_click_"
      v-model:value="Settings.state.navActBookmarksPanelLeftClickAction"
      dbg="navActBookmarksPanelLeftClickAction"
      :default="DEFAULT_SETTINGS.navActBookmarksPanelLeftClickAction"
      :opts="Settings.getOpts('navActBookmarksPanelLeftClickAction')"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.nav_tabs_panel_mid_click"
      optLabel="settings.nav_tabs_panel_mid_click_"
      v-model:value="Settings.state.navTabsPanelMidClickAction"
      dbg="navTabsPanelMidClickAction"
      :default="DEFAULT_SETTINGS.navTabsPanelMidClickAction"
      :opts="Settings.getOpts('navTabsPanelMidClickAction')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.nav_bookmarks_panel_mid_click"
      optLabel="settings.nav_bookmarks_panel_mid_click_"
      v-model:value="Settings.state.navBookmarksPanelMidClickAction"
      dbg="navBookmarksPanelMidClickAction"
      :default="DEFAULT_SETTINGS.navBookmarksPanelMidClickAction"
      :opts="Settings.getOpts('navBookmarksPanelMidClickAction')"
      @update:value="Settings.saveDebounced(150)")
    ToggleField.-last(
      label="settings.nav_switch_panels_wheel"
      v-model:value="Settings.state.navSwitchPanelsWheel"
      dbg="navSwitchPanelsWheel"
      :default="DEFAULT_SETTINGS.navSwitchPanelsWheel"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="tabsEl")
    .sub-title: .text {{translate('settings.nav_settings_mouse_tabs')}}
    SelectField.-no-separator(
      label="settings.tab_double_click"
      optLabel="settings.tab_action_"
      v-model:value="Settings.state.tabDoubleClick"
      dbg="tabDoubleClick"
      :default="DEFAULT_SETTINGS.tabDoubleClick"
      :opts="Settings.getOpts('tabDoubleClick')"
      :folded="true"
      @update:value="onTabDoubleClickUpdate")
    ToggleField(
      label="settings.tabs_second_click_act_prev"
      v-model:value="Settings.state.tabsSecondClickActPrev"
      dbg="tabsSecondClickActPrev"
      :default="DEFAULT_SETTINGS.tabsSecondClickActPrev"
      @update:value="onTabsSecondClickActPrevUpdate")
    .sub-fields
      ToggleField(
        label="settings.tabs_second_click_act_prev_panel_only"
        v-model:value="Settings.state.tabsSecondClickActPrevPanelOnly"
        dbg="tabsSecondClickActPrevPanelOnly"
        :default="DEFAULT_SETTINGS.tabsSecondClickActPrevPanelOnly"
        :inactive="!Settings.state.tabsSecondClickActPrev"
        @update:value="Settings.saveDebounced(150)")
      ToggleField(
        label="settings.tabs_second_click_act_prev_no_unload"
        v-model:value="Settings.state.tabsSecondClickActPrevNoUnload"
        dbg="tabsSecondClickActPrevNoUnload"
        :default="DEFAULT_SETTINGS.tabsSecondClickActPrevNoUnload"
        :inactive="!Settings.state.tabsSecondClickActPrev"
        @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.activate_on_mouseup"
      v-model:value="Settings.state.activateOnMouseUp"
      dbg="activateOnMouseUp"
      :default="DEFAULT_SETTINGS.activateOnMouseUp"
      @update:value="onActivateOnMouseUpUpdate")
    ToggleField(
      label="settings.tab_close_on_mouse_up"
      v-model:value="Settings.state.tabCloseOnMouseUp"
      dbg="tabCloseOnMouseUp"
      :default="DEFAULT_SETTINGS.tabCloseOnMouseUp"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.shift_selection_from_active"
      v-model:value="Settings.state.shiftSelAct"
      dbg="shiftSelAct"
      :default="DEFAULT_SETTINGS.shiftSelAct"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.ctrl_selection_include_active"
      v-model:value="Settings.state.ctrlSelAct"
      dbg="ctrlSelAct"
      :default="DEFAULT_SETTINGS.ctrlSelAct"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tab_long_left_click"
      optLabel="settings.tab_action_"
      v-model:value="Settings.state.tabLongLeftClick"
      dbg="tabLongLeftClick"
      :default="DEFAULT_SETTINGS.tabLongLeftClick"
      :opts="Settings.getOpts('tabLongLeftClick')"
      :folded="true"
      @update:value="onTabLongLeftClickUpdate")
    SelectField(
      label="settings.tab_long_right_click"
      optLabel="settings.tab_action_"
      v-model:value="Settings.state.tabLongRightClick"
      dbg="tabLongRightClick"
      :default="DEFAULT_SETTINGS.tabLongRightClick"
      :opts="Settings.getOpts('tabLongRightClick')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tab_middle_click"
      optLabel="settings.tab_action_"
      v-model:value="Settings.state.tabMiddleClick"
      dbg="tabMiddleClick"
      :default="DEFAULT_SETTINGS.tabMiddleClick"
      :opts="Settings.getOpts('tabMiddleClick')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      SelectField(
        label="settings.tab_middle_click_ctrl"
        optLabel="settings.tab_action_"
        v-model:value="Settings.state.tabMiddleClickCtrl"
        dbg="tabMiddleClickCtrl"
        :default="DEFAULT_SETTINGS.tabMiddleClickCtrl"
        :opts="Settings.getOpts('tabMiddleClickModifier')"
        :folded="true"
        @update:value="Settings.saveDebounced(150)")
      SelectField(
        label="settings.tab_middle_click_shift"
        optLabel="settings.tab_action_"
        v-model:value="Settings.state.tabMiddleClickShift"
        dbg="tabMiddleClickShift"
        :default="DEFAULT_SETTINGS.tabMiddleClickShift"
        :opts="Settings.getOpts('tabMiddleClickModifier')"
        :folded="true"
        @update:value="Settings.saveDebounced(150)")
      SelectField(
        label="settings.tab_pinned_middle_click"
        optLabel="settings.tab_action_"
        v-model:value="Settings.state.tabPinnedMiddleClick"
        dbg="tabPinnedMiddleClick"
        :default="DEFAULT_SETTINGS.tabPinnedMiddleClick"
        :opts="Settings.getOpts('tabPinnedMiddleClick')"
        :folded="true"
        @update:value="Settings.saveDebounced(150)")
      ToggleField(
        label="settings.multiple_middle_close"
        v-model:value="Settings.state.multipleMiddleClose"
        dbg="multipleMiddleClose"
        :default="DEFAULT_SETTINGS.multipleMiddleClose"
        :inactive="Settings.state.tabMiddleClick !== 'close'"
        :note="translate('settings.multiple_middle_close_note')"
        @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tab_close_middle_click"
      optLabel="settings.tab_action_"
      v-model:value="Settings.state.tabCloseMiddleClick"
      dbg="tabCloseMiddleClick"
      :default="DEFAULT_SETTINGS.tabCloseMiddleClick"
      :opts="Settings.getOpts('tabCloseMiddleClick')"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="tabsPanelEl")
    .sub-title: .text {{translate('settings.nav_settings_mouse_tabs_panel')}}
    SelectField.-no-separator(
      label="settings.tabs_panel_left_click_action"
      optLabel="settings.tabs_panel_action_"
      v-model:value="Settings.state.tabsPanelLeftClickAction"
      dbg="tabsPanelLeftClickAction"
      :default="DEFAULT_SETTINGS.tabsPanelLeftClickAction"
      :opts="Settings.getOpts('tabsPanelLeftClickAction')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields(v-if="Settings.state.tabsPanelLeftClickAction === 'tab'")
      SelectField(
        label="settings.new_tab_in_panel_pos"
        optLabel="settings.new_tab_in_panel_pos_"
        v-model:value="Settings.state.tabsPanelLeftClickTabPos"
        dbg="tabsPanelLeftClickTabPos"
        :default="DEFAULT_SETTINGS.tabsPanelLeftClickTabPos"
        :folded="true"
        :opts="Settings.getOpts('newTabInPanelPos')"
        @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tabs_panel_double_click_action"
      optLabel="settings.tabs_panel_action_"
      v-model:value="Settings.state.tabsPanelDoubleClickAction"
      dbg="tabsPanelDoubleClickAction"
      :default="DEFAULT_SETTINGS.tabsPanelDoubleClickAction"
      :inactive="Settings.state.tabsPanelLeftClickAction !== 'none'"
      :opts="Settings.getOpts('tabsPanelDoubleClickAction')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields(v-if="Settings.state.tabsPanelDoubleClickAction === 'tab'")
      SelectField(
        label="settings.new_tab_in_panel_pos"
        optLabel="settings.new_tab_in_panel_pos_"
        v-model:value="Settings.state.tabsPanelDoubleClickTabPos"
        dbg="tabsPanelDoubleClickTabPos"
        :default="DEFAULT_SETTINGS.tabsPanelDoubleClickTabPos"
        :inactive="Settings.state.tabsPanelLeftClickAction !== 'none'"
        :folded="true"
        :opts="Settings.getOpts('newTabInPanelPos')"
        @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tabs_panel_right_click_action"
      optLabel="settings.tabs_panel_action_"
      v-model:value="Settings.state.tabsPanelRightClickAction"
      dbg="tabsPanelRightClickAction"
      :default="DEFAULT_SETTINGS.tabsPanelRightClickAction"
      :opts="Settings.getOpts('tabsPanelRightClickAction')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tabs_panel_middle_click_action"
      optLabel="settings.tabs_panel_action_"
      v-model:value="Settings.state.tabsPanelMiddleClickAction"
      dbg="tabsPanelMiddleClickAction"
      :default="DEFAULT_SETTINGS.tabsPanelMiddleClickAction"
      :opts="Settings.getOpts('tabsPanelMiddleClickAction')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields(v-if="Settings.state.tabsPanelMiddleClickAction === 'tab'")
      SelectField(
        label="settings.new_tab_in_panel_pos"
        optLabel="settings.new_tab_in_panel_pos_"
        v-model:value="Settings.state.tabsPanelMiddleClickTabPos"
        dbg="tabsPanelMiddleClickTabPos"
        :default="DEFAULT_SETTINGS.tabsPanelMiddleClickTabPos"
        :folded="true"
        :opts="Settings.getOpts('newTabInPanelPos')"
        @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="ntbEl")
    .sub-title: .text {{translate('settings.nav_settings_mouse_new_tab_button')}}
    SelectField.-no-separator(
      label="settings.mouse.new_tab_middle_click_action"
      optLabel="settings.mouse.new_tab_action_"
      v-model:value="Settings.state.newTabMiddleClickAction"
      dbg="newTabMiddleClickAction"
      :default="DEFAULT_SETTINGS.newTabMiddleClickAction"
      :opts="Settings.getOpts('newTabAction')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="bookmarksEl")
    .sub-title: .text {{translate('settings.nav_settings_mouse_bookmarks')}}
    SelectField.-no-separator(
      label="settings.mouse.bookmarks.left_click_action"
      optLabel="settings.mouse.bh.left_click_action_"
      v-model:value="Settings.state.bookmarksLeftClickAction"
      dbg="bookmarksLeftClickAction"
      :default="DEFAULT_SETTINGS.bookmarksLeftClickAction"
      :opts="Settings.getOpts('bookmarksLeftClickAction')"
      :folded="false"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      ToggleField(
        label="settings.mouse.bh.new_tab_activate"
        v-model:value="Settings.state.bookmarksLeftClickActivate"
        dbg="bookmarksLeftClickActivate"
        :default="DEFAULT_SETTINGS.bookmarksLeftClickActivate"
        :inactive="Settings.state.bookmarksLeftClickAction !== 'open_in_new'"
        @update:value="Settings.saveDebounced(150)")
      SelectField(
        label="settings.mouse.bh.new_tab_pos"
        optLabel="settings.mouse.bh.new_tab_pos_"
        v-model:value="Settings.state.bookmarksLeftClickPos"
        dbg="bookmarksLeftClickPos"
        :default="DEFAULT_SETTINGS.bookmarksLeftClickPos"
        :inactive="Settings.state.bookmarksLeftClickAction !== 'open_in_new'"
        :opts="Settings.getOpts('bookmarksNewTabPos')"
        :folded="false"
        @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.mouse.bookmarks.mid_click_action"
      optLabel="settings.mouse.bookmarks.mid_click_action_"
      v-model:value="Settings.state.bookmarksMidClickAction"
      dbg="bookmarksMidClickAction"
      :default="DEFAULT_SETTINGS.bookmarksMidClickAction"
      :opts="Settings.getOpts('bookmarksMidClickAction')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      ToggleField(
        label="settings.mouse.bh.new_tab_activate"
        v-model:value="Settings.state.bookmarksMidClickActivate"
        dbg="bookmarksMidClickActivate"
        :default="DEFAULT_SETTINGS.bookmarksMidClickActivate"
        :inactive="Settings.state.bookmarksMidClickAction !== 'open_in_new'"
        @update:value="Settings.saveDebounced(150)")
      ToggleField(
        label="settings.mouse.bookmarks.new_tab_rm"
        v-model:value="Settings.state.bookmarksMidClickRemove"
        dbg="bookmarksMidClickRemove"
        :default="DEFAULT_SETTINGS.bookmarksMidClickRemove"
        :inactive="Settings.state.bookmarksMidClickAction !== 'open_in_new'"
        @update:value="Settings.saveDebounced(150)")
      SelectField(
        label="settings.mouse.bh.new_tab_pos"
        optLabel="settings.mouse.bh.new_tab_pos_"
        v-model:value="Settings.state.bookmarksMidClickPos"
        dbg="bookmarksMidClickPos"
        :default="DEFAULT_SETTINGS.bookmarksMidClickPos"
        :inactive="Settings.state.bookmarksMidClickAction !== 'open_in_new'"
        :opts="Settings.getOpts('bookmarksNewTabPos')"
        :folded="false"
        @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="historyEl")
    .sub-title: .text {{translate('settings.nav_settings_mouse_history')}}
    SelectField.-no-separator(
      label="settings.mouse.history.left_click_action"
      optLabel="settings.mouse.bh.left_click_action_"
      v-model:value="Settings.state.historyLeftClickAction"
      dbg="historyLeftClickAction"
      :default="DEFAULT_SETTINGS.historyLeftClickAction"
      :opts="Settings.getOpts('historyLeftClickAction')"
      :folded="false"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      ToggleField(
        label="settings.mouse.bh.new_tab_activate"
        v-model:value="Settings.state.historyLeftClickActivate"
        dbg="historyLeftClickActivate"
        :default="DEFAULT_SETTINGS.historyLeftClickActivate"
        :inactive="Settings.state.historyLeftClickAction !== 'open_in_new'"
        @update:value="Settings.saveDebounced(150)")
      SelectField(
        label="settings.mouse.bh.new_tab_pos"
        optLabel="settings.mouse.bh.new_tab_pos_"
        v-model:value="Settings.state.historyLeftClickPos"
        dbg="historyLeftClickPos"
        :default="DEFAULT_SETTINGS.historyLeftClickPos"
        :inactive="Settings.state.historyLeftClickAction !== 'open_in_new'"
        :opts="Settings.getOpts('historyNewTabPos')"
        :folded="false"
        @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.mouse.history.mid_click_action"
      optLabel="settings.mouse.history.mid_click_action_"
      v-model:value="Settings.state.historyMidClickAction"
      dbg="historyMidClickAction"
      :default="DEFAULT_SETTINGS.historyMidClickAction"
      :opts="Settings.getOpts('historyMidClickAction')"
      :folded="false"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      ToggleField(
        label="settings.mouse.bh.new_tab_activate"
        v-model:value="Settings.state.historyMidClickActivate"
        dbg="historyMidClickActivate"
        :default="DEFAULT_SETTINGS.historyMidClickActivate"
        :inactive="Settings.state.historyMidClickAction !== 'open_in_new'"
        @update:value="Settings.saveDebounced(150)")
      SelectField(
        label="settings.mouse.bh.new_tab_pos"
        optLabel="settings.mouse.bh.new_tab_pos_"
        v-model:value="Settings.state.historyMidClickPos"
        dbg="historyMidClickPos"
        :default="DEFAULT_SETTINGS.historyMidClickPos"
        :inactive="Settings.state.historyMidClickAction !== 'open_in_new'"
        :opts="Settings.getOpts('historyNewTabPos')"
        :folded="false"
        @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'
import NumField from '../../components/num-field.vue'

const el = ref<HTMLElement | null>(null)
const navEl = ref<HTMLElement | null>(null)
const tabsEl = ref<HTMLElement | null>(null)
const tabsPanelEl = ref<HTMLElement | null>(null)
const ntbEl = ref<HTMLElement | null>(null)
const bookmarksEl = ref<HTMLElement | null>(null)
const historyEl = ref<HTMLElement | null>(null)

onMounted(() => {
  SetupPage.registerEl('settings_mouse', el.value)
  SetupPage.registerEl('settings_mouse_nav', navEl.value)
  SetupPage.registerEl('settings_mouse_tabs', tabsEl.value)
  SetupPage.registerEl('settings_mouse_tabs_panel', tabsPanelEl.value)
  SetupPage.registerEl('settings_mouse_new_tab_button', ntbEl.value)
  SetupPage.registerEl('settings_mouse_bookmarks', bookmarksEl.value)
  SetupPage.registerEl('settings_mouse_history', historyEl.value)
})

function onTabsSecondClickActPrevUpdate(value: boolean): void {
  if (value) Settings.state.tabDoubleClick = 'none'
  Settings.saveDebounced(150)
}

function onTabDoubleClickUpdate(value: string): void {
  if (value !== 'none') Settings.state.tabsSecondClickActPrev = false
  Settings.saveDebounced(150)
}

function onActivateOnMouseUpUpdate(value: boolean): void {
  if (
    !value &&
    (Settings.state.tabLongLeftClick === 'edit_title' ||
      Settings.state.tabLongLeftClick === 'discard')
  ) {
    Settings.state.tabLongLeftClick = 'none'
  }
  Settings.saveDebounced(150)
}

function onTabLongLeftClickUpdate(value: string): void {
  if ((value === 'edit_title' || value === 'discard') && !Settings.state.activateOnMouseUp) {
    Settings.state.activateOnMouseUp = true
  }
  Settings.saveDebounced(150)
}
</script>
