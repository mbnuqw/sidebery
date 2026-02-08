<template lang="pug">
section(ref="el")
  h2 {{translate('settings.search_title')}}
  span.header-shadow
  SelectField(
    label="settings.search_bar_mode"
    optLabel="settings.search_bar_mode_"
    v-model:value="Settings.state.searchBarMode"
    dbg="searchBarMode"
    :default="DEFAULT_SETTINGS.searchBarMode"
    :opts="Settings.getOpts('searchBarMode')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.search_panel_switch"
    optLabel="settings.search_panel_switch_"
    v-model:value="Settings.state.searchPanelSwitch"
    dbg="searchPanelSwitch"
    :default="DEFAULT_SETTINGS.searchPanelSwitch"
    :opts="Settings.getOpts('searchPanelSwitch')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.search_tab_switch"
    v-model:value="Settings.state.searchTabSwitch"
    dbg="searchTabSwitch"
    :default="DEFAULT_SETTINGS.searchTabSwitch"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.search_menu_trigger"
    v-model:value="Settings.state.searchMenuTrig"
    dbg="searchMenuTrig"
    :default="DEFAULT_SETTINGS.searchMenuTrig"
    @update:value="Settings.saveDebounced(150)")
  InfoField(
    label="settings.search.shortcuts"
    :value="translate('settings.search.shortcuts.note')")
  .sub-fields
    TextField(
      label="settings.search.bookmarks_shortcut"
      v-model:value="Settings.state.searchBookmarksShortcut"
      dbg="searchBookmarksShortcut"
      :default="DEFAULT_SETTINGS.searchBookmarksShortcut"
      @update:value="Settings.saveDebounced(150)")
    TextField(
      label="settings.search.history_shortcut"
      v-model:value="Settings.state.searchHistoryShortcut"
      dbg="searchHistoryShortcut"
      :default="DEFAULT_SETTINGS.searchHistoryShortcut"
      @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as SetupPage from 'src/services/setup-page.fg'
import * as Settings from 'src/services/settings.fg'
import SelectField from '../../components/select-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import TextField from 'src/components/text-field.vue'
import InfoField from 'src/components/info-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_search', el.value))
</script>
