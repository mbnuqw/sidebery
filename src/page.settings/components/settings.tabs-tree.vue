<template lang="pug">
section
  h2 {{t('settings.tabs_tree_title')}}
  ToggleField(
    label="settings.tabs_tree_layout"
    :value="$store.state.tabsTree"
    @input="setOpt('tabsTree', $event)")
  ToggleField(
    label="settings.group_on_open_layout"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.groupOnOpen"
    @input="setOpt('groupOnOpen', $event)")
  SelectField(
    label="settings.tabs_tree_limit"
    optLabel="settings.tabs_tree_limit_"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.tabsTreeLimit"
    :opts="$store.state.tabsTreeLimitOpts"
    @input="setOpt('tabsTreeLimit', $event)")
  ToggleField(
    label="settings.hide_folded_tabs"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.hideFoldedTabs"
    @input="toggleHideFoldedTabs")
  ToggleField(
    label="settings.auto_fold_tabs"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.autoFoldTabs"
    @input="setOpt('autoFoldTabs', $event)")
  .sub-fields
    SelectField(
      label="settings.auto_fold_tabs_except"
      optLabel="settings.auto_fold_tabs_except_"
      :inactive="!$store.state.tabsTree || !$store.state.autoFoldTabs"
      :value="$store.state.autoFoldTabsExcept"
      :opts="$store.state.autoFoldTabsExceptOpts"
      @input="setOpt('autoFoldTabsExcept', $event)")
  ToggleField(
    label="settings.auto_exp_tabs"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.autoExpandTabs"
    @input="setOpt('autoExpandTabs', $event)")
  SelectField(
    label="settings.rm_child_tabs"
    optLabel="settings.rm_child_tabs_"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.rmChildTabs"
    :opts="$store.state.rmChildTabsOpts"
    @input="setOpt('rmChildTabs', $event)")
  ToggleField(
    label="settings.tabs_child_count"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.tabsChildCount"
    @input="setOpt('tabsChildCount', $event)")
  ToggleField(
    label="settings.tabs_lvl_dots"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.tabsLvlDots"
    @input="setOpt('tabsLvlDots', $event)")
  ToggleField(
    label="settings.discard_folded"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.discardFolded"
    @input="setOpt('discardFolded', $event)")
  .sub-fields
    NumField.-last(
      label="settings.discard_folded_delay"
      unitLabel="settings.discard_folded_delay_"
      :inactive="!$store.state.tabsTree || !$store.state.discardFolded"
      :value="$store.state.discardFoldedDelay"
      :or="0"
      :unit="$store.state.discardFoldedDelayUnit"
      :unitOpts="$store.state.discardFoldedDelayUnitOpts"
      @input="setOpt('discardFoldedDelay', $event[0]), setOpt('discardFoldedDelayUnit', $event[1])")
  ToggleField(
    label="settings.tabs_tree_bookmarks"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.tabsTreeBookmarks"
    @input="setOpt('tabsTreeBookmarks', $event)")
  SelectField(
    label="settings.tree_rm_outdent"
    optLabel="settings.tree_rm_outdent_"
    :inactive="!$store.state.tabsTree"
    :value="$store.state.treeRmOutdent"
    :opts="$store.state.treeRmOutdentOpts"
    @input="setOpt('treeRmOutdent', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import NumField from '../../components/num-field'
import State from '../store/state'

export default {
  components: { ToggleField, SelectField, NumField },

  methods: {
    /**
     * Check permissions and toggle 'hideFoldedTabs' value
     */
    toggleHideFoldedTabs() {
      if (!State.hideFoldedTabs && !State.permTabHide) {
        location.hash = 'tab-hide'
        return
      }

      this.setOpt('hideFoldedTabs', !State.hideFoldedTabs)
    },
  },
}
</script>
