<template lang="pug">
section(ref="el")
  h2 {{translate('settings.new_tab_position')}}
  SelectField(
    label="settings.move_new_tab_pin"
    optLabel="settings.move_new_tab_pin_"
    v-model:value="Settings.reactive.moveNewTabPin"
    :opts="Settings.getOpts('moveNewTabPin')")
  ToggleField(
    label="settings.pinned_auto_group"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.pinnedAutoGroup")
  SelectField(
    label="settings.move_new_tab_parent"
    optLabel="settings.move_new_tab_parent_"
    v-model:value="Settings.reactive.moveNewTabParent"
    :opts="Settings.getOpts('moveNewTabParent')")
  .sub-fields
    ToggleField(
      label="settings.move_new_tab_parent_act_panel"
      :inactive="Settings.reactive.moveNewTabParent === 'none'"
      v-model:value="Settings.reactive.moveNewTabParentActPanel")
  SelectField(
    label="settings.move_new_tab"
    optLabel="settings.move_new_tab_"
    v-model:value="Settings.reactive.moveNewTab"
    :opts="Settings.getOpts('moveNewTab')")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_new_tab_position', el.value))
</script>
