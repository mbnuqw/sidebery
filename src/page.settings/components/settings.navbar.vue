<template lang="pug">
section
  h2 {{t('settings.nav_title')}}
  SelectField(
    label="settings.nav_bar_layout"
    optLabel="settings.nav_bar_layout_"
    :value="$store.state.navBarLayout"
    :opts="$store.state.navBarLayoutOpts"
    @input="switchNavBarLayout")
  .sub-fields
    ToggleField(
      label="settings.nav_bar_inline"
      :inactive="$store.state.navBarLayout === 'vertical'"
      :value="$store.state.navBarInline"
      @input="setOpt('navBarInline', $event)")
  ToggleField(
    label="settings.hide_add_btn"
    :value="$store.state.hideAddBtn"
    @input="setOpt('hideAddBtn', $event)")
  ToggleField(
    label="settings.hide_settings_btn"
    :value="$store.state.hideSettingsBtn"
    @input="setOpt('hideSettingsBtn', $event)")
  ToggleField(
    label="settings.nav_btn_count"
    :value="$store.state.navBtnCount"
    @input="setOpt('navBtnCount', $event)")
  ToggleField(
    label="settings.hide_empty_panels"
    :value="$store.state.hideEmptyPanels"
    @input="setOpt('hideEmptyPanels', $event)")
  SelectField(
    label="settings.nav_act_tabs_panel_left_click"
    optLabel="settings.nav_act_tabs_panel_left_click_"
    :value="$store.state.navActTabsPanelLeftClickAction"
    :opts="$store.state.navActTabsPanelLeftClickActionOpts"
    @input="setOpt('navActTabsPanelLeftClickAction', $event)")
  SelectField(
    label="settings.nav_mid_click"
    optLabel="settings.nav_mid_click_"
    :value="$store.state.navMidClickAction"
    :opts="$store.state.navMidClickActionOpts"
    @input="setOpt('navMidClickAction', $event)")
  ToggleField.-last(
    label="settings.nav_switch_panels_wheel"
    :value="$store.state.navSwitchPanelsWheel"
    @input="setOpt('navSwitchPanelsWheel', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import State from '../store/state'
import Actions from '../actions'

export default {
  components: { ToggleField, SelectField },

  methods: {
    /**
     * Switch layout of nav-bar.
     */
    switchNavBarLayout(value) {
      State.navBarLayout = value
      if (value === 'vertical') {
        if (State.navBarInline) State.navBarInline = false
        if (State.pinnedTabsPosition === 'left' || State.pinnedTabsPosition === 'right') {
          State.pinnedTabsPosition = 'panel'
        }
      }
      Actions.saveSettings()
    },
  },
}
</script>
