<template lang="pug">
section(ref="el")
  h2 {{translate('settings.dnd_title')}}
  ToggleField(
    label="settings.dnd_tab_act"
    v-model:value="Settings.state.dndTabAct"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_tab_act_delay"
      v-model:value="Settings.state.dndTabActDelay"
      :inactive="!Settings.state.dndTabAct"
      :or="0"
      @update:value="Settings.saveDebounced(500)")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      v-model:value="Settings.state.dndTabActMod"
      :inactive="!Settings.state.dndTabAct"
      :opts="Settings.getOpts('dndTabActMod')"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.dnd_exp"
    optLabel="settings.dnd_exp_"
    v-model:value="Settings.state.dndExp"
    :opts="Settings.getOpts('dndExp')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_exp_delay"
      :inactive="Settings.state.dndExp === 'none'"
      v-model:value="Settings.state.dndExpDelay"
      :or="0"
      @update:value="Settings.saveDebounced(500)")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      v-model:value="Settings.state.dndExpMod"
      :inactive="Settings.state.dndExp === 'none'"
      :opts="Settings.getOpts('dndExpMod')"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.dnd_outside"
    optLabel="settings.dnd_outside_"
    v-model:value="Settings.state.dndOutside"
    :opts="Settings.getOpts('dndOutside')"
    :note="translate('settings.settings.dnd_outside_note')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_act_tab_from_link"
    v-model:value="Settings.state.dndActTabFromLink"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_act_search_tab"
    v-model:value="Settings.state.dndActSearchTab"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_move_tabs"
    :note="translate('settings.dnd_move_tabs_note')"
    v-model:value="Settings.state.dndMoveTabs"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_move_bookmarks"
    :note="translate('settings.dnd_move_bookmarks_note')"
    v-model:value="Settings.state.dndMoveBookmarks"
    @update:value="Settings.saveDebounced(150)")
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
