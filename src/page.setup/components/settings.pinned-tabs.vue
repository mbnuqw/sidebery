<template lang="pug">
section(ref="el")
  h2 {{translate('settings.pinned_tabs_title')}}
  SelectField(
    v-model:value="Settings.state.pinnedTabsPosition"
    label="settings.pinned_tabs_position"
    optLabel="settings.pinned_tabs_position_"
    :opts="Settings.getOpts('pinnedTabsPosition')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.pinned_tabs_list"
    :inactive="Settings.state.pinnedTabsPosition !== 'panel'"
    v-model:value="Settings.state.pinnedTabsList"
    @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_pinned_tabs', el.value))
</script>
