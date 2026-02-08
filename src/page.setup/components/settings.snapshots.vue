<template lang="pug">
section(ref="el")
  h2
    span {{translate('settings.snapshots_title')}}
    .title-note   ({{snapshotsLen}}: {{snapshotsSize}} / 10 mb)
  span.header-shadow
  ToggleField(
    label="settings.snap_notify"
    v-model:value="Settings.state.snapNotify"
    dbg="snapNotify"
    :default="DEFAULT_SETTINGS.snapNotify"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.snap_exclude_private"
    v-model:value="Settings.state.snapExcludePrivate"
    dbg="snapExcludePrivate"
    :default="DEFAULT_SETTINGS.snapExcludePrivate"
    @update:value="Settings.saveDebounced(150)")
  NumField(
    label="settings.snap_interval"
    unitLabel="settings.snap_interval_"
    v-model:value="Settings.state.snapInterval"
    v-model:unit="Settings.state.snapIntervalUnit"
    dbg="snapInterval"
    :default="DEFAULT_SETTINGS.snapInterval"
    :default-unit="DEFAULT_SETTINGS.snapIntervalUnit"
    :or="'none'"
    :unitOpts="SETTINGS_OPTIONS.snapIntervalUnit"
    @update:value="Settings.saveDebounced(500)"
    @update:unit="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.snap_export_md_tree"
    v-model:value="Settings.state.snapMdFullTree"
    dbg="snapMdFullTree"
    :default="DEFAULT_SETTINGS.snapMdFullTree"
    :note="translate('settings.snap_export_md_tree_note')"
    @update:value="Settings.saveDebounced(150)")

  ToggleField(
    label="settings.snap_auto_export"
    :value="Settings.state.snapAutoExport"
    dbg="snapAutoExport"
    :default="DEFAULT_SETTINGS.snapAutoExport"
    @update:value="toggleAutoExport")
  .sub-fields
    SelectField(
      label="settings.snap_auto_export_type"
      optLabel="settings.snap_auto_export_type_"
      v-model:value="Settings.state.snapAutoExportType"
      dbg="snapAutoExportType"
      :default="DEFAULT_SETTINGS.snapAutoExportType"
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
      dbg="snapAutoExportPath"
      :default="DEFAULT_SETTINGS.snapAutoExportPath"
      @update:value="Settings.saveDebounced(500)")

  NumField(
    label="settings.snap_limit"
    unitLabel="settings.snap_limit_"
    v-model:value="Settings.state.snapLimit"
    v-model:unit="Settings.state.snapLimitUnit"
    dbg="snapLimit"
    :default="DEFAULT_SETTINGS.snapLimit"
    :default-unit="DEFAULT_SETTINGS.snapLimitUnit"
    :or="'none'"
    :unitOpts="SETTINGS_OPTIONS.snapLimitUnit"
    :maxValue="Settings.state.snapLimitUnit === 'kb' ? MAX_SIZE_LIMIT : undefined"
    :note="translate('settings.snap_limit_note')"
    @update:value="Settings.saveDebounced(500)"
    @update:unit="Settings.saveDebounced(150)")
  .ctrls
    .btn(@click="SetupPage.switchView('snapshots')") {{translate('settings.snapshots_view_label')}}
    .btn(@click="createSnapshot") {{translate('settings.make_snapshot')}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from 'src/defaults'
import { MAX_SIZE_LIMIT } from 'src/services/snapshots.fg'
import * as Settings from 'src/services/settings.fg'
import * as Permissions from 'src/services/permissions.fg'
import * as IPC from 'src/services/ipc'
import * as SetupPage from 'src/services/setup-page.fg'
import NumField from '../../components/num-field.vue'
import TextField from '../../components/text-field.vue'
import SelectField from '../../components/select-field.vue'
import ToggleField from '../../components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)
const state = reactive({
  snapshotsLen: '-',
  snapshotsSize: '-',
})

onMounted(() => {
  SetupPage.registerEl('settings_snapshots', el.value)
})

const snapshotsLen = computed(() => {
  const storageProp = SetupPage.reactive.storagePropsByName.snapshots
  return storageProp?.len ?? 0
})

const snapshotsSize = computed(() => {
  const storageProp = SetupPage.reactive.storagePropsByName.snapshots
  return storageProp?.sizeStr ? '~' + storageProp?.sizeStr : '0'
})

async function createSnapshot(): Promise<void> {
  await IPC.bg('createSnapshot')
  SetupPage.updStorageInfo('snapshots')
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
