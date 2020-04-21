<template lang="pug">
section
  h2 {{t('settings.pinned_tabs_title')}}
  select-field(
    label="settings.pinned_tabs_position"
    optLabel="settings.pinned_tabs_position_"
    :value="$store.state.pinnedTabsPosition"
    :opts="$store.state.pinnedTabsPositionOpts"
    @input="switchPinnedTabsPosition")
  toggle-field(
    label="settings.pinned_tabs_list"
    :inactive="$store.state.pinnedTabsPosition !== 'panel'"
    :value="$store.state.pinnedTabsList"
    @input="setOpt('pinnedTabsList', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import State from '../store/state'
import Actions from '../actions'

export default {
  components: { ToggleField, SelectField },

  methods: {
    /**
     * Switch pinned tabs bar layout
     */
    switchPinnedTabsPosition(value) {
      State.pinnedTabsPosition = value
      if (value === 'left' || value === 'right') {
        if (State.navBarLayout === 'vertical') State.navBarLayout = 'horizontal'
      }
      Actions.saveSettings()
    },
  },
}
</script>
