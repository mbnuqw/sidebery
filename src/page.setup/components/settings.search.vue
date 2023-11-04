<template lang="pug">
section(ref="el")
  h2 {{translate('settings.search_title')}}
  span.header-shadow
  SelectField(
    label="settings.search_bar_mode"
    optLabel="settings.search_bar_mode_"
    v-model:value="Settings.state.searchBarMode"
    :opts="Settings.getOpts('searchBarMode')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.search_panel_switch"
    optLabel="settings.search_panel_switch_"
    v-model:value="Settings.state.searchPanelSwitch"
    :opts="Settings.getOpts('searchPanelSwitch')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.search.pinned_tabs_first"
    v-model:value="Settings.state.searchPinnedTabsFirst"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.search.all_panels_always"
    v-model:value="Settings.state.searchAllPanelsAlways"
    @update:value="Settings.saveDebounced(150)")
  InfoField(
    label="settings.search.shortcuts"
    :value="translate('settings.search.shortcuts.note')")
  .sub-fields
    TextField(
      label="settings.search.bookmarks_shortcut"
      v-model:value="Settings.state.searchBookmarksShortcut"
      @update:value="Settings.saveDebounced(150)")
    TextField(
      label="settings.search.history_shortcut"
      v-model:value="Settings.state.searchHistoryShortcut"
      @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SetupPage } from 'src/services/setup-page'
import { Settings } from 'src/services/settings'
import SelectField from '../../components/select-field.vue'
import TextField from 'src/components/text-field.vue'
import InfoField from 'src/components/info-field.vue'
import ToggleField from 'src/components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_search', el.value))
</script>
