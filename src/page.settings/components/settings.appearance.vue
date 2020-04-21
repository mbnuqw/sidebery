<template lang="pug">
section
  h2 {{t('settings.appearance_title')}}
  select-field(
    label="settings.font_size"
    optLabel="settings.font_size_"
    :value="$store.state.fontSize"
    :opts="$store.state.fontSizeOpts"
    @input="setOpt('fontSize', $event)")
  toggle-field(
    label="settings.animations"
    :value="$store.state.animations"
    @input="setOpt('animations', $event)")
  .sub-fields
    select-field(
      label="settings.animation_speed"
      optLabel="settings.animation_speed_"
      :inactive="!$store.state.animations"
      :value="$store.state.animationSpeed"
      :opts="$store.state.animationSpeedOpts"
      @input="setOpt('animationSpeed', $event)")
  toggle-field(
    label="settings.bg_noise"
    :value="$store.state.bgNoise"
    @input="toggleNoiseBg($event)")
  select-field(
    label="settings.theme"
    optLabel="settings.theme_"
    :value="$store.state.theme"
    :opts="$store.state.themeOpts"
    @input="setOpt('theme', $event)")
  select-field(
    label="settings.switch_style"
    optLabel="settings.style_"
    :value="$store.state.style"
    :opts="$store.state.styleOpts"
    @input="setOpt('style', $event)")
  .note-field
    .label {{t('settings.appearance_notes_title')}}
    .note {{t('settings.appearance_notes')}}
  .ctrls
    .btn(@click="switchView('styles_editor')") {{t('settings.edit_styles')}}
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
     * Toggle noise background-image
     */
    toggleNoiseBg(value) {
      State.bgNoise = value
      if (State.bgNoise) Actions.applyNoiseBg()
      else Actions.removeNoiseBg()
      Actions.saveSettings()
    },
  },
}
</script>
