<template lang="pug">
section(ref="el")
  h2 {{translate('settings.tabs_tree_title')}}
  ToggleField(label="settings.tabs_tree_layout" v-model:value="Settings.state.tabsTree")
  ToggleField(
    label="settings.group_on_open_layout"
    v-model:value="Settings.state.groupOnOpen"
    :inactive="!Settings.state.tabsTree")
  SelectField(
    label="settings.tabs_tree_limit"
    optLabel="settings.tabs_tree_limit_"
    v-model:value="Settings.state.tabsTreeLimit"
    :inactive="!Settings.state.tabsTree"
    :opts="Settings.getOpts('tabsTreeLimit')")
  ToggleField(
    label="settings.hide_folded_tabs"
    :inactive="!Settings.state.tabsTree"
    :value="Settings.state.hideFoldedTabs"
    @update:value="toggleHideFoldedTabs")
  ToggleField(
    label="settings.auto_fold_tabs"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.autoFoldTabs")
  .sub-fields
    SelectField(
      label="settings.auto_fold_tabs_except"
      optLabel="settings.auto_fold_tabs_except_"
      v-model:value="Settings.state.autoFoldTabsExcept"
      :inactive="!Settings.state.tabsTree || !Settings.state.autoFoldTabs"
      :opts="Settings.getOpts('autoFoldTabsExcept')")
  ToggleField(
    label="settings.auto_exp_tabs"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.autoExpandTabs")
  SelectField(
    label="settings.rm_child_tabs"
    optLabel="settings.rm_child_tabs_"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.rmChildTabs"
    :opts="Settings.getOpts('rmChildTabs')")
  ToggleField(
    label="settings.tabs_child_count"
    v-model:value="Settings.state.tabsChildCount"
    :inactive="!Settings.state.tabsTree")
  ToggleField(
    label="settings.tabs_lvl_dots"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.tabsLvlDots")
  ToggleField(
    label="settings.discard_folded"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.discardFolded")
  .sub-fields
    NumField.-last(
      label="settings.discard_folded_delay"
      unitLabel="settings.discard_folded_delay_"
      v-model:value="Settings.state.discardFoldedDelay"
      v-model:unit="Settings.state.discardFoldedDelayUnit"
      :or="0"
      :inactive="!Settings.state.tabsTree || !Settings.state.discardFolded"
      :unitOpts="SETTINGS_OPTIONS.discardFoldedDelayUnit")
  ToggleField(
    label="settings.tabs_tree_bookmarks"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.tabsTreeBookmarks")
  SelectField(
    label="settings.tree_rm_outdent"
    optLabel="settings.tree_rm_outdent_"
    v-model:value="Settings.state.treeRmOutdent"
    :inactive="!Settings.state.tabsTree"
    :opts="Settings.getOpts('treeRmOutdent')")
  ToggleField(
    label="settings.colorize_branches"
    :inactive="!Settings.state.tabsTree"
    v-model:value="Settings.state.colorizeTabsBranches")
  .sub-fields
    SelectField(
      label="settings.colorize_branches_src"
      optLabel="settings.colorize_branches_src_"
      v-model:value="Settings.state.colorizeTabsBranchesSrc"
      :inactive="!Settings.state.tabsTree || !Settings.state.colorizeTabsBranches"
      :opts="Settings.getOpts('colorizeTabsBranchesSrc')")
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

function toggleHideFoldedTabs(): void {
  if (!Settings.state.hideFoldedTabs && !Permissions.reactive.tabHide) location.hash = 'tab-hide'
  else Settings.state.hideFoldedTabs = !Settings.state.hideFoldedTabs
}
</script>
