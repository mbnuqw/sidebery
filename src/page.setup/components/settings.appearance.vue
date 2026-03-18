<template lang="pug">
section(ref="el")
  h2 {{translate('settings.appearance_title')}}
  span.header-shadow
  SelectField(
    label="settings.font_size"
    optLabel="settings.font_size_"
    v-model:value="Settings.state.fontSize"
    dbg="fontSize"
    :default="DEFAULT_SETTINGS.fontSize"
    :opts="Settings.getOpts('fontSize')"
    @update:value="Settings.saveDebounced(150)")
  TextField.-inline(
    label="settings.font_family"
    or="system-ui"
    v-model:value="Settings.state.fontFamily"
    dbg="fontFamily"
    :default="DEFAULT_SETTINGS.fontFamily"
    :line="true"
    @update:value="Settings.saveDebounced(500)")
  ToggleField(
    label="settings.animations"
    v-model:value="Settings.state.animations"
    dbg="animations"
    :default="DEFAULT_SETTINGS.animations"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    SelectField(
      label="settings.animation_speed"
      optLabel="settings.animation_speed_"
      v-model:value="Settings.state.animationSpeed"
      dbg="animationSpeed"
      :default="DEFAULT_SETTINGS.animationSpeed"
      :inactive="!Settings.state.animations"
      :opts="Settings.getOpts('animationSpeed')"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.theme"
    optLabel="settings.theme_"
    v-model:value="Settings.state.theme"
    dbg="theme"
    :default="DEFAULT_SETTINGS.theme"
    :opts="Settings.getOpts('theme')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.density"
    optLabel="settings.density_"
    v-model:value="Settings.state.density"
    dbg="density"
    :default="DEFAULT_SETTINGS.density"
    :opts="Settings.getOpts('density')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.switch_color_scheme"
    optLabel="settings.color_scheme_"
    v-model:value="Settings.state.colorScheme"
    dbg="colorScheme"
    :default="DEFAULT_SETTINGS.colorScheme"
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
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as Styles from 'src/services/styles.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'
import TextField from '../../components/text-field.vue'

const el = ref<HTMLElement | null>(null)

function onColorSchemeUpdate() {
  Styles.updateColorScheme()
  Settings.saveDebounced(150)
}

onMounted(() => SetupPage.registerEl('settings_appearance', el.value))
</script>
