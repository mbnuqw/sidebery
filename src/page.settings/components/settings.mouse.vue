<template lang="pug">
section
  h2 {{t('settings.mouse_title')}}
  toggle-field(
    label="settings.h_scroll_through_panels"
    :value="$store.state.hScrollThroughPanels"
    @input="setOpt('hScrollThroughPanels', $event)")
  select-field(
    label="settings.scroll_through_tabs"
    optLabel="settings.scroll_through_tabs_"
    :value="$store.state.scrollThroughTabs"
    :opts="$store.state.scrollThroughTabsOpts"
    @input="setOpt('scrollThroughTabs', $event)")
  .sub-fields
    toggle-field(
      label="settings.scroll_through_visible_tabs"
      :value="$store.state.scrollThroughVisibleTabs"
      :inactive="!$store.state.tabsTree || $store.state.scrollThroughTabs === 'none'"
      @input="setOpt('scrollThroughVisibleTabs', $event)")
    toggle-field(
      label="settings.scroll_through_tabs_skip_discarded"
      :value="$store.state.scrollThroughTabsSkipDiscarded"
      :inactive="$store.state.scrollThroughTabs === 'none'"
      @input="setOpt('scrollThroughTabsSkipDiscarded', $event)")
    toggle-field(
      label="settings.scroll_through_tabs_except_overflow"
      :value="$store.state.scrollThroughTabsExceptOverflow"
      :inactive="$store.state.scrollThroughTabs === 'none'"
      @input="setOpt('scrollThroughTabsExceptOverflow', $event)")
    toggle-field(
      label="settings.scroll_through_tabs_cyclic"
      :value="$store.state.scrollThroughTabsCyclic"
      :inactive="$store.state.scrollThroughTabs === 'none'"
      @input="setOpt('scrollThroughTabsCyclic', $event)")
  select-field(
    label="settings.tab_double_click"
    optLabel="settings.tab_action_"
    :value="$store.state.tabDoubleClick"
    :opts="$store.state.tabDoubleClickOpts"
    @input="setOpt('tabDoubleClick', $event)")
  select-field(
    label="settings.tab_long_left_click"
    optLabel="settings.tab_action_"
    :value="$store.state.tabLongLeftClick"
    :opts="$store.state.tabLongLeftClickOpts"
    @input="setOpt('tabLongLeftClick', $event)")
  select-field(
    label="settings.tab_long_right_click"
    optLabel="settings.tab_action_"
    :value="$store.state.tabLongRightClick"
    :opts="$store.state.tabLongRightClickOpts"
    @input="setOpt('tabLongRightClick', $event)")
  select-field(
    label="settings.tabs_panel_left_click_action"
    optLabel="settings.tabs_panel_action_"
    :value="$store.state.tabsPanelLeftClickAction"
    :opts="$store.state.tabsPanelLeftClickActionOpts"
    @input="setOpt('tabsPanelLeftClickAction', $event)")
  select-field(
    label="settings.tabs_panel_double_click_action"
    optLabel="settings.tabs_panel_action_"
    :inactive="$store.state.tabsPanelLeftClickAction !== 'none'"
    :value="$store.state.tabsPanelDoubleClickAction"
    :opts="$store.state.tabsPanelDoubleClickActionOpts"
    @input="setOpt('tabsPanelDoubleClickAction', $event)")
  select-field(
    label="settings.tabs_panel_right_click_action"
    optLabel="settings.tabs_panel_action_"
    :value="$store.state.tabsPanelRightClickAction"
    :opts="$store.state.tabsPanelRightClickActionOpts"
    @input="setOpt('tabsPanelRightClickAction', $event)")
  select-field(
    label="settings.tabs_panel_middle_click_action"
    optLabel="settings.tabs_panel_action_"
    :value="$store.state.tabsPanelMiddleClickAction"
    :opts="$store.state.tabsPanelMiddleClickActionOpts"
    @input="setOpt('tabsPanelMiddleClickAction', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'

export default {
  components: { ToggleField, SelectField },
}
</script>
