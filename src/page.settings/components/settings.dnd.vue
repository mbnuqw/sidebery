<template lang="pug">
section
  h2 {{t('settings.dnd_title')}}
  ToggleField(
    label="settings.dnd_tab_act"
    :value="$store.state.dndTabAct"
    @input="setOpt('dndTabAct', $event)")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_tab_act_delay"
      :inactive="!$store.state.dndTabAct"
      :value="$store.state.dndTabActDelay"
      :or="0"
      @input="setOpt('dndTabActDelay', $event[0])")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      :inactive="!$store.state.dndTabAct"
      :value="$store.state.dndTabActMod"
      :opts="$store.state.dndTabActModOpts"
      @input="setOpt('dndTabActMod', $event)")
  SelectField(
    label="settings.dnd_exp"
    optLabel="settings.dnd_exp_"
    :value="$store.state.dndExp"
    :opts="$store.state.dndExpOpts"
    @input="setOpt('dndExp', $event)")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_exp_delay"
      :inactive="$store.state.dndExp === 'none'"
      :value="$store.state.dndExpDelay"
      :or="0"
      @input="setOpt('dndExpDelay', $event[0])")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      :inactive="$store.state.dndExp === 'none'"
      :value="$store.state.dndExpMod"
      :opts="$store.state.dndExpModOpts"
      @input="setOpt('dndExpMod', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import NumField from '../../components/num-field'

export default {
  components: { ToggleField, SelectField, NumField },
}
</script>
