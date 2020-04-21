<template lang="pug">
section
  h2 {{t('settings.snapshots_title')}}
  toggle-field(
    label="settings.snap_notify"
    :value="$store.state.snapNotify"
    @input="setOpt('snapNotify', $event)")
  toggle-field(
    label="settings.snap_exclude_private"
    :value="$store.state.snapExcludePrivate"
    @input="setOpt('snapExcludePrivate', $event)")
  num-field(
    label="settings.snap_interval"
    unitLabel="settings.snap_interval_"
    :value="$store.state.snapInterval"
    :or="'none'"
    :unit="$store.state.snapIntervalUnit"
    :unitOpts="$store.state.snapIntervalUnitOpts"
    @input="setOpt('snapInterval', $event[0]), setOpt('snapIntervalUnit', $event[1])")
  num-field(
    label="settings.snap_limit"
    unitLabel="settings.snap_limit_"
    :value="$store.state.snapLimit"
    :or="'none'"
    :unit="$store.state.snapLimitUnit"
    :unitOpts="$store.state.snapLimitUnitOpts"
    @input="setOpt('snapLimit', $event[0]), setOpt('snapLimitUnit', $event[1])")
  .ctrls
    .btn(@click="switchView('snapshots')") {{t('settings.snapshots_view_label')}}
    .btn(@click="createSnapshot") {{t('settings.make_snapshot')}}
</template>

<script>
import ToggleField from '../../components/toggle-field'
import NumField from '../../components/num-field'
import EventBus from '../../event-bus'

export default {
  components: { ToggleField, NumField },

  methods: {
    /**
     * Create snapshot
     */
    async createSnapshot() {
      const snapshot = await browser.runtime.sendMessage({
        instanceType: 'bg',
        windowId: -1,
        action: 'createSnapshot',
      })

      EventBus.$emit('snapshotCreated', snapshot)
    },

    /**
     * Remove snapshot
     */
    removeAllSnapshots() {
      browser.storage.local.set({ snapshots_v4: [] })
    },
  },
}
</script>
