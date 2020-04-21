<template lang="pug">
section
  h2 {{t('settings.tabs_title')}}
  select-field(
    label="settings.state_storage"
    optLabel="settings.state_storage_"
    :note="t('settings.state_storage_desc')"
    :value="$store.state.stateStorage"
    :opts="$store.state.stateStorageOpts"
    @input="setOpt('stateStorage', $event)")
  select-field(
    label="settings.warn_on_multi_tab_close"
    optLabel="settings.warn_on_multi_tab_close_"
    :value="$store.state.warnOnMultiTabClose"
    :opts="$store.state.warnOnMultiTabCloseOpts"
    @input="setOpt('warnOnMultiTabClose', $event)")
  toggle-field(
    label="settings.tabs_rm_undo_note"
    :value="$store.state.tabsRmUndoNote"
    @input="setOpt('tabsRmUndoNote', $event)")
  toggle-field(
    label="settings.activate_on_mouseup"
    :value="$store.state.activateOnMouseUp"
    @input="setOpt('activateOnMouseUp', $event)")
  toggle-field(
    label="settings.activate_last_tab_on_panel_switching"
    :value="$store.state.activateLastTabOnPanelSwitching"
    @input="setOpt('activateLastTabOnPanelSwitching', $event)")
  toggle-field(
    label="settings.skip_empty_panels"
    :value="$store.state.skipEmptyPanels"
    @input="setOpt('skipEmptyPanels', $event)")
  toggle-field(
    label="settings.show_tab_rm_btn"
    :value="$store.state.showTabRmBtn"
    @input="setOpt('showTabRmBtn', $event)")
  toggle-field(
    label="settings.show_tab_ctx"
    :value="$store.state.showTabCtx"
    @input="setOpt('showTabCtx', $event)")
  toggle-field(
    label="settings.hide_inactive_panel_tabs"
    :value="$store.state.hideInact"
    @input="toggleHideInact")
  select-field(
    label="settings.activate_after_closing"
    optLabel="settings.activate_after_closing_"
    :value="$store.state.activateAfterClosing"
    :opts="$store.state.activateAfterClosingOpts"
    @input="setOpt('activateAfterClosing', $event)")
  .sub-fields
    select-field(
      label="settings.activate_after_closing_prev_rule"
      optLabel="settings.activate_after_closing_rule_"
      :value="$store.state.activateAfterClosingPrevRule"
      :inactive="!activateAfterClosingNextOrPrev"
      :opts="$store.state.activateAfterClosingPrevRuleOpts"
      @input="setOpt('activateAfterClosingPrevRule', $event)")
    select-field.-last(
      label="settings.activate_after_closing_next_rule"
      optLabel="settings.activate_after_closing_rule_"
      :value="$store.state.activateAfterClosingNextRule"
      :inactive="!activateAfterClosingNextOrPrev"
      :opts="$store.state.activateAfterClosingNextRuleOpts"
      @input="setOpt('activateAfterClosingNextRule', $event)")
    toggle-field(
      label="settings.activate_after_closing_global"
      :inactive="$store.state.activateAfterClosing !== 'prev_act'"
      :value="$store.state.activateAfterClosingGlobal"
      @input="setOpt('activateAfterClosingGlobal', $event)")
    toggle-field(
      label="settings.activate_after_closing_no_folded"
      :inactive="$store.state.activateAfterClosing !== 'prev_act'"
      :value="$store.state.activateAfterClosingNoFolded"
      @input="setOpt('activateAfterClosingNoFolded', $event)")
    toggle-field(
      label="settings.activate_after_closing_no_discarded"
      :inactive="$store.state.activateAfterClosing === 'none'"
      :value="$store.state.activateAfterClosingNoDiscarded"
      @input="setOpt('activateAfterClosingNoDiscarded', $event)")
  toggle-field(
    label="settings.shift_selection_from_active"
    :value="$store.state.shiftSelAct"
    @input="setOpt('shiftSelAct', $event)")
  toggle-field(
    label="settings.ask_new_bookmark_place"
    :value="$store.state.askNewBookmarkPlace"
    @input="setOpt('askNewBookmarkPlace', $event)")
  toggle-field(
    label="settings.native_highlight"
    :value="$store.state.nativeHighlight"
    @input="setOpt('nativeHighlight', $event)")
  toggle-field(
    label="settings.tabs_unread_mark"
    :value="$store.state.tabsUnreadMark"
    @input="setOpt('tabsUnreadMark', $event)")
  count-field.-inline(
    label="settings.tabs_reload_limit"
    :value="$store.state.tabsReloadLimit"
    :min="3"
    @input="setOpt('tabsReloadLimit', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import CountField from '../../components/count-field'
import State from '../store/state'

export default {
  components: { ToggleField, SelectField, CountField },

  methods: {
    /**
     * Check permissions and toggle 'hideInact' value
     */
    toggleHideInact() {
      if (!State.hideInact && !State.permTabHide) {
        location.hash = 'tab-hide'
        return
      }

      this.setOpt('hideInact', !State.hideInact)
    },
  },
}
</script>
