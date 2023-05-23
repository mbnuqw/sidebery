<template lang="pug">
section(ref="el")
  h2 {{translate('settings.appearance_title')}}
  span.header-shadow
  SelectField(
    label="settings.font_size"
    optLabel="settings.font_size_"
    v-model:value="Settings.state.fontSize"
    :opts="Settings.getOpts('fontSize')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.animations"
    v-model:value="Settings.state.animations"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    SelectField(
      label="settings.animation_speed"
      optLabel="settings.animation_speed_"
      v-model:value="Settings.state.animationSpeed"
      :inactive="!Settings.state.animations"
      :opts="Settings.getOpts('animationSpeed')"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.theme"
    optLabel="settings.theme_"
    v-model:value="Settings.state.theme"
    :opts="Settings.getOpts('theme')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.density"
    optLabel="settings.density_"
    v-model:value="Settings.state.density"
    :opts="Settings.getOpts('density')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.switch_color_scheme"
    optLabel="settings.color_scheme_"
    v-model:value="Settings.state.colorScheme"
    :opts="Settings.getOpts('colorScheme')"
    @update:value="onColorSchemeUpdate")
  .note-field
    .label {{translate('settings.appearance_notes_title')}}
    .note {{translate('settings.appearance_notes')}}
  .ctrls
    .btn(@click="SetupPage.switchView('styles_editor')") {{translate('settings.edit_styles')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import { Styles } from 'src/services/styles'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

function onColorSchemeUpdate() {
  Styles.initColorScheme()
  Settings.saveDebounced(150)
}

onMounted(() => SetupPage.registerEl('settings_appearance', el.value))
</script>
