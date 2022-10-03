<template lang="pug">
section(ref="el")
  h2 {{translate('settings.tabs_tree_title')}}
  ToggleField(
    label="settings.tabs_tree_layout"
    v-model:value="Settings.state.tabsTree"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.group_on_open_layout"
    v-model:value="Settings.state.groupOnOpen"
    :inactive="!Settings.state.tabsTree"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tabs_tree_limit"
    optLabel="settings.tabs_tree_limit_"
    v-model:value="Settings.state.tabsTreeLimit"
    :inactive="!Settings.state.tabsTree"
    :opts="Settings.getOpts('tabsTreeLimit')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.hide_folded_tabs"
    :inactive="!Settings.state.tabsTree"
    :value="Settings.state.hideFoldedTabs"
    @update:value="toggleHideFoldedTabs")
  ToggleField(
    label="settings.auto_fold_tabs"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.autoFoldTabs"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    SelectField(
      label="settings.auto_fold_tabs_except"
      optLabel="settings.auto_fold_tabs_except_"
      v-model:value="Settings.state.autoFoldTabsExcept"
      :inactive="!Settings.state.tabsTree || !Settings.state.autoFoldTabs"
      :opts="Settings.getOpts('autoFoldTabsExcept')"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.auto_exp_tabs"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.autoExpandTabs"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.rm_child_tabs"
    optLabel="settings.rm_child_tabs_"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.rmChildTabs"
    :opts="Settings.getOpts('rmChildTabs')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_child_count"
    v-model:value="Settings.state.tabsChildCount"
    :inactive="!Settings.state.tabsTree"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_lvl_dots"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.tabsLvlDots"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.discard_folded"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.discardFolded"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    NumField.-last(
      label="settings.discard_folded_delay"
      unitLabel="settings.discard_folded_delay_"
      v-model:value="Settings.state.discardFoldedDelay"
      v-model:unit="Settings.state.discardFoldedDelayUnit"
      :or="0"
      :inactive="!Settings.state.tabsTree || !Settings.state.discardFolded"
      :unitOpts="SETTINGS_OPTIONS.discardFoldedDelayUnit"
      @update:value="Settings.saveDebounced(500)"
      @update:unit="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_tree_bookmarks"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.tabsTreeBookmarks"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tree_rm_outdent"
    optLabel="settings.tree_rm_outdent_"
    v-model:value="Settings.state.treeRmOutdent"
    :inactive="!Settings.state.tabsTree"
    :opts="Settings.getOpts('treeRmOutdent')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.colorize_branches"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.colorizeTabsBranches"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    SelectField(
      label="settings.colorize_branches_src"
      optLabel="settings.colorize_branches_src_"
      v-model:value="Settings.state.colorizeTabsBranchesSrc"
      :inactive="!Settings.state.tabsTree || !Settings.state.colorizeTabsBranches"
      :opts="Settings.getOpts('colorizeTabsBranchesSrc')"
      @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SETTINGS_OPTIONS } from 'src/defaults'
import { Settings } from 'src/services/settings'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import NumField from '../../components/num-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_tabs_tree', el.value))

async function toggleHideFoldedTabs(): Promise<void> {
  if (!Settings.state.hideInact && !Permissions.reactive.tabHide) {
    const result = await Permissions.request('tabHide')
    if (!result) return
  }

  Settings.state.hideFoldedTabs = !Settings.state.hideFoldedTabs

  Settings.saveDebounced(150)
}
</script>
