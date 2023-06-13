<template lang="pug">
section(ref="el")
  h2
    span {{translate('settings.snapshots_title')}}
    .title-note   ({{state.snapshotsLen}}: ~{{state.snapshotsSize}})
  span.header-shadow
  ToggleField(
    label="settings.snap_notify"
    v-model:value="Settings.state.snapNotify"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.snap_exclude_private"
    v-model:value="Settings.state.snapExcludePrivate"
    @update:value="Settings.saveDebounced(150)")
  NumField(
    label="settings.snap_interval"
    unitLabel="settings.snap_interval_"
    v-model:value="Settings.state.snapInterval"
    v-model:unit="Settings.state.snapIntervalUnit"
    :or="'none'"
    :unitOpts="SETTINGS_OPTIONS.snapIntervalUnit"
    @update:value="Settings.saveDebounced(500)"
    @update:unit="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.snap_export_md_tree"
    v-model:value="Settings.state.snapMdFullTree"
    :note="translate('settings.snap_export_md_tree_note')"
    @update:value="Settings.saveDebounced(150)")

  ToggleField(
    label="settings.snap_auto_export"
    :value="Settings.state.snapAutoExport"
    @update:value="toggleAutoExport")
  .sub-fields
    SelectField(
      label="settings.snap_auto_export_type"
      optLabel="settings.snap_auto_export_type_"
      v-model:value="Settings.state.snapAutoExportType"
      :inactive="!Settings.state.snapAutoExport"
      :opts="Settings.getOpts('snapAutoExportType')"
      :folded="false"
      @update:value="Settings.saveDebounced(150)")
    TextField.-wide(
      label="settings.snap_export_path"
      :or="translate('settings.snap_export_path_ph')"
      :inactive="!Settings.state.snapAutoExport"
      :line="true"
      :note="translate('settings.snap_export_path_note')"
      v-model:value="Settings.state.snapAutoExportPath"
      @update:value="Settings.saveDebounced(500)")

  NumField(
    label="settings.snap_limit"
    unitLabel="settings.snap_limit_"
    v-model:value="Settings.state.snapLimit"
    v-model:unit="Settings.state.snapLimitUnit"
    :or="'none'"
    :unitOpts="SETTINGS_OPTIONS.snapLimitUnit"
    @update:value="Settings.saveDebounced(500)"
    @update:unit="Settings.saveDebounced(150)")
  .ctrls
    .btn(@click="SetupPage.switchView('snapshots')") {{translate('settings.snapshots_view_label')}}
    .btn(@click="createSnapshot") {{translate('settings.make_snapshot')}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SETTINGS_OPTIONS } from 'src/defaults'
import { Stored } from 'src/types'
import * as IPC from 'src/services/ipc'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import NumField from '../../components/num-field.vue'
import TextField from '../../components/text-field.vue'
import SelectField from '../../components/select-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import * as Utils from 'src/utils'
import { Permissions } from 'src/services/permissions'

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

async function toggleAutoExport() {
  if (!Settings.state.snapAutoExport && !Permissions.reactive.downloads) {
    const result = await Permissions.request('downloads')
    if (!result) return
  }

  Settings.state.snapAutoExport = !Settings.state.snapAutoExport

  Settings.saveDebounced(150)
}
</script>
