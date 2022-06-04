<template lang="pug">
section(ref="el")
  h2 {{translate('settings.tabs_tree_title')}}
  ToggleField(label="settings.tabs_tree_layout" v-model:value="Settings.reactive.tabsTree")
  ToggleField(
    label="settings.group_on_open_layout"
    v-model:value="Settings.reactive.groupOnOpen"
    :inactive="!Settings.reactive.tabsTree")
  SelectField(
    label="settings.tabs_tree_limit"
    optLabel="settings.tabs_tree_limit_"
    v-model:value="Settings.reactive.tabsTreeLimit"
    :inactive="!Settings.reactive.tabsTree"
    :opts="Settings.getOpts('tabsTreeLimit')")
  ToggleField(
    label="settings.hide_folded_tabs"
    :inactive="!Settings.reactive.tabsTree"
    :value="Settings.reactive.hideFoldedTabs"
    @update:value="toggleHideFoldedTabs")
  ToggleField(
    label="settings.auto_fold_tabs"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.autoFoldTabs")
  .sub-fields
    SelectField(
      label="settings.auto_fold_tabs_except"
      optLabel="settings.auto_fold_tabs_except_"
      v-model:value="Settings.reactive.autoFoldTabsExcept"
      :inactive="!Settings.reactive.tabsTree || !Settings.reactive.autoFoldTabs"
      :opts="Settings.getOpts('autoFoldTabsExcept')")
  ToggleField(
    label="settings.auto_exp_tabs"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.autoExpandTabs")
  SelectField(
    label="settings.rm_child_tabs"
    optLabel="settings.rm_child_tabs_"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.rmChildTabs"
    :opts="Settings.getOpts('rmChildTabs')")
  ToggleField(
    label="settings.tabs_child_count"
    v-model:value="Settings.reactive.tabsChildCount"
    :inactive="!Settings.reactive.tabsTree")
  ToggleField(
    label="settings.tabs_lvl_dots"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.tabsLvlDots")
  ToggleField(
    label="settings.discard_folded"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.discardFolded")
  .sub-fields
    NumField.-last(
      label="settings.discard_folded_delay"
      unitLabel="settings.discard_folded_delay_"
      v-model:value="Settings.reactive.discardFoldedDelay"
      v-model:unit="Settings.reactive.discardFoldedDelayUnit"
      :or="0"
      :inactive="!Settings.reactive.tabsTree || !Settings.reactive.discardFolded"
      :unitOpts="SETTINGS_OPTIONS.discardFoldedDelayUnit")
  ToggleField(
    label="settings.tabs_tree_bookmarks"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.tabsTreeBookmarks")
  SelectField(
    label="settings.tree_rm_outdent"
    optLabel="settings.tree_rm_outdent_"
    v-model:value="Settings.reactive.treeRmOutdent"
    :inactive="!Settings.reactive.tabsTree"
    :opts="Settings.getOpts('treeRmOutdent')")
  ToggleField(
    label="settings.colorize_branches"
    :inactive="!Settings.reactive.tabsTree"
    v-model:value="Settings.reactive.colorizeTabsBranches")
  .sub-fields
    SelectField(
      label="settings.colorize_branches_src"
      optLabel="settings.colorize_branches_src_"
      v-model:value="Settings.reactive.colorizeTabsBranchesSrc"
      :inactive="!Settings.reactive.tabsTree || !Settings.reactive.colorizeTabsBranches"
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
  if (!Settings.reactive.hideFoldedTabs && !Permissions.reactive.tabHide) location.hash = 'tab-hide'
  else Settings.reactive.hideFoldedTabs = !Settings.reactive.hideFoldedTabs
}
</script>
