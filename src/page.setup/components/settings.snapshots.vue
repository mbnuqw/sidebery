<template lang="pug">
section(ref="el")
  h2
    span {{translate('settings.snapshots_title')}}
    .title-note   ({{state.snapshotsLen}}: ~{{state.snapshotsSize}})
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
import { ref, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SETTINGS_OPTIONS } from 'src/defaults'
import { Stored } from 'src/types'
import { IPC } from 'src/services/ipc'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import NumField from '../../components/num-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import Utils from 'src/utils'

const el = ref<HTMLElement | null>(null)
const state = reactive({
  snapshotsLen: '-',
  snapshotsSize: '-',
})

onMounted(() => {
  SetupPage.registerEl('settings_snapshots', el.value)

  calcInfo()
})

async function createSnapshot(): Promise<void> {
  await IPC.bg('createSnapshot')
  calcInfo()
}

async function calcInfo(): Promise<void> {
  let stored: Stored
  try {
    stored = await browser.storage.local.get<Stored>('snapshots')
  } catch (err) {
    return
  }

  const snapshots = stored.snapshots ?? []
  state.snapshotsLen = snapshots.length.toString()
  state.snapshotsSize = Utils.bytesToStr(new Blob([JSON.stringify(snapshots)]).size)
}
</script>
