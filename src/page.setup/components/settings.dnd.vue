<template lang="pug">
section(ref="el")
  h2 {{translate('settings.dnd_title')}}
  ToggleField(label="settings.dnd_tab_act" v-model:value="Settings.reactive.dndTabAct")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_tab_act_delay"
      v-model:value="Settings.reactive.dndTabActDelay"
      :inactive="!Settings.reactive.dndTabAct"
      :or="0")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      v-model:value="Settings.reactive.dndTabActMod"
      :inactive="!Settings.reactive.dndTabAct"
      :opts="Settings.getOpts('dndTabActMod')")
  SelectField(
    label="settings.dnd_exp"
    optLabel="settings.dnd_exp_"
    v-model:value="Settings.reactive.dndExp"
    :opts="Settings.getOpts('dndExp')"
    :folded="true")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_exp_delay"
      :inactive="Settings.reactive.dndExp === 'none'"
      v-model:value="Settings.reactive.dndExpDelay"
      :or="0")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      v-model:value="Settings.reactive.dndExpMod"
      :inactive="Settings.reactive.dndExp === 'none'"
      :opts="Settings.getOpts('dndExpMod')")
  SelectField(
    label="settings.dnd_outside"
    optLabel="settings.dnd_outside_"
    v-model:value="Settings.reactive.dndOutside"
    :opts="Settings.getOpts('dndOutside')"
    :note="translate('settings.settings.dnd_outside_note')")
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import NumField from '../../components/num-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_dnd', el.value))
</script>
