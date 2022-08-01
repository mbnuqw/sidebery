<template lang="pug">
section(ref="el")
  h2 {{translate('settings.new_tab_position')}}
  SelectField(
    label="settings.move_new_tab_pin"
    optLabel="settings.move_new_tab_pin_"
    v-model:value="Settings.state.moveNewTabPin"
    :opts="Settings.getOpts('moveNewTabPin')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.pinned_auto_group"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.pinnedAutoGroup"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.move_new_tab_parent"
    optLabel="settings.move_new_tab_parent_"
    v-model:value="Settings.state.moveNewTabParent"
    :opts="Settings.getOpts('moveNewTabParent')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.move_new_tab_parent_act_panel"
      :inactive="Settings.state.moveNewTabParent === 'none'"
      v-model:value="Settings.state.moveNewTabParentActPanel"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.move_new_tab"
    optLabel="settings.move_new_tab_"
    v-model:value="Settings.state.moveNewTab"
    :opts="Settings.getOpts('moveNewTab')"
    :folded="true"
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

onMounted(() => SetupPage.registerEl('settings_new_tab_position', el.value))
</script>
