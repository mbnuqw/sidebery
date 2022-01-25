<template lang="pug">
section(ref="el")
  h2 {{translate('settings.appearance_title')}}
  SelectField(
    label="settings.font_size"
    optLabel="settings.font_size_"
    v-model:value="Settings.reactive.fontSize"
    :opts="Settings.getOpts('fontSize')")
  ToggleField(label="settings.animations" v-model:value="Settings.reactive.animations")
  .sub-fields
    SelectField(
      label="settings.animation_speed"
      optLabel="settings.animation_speed_"
      v-model:value="Settings.reactive.animationSpeed"
      :inactive="!Settings.reactive.animations"
      :opts="Settings.getOpts('animationSpeed')")
  SelectField(
    label="settings.theme"
    optLabel="settings.theme_"
    v-model:value="Settings.reactive.theme"
    :opts="Settings.getOpts('theme')")
  SelectField(
    label="settings.switch_color_scheme"
    optLabel="settings.color_scheme_"
    v-model:value="Settings.reactive.colorScheme"
    :opts="Settings.getOpts('colorScheme')"
    @update:value="Styles.initColorScheme()")
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

onMounted(() => SetupPage.registerEl('settings_appearance', el.value))
</script>
