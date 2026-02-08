<template lang="pug">
section(ref="el")
  h2 {{translate('settings.dnd_title')}}
  span.header-shadow
  ToggleField(
    label="settings.dnd_tab_act"
    v-model:value="Settings.state.dndTabAct"
    dbg="dndTabAct"
    :default="DEFAULT_SETTINGS.dndTabAct"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_tab_act_delay"
      v-model:value="Settings.state.dndTabActDelay"
      dbg="dndTabActDelay"
      :default="DEFAULT_SETTINGS.dndTabActDelay"
      :inactive="!Settings.state.dndTabAct"
      :or="0"
      @update:value="Settings.saveDebounced(500)")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      v-model:value="Settings.state.dndTabActMod"
      dbg="dndTabActMod"
      :default="DEFAULT_SETTINGS.dndTabActMod"
      :inactive="!Settings.state.dndTabAct"
      :opts="Settings.getOpts('dndTabActMod')"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.dnd_exp"
    optLabel="settings.dnd_exp_"
    v-model:value="Settings.state.dndExp"
    dbg="dndExp"
    :default="DEFAULT_SETTINGS.dndExp"
    :opts="Settings.getOpts('dndExp')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields.-nosep
    NumField.-inline(
      label="settings.dnd_exp_delay"
      :inactive="Settings.state.dndExp === 'none'"
      v-model:value="Settings.state.dndExpDelay"
      dbg="dndExpDelay"
      :default="DEFAULT_SETTINGS.dndExpDelay"
      :or="0"
      @update:value="Settings.saveDebounced(500)")
    SelectField(
      label="settings.dnd_mod"
      optLabel="settings.dnd_mod_"
      v-model:value="Settings.state.dndExpMod"
      dbg="dndExpMod"
      :default="DEFAULT_SETTINGS.dndExpMod"
      :inactive="Settings.state.dndExp === 'none'"
      :opts="Settings.getOpts('dndExpMod')"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.dnd_outside"
    optLabel="settings.dnd_outside_"
    v-model:value="Settings.state.dndOutside"
    dbg="dndOutside"
    :default="DEFAULT_SETTINGS.dndOutside"
    :opts="Settings.getOpts('dndOutside')"
    :note="translate('settings.settings.dnd_outside_note')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_act_tab_from_link"
    v-model:value="Settings.state.dndActTabFromLink"
    dbg="dndActTabFromLink"
    :default="DEFAULT_SETTINGS.dndActTabFromLink"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_act_search_tab"
    v-model:value="Settings.state.dndActSearchTab"
    dbg="dndActSearchTab"
    :default="DEFAULT_SETTINGS.dndActSearchTab"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.move_tab_to_panel"
    optLabel="settings.move_tab_to_panel_"
    v-model:value="Settings.state.dndTabToPanelPos"
    dbg="dndTabToPanelPos"
    :default="DEFAULT_SETTINGS.dndTabToPanelPos"
    :opts="Settings.getOpts('dndTabToPanelPos')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_move_tabs"
    :note="translate('settings.dnd_move_tabs_note')"
    v-model:value="Settings.state.dndMoveTabs"
    dbg="dndMoveTabs"
    :default="DEFAULT_SETTINGS.dndMoveTabs"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.dnd_move_bookmarks"
    :note="translate('settings.dnd_move_bookmarks_note')"
    v-model:value="Settings.state.dndMoveBookmarks"
    dbg="dndMoveBookmarks"
    :default="DEFAULT_SETTINGS.dndMoveBookmarks"
    @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import NumField from '../../components/num-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_dnd', el.value))
</script>
