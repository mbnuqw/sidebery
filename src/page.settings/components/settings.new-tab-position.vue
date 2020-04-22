<template lang="pug">
section
  h2 {{t('settings.new_tab_position')}}
  SelectField(
    label="settings.move_new_tab_pin"
    optLabel="settings.move_new_tab_pin_"
    :value="$store.state.moveNewTabPin"
    :opts="$store.state.moveNewTabPinOpts"
    @input="setOpt('moveNewTabPin', $event)")
  ToggleField(
    label="settings.pinned_auto_group"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.pinnedAutoGroup"
    @input="setOpt('pinnedAutoGroup', $event)")
  SelectField(
    label="settings.move_new_tab_parent"
    optLabel="settings.move_new_tab_parent_"
    :value="$store.state.moveNewTabParent"
    :opts="$store.state.moveNewTabParentOpts"
    @input="setOpt('moveNewTabParent', $event)")
  .sub-fields
    ToggleField(
      label="settings.move_new_tab_parent_act_panel"
      :inactive="$store.state.moveNewTabParent === 'none'"
      :value="$store.state.moveNewTabParentActPanel"
      @input="setOpt('moveNewTabParentActPanel', $event)")
  SelectField(
    label="settings.move_new_tab"
    optLabel="settings.move_new_tab_"
    :value="$store.state.moveNewTab"
    :opts="$store.state.moveNewTabOpts"
    @input="setOpt('moveNewTab', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'

export default {
  components: { ToggleField, SelectField },
}
</script>
