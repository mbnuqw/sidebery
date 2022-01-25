<template lang="pug">
section(ref="el")
  h2 {{translate('settings.snapshots_title')}}
  ToggleField(label="settings.snap_notify" v-model:value="Settings.reactive.snapNotify")
  ToggleField(label="settings.snap_exclude_private" v-model:value="Settings.reactive.snapExcludePrivate")
  NumField(
    label="settings.snap_interval"
    unitLabel="settings.snap_interval_"
    v-model:value="Settings.reactive.snapInterval"
    v-model:unit="Settings.reactive.snapIntervalUnit"
    :or="'none'"
    :unitOpts="SETTINGS_OPTIONS.snapIntervalUnit")
  NumField(
    label="settings.snap_limit"
    unitLabel="settings.snap_limit_"
    v-model:value="Settings.reactive.snapLimit"
    v-model:unit="Settings.reactive.snapLimitUnit"
    :or="'none'"
    :unitOpts="SETTINGS_OPTIONS.snapLimitUnit")
  .ctrls
    .btn(@click="SetupPage.switchView('snapshots')") {{translate('settings.snapshots_view_label')}}
    .btn(@click="createSnapshot") {{translate('settings.make_snapshot')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SETTINGS_OPTIONS } from 'src/defaults'
import { InstanceType } from 'src/types'
import { Msg } from 'src/services/msg'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import NumField from '../../components/num-field.vue'
import ToggleField from '../../components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_snapshots', el.value))

async function createSnapshot(): Promise<void> {
  const snapshot = await Msg.req(InstanceType.bg, 'createSnapshot')
}
</script>
