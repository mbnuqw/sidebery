<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2.title {{translate('settings.export_title')}}

  ToggleField(label="settings.backup_all" :value="allSelected" @update:value="onAllChanged")
  ToggleField(label="settings.backup_settings" v-model:value="state.settings" @update:value="genExportDataDebounced()")
  ToggleField(label="settings.backup_menu" v-model:value="state.menu" @update:value="genExportDataDebounced()")
  ToggleField(label="settings.backup_containers" v-model:value="state.containers" @update:value="genExportDataDebounced()")
  ToggleField(label="settings.backup_nav" v-model:value="state.nav" @update:value="genExportDataDebounced()")
  ToggleField(v-if="state.hasStyles" label="settings.backup_styles" v-model:value="state.styles" @update:value="genExportDataDebounced()")
  ToggleField(label="settings.backup_snapshots" v-model:value="state.snapshots" @update:value="genExportDataDebounced()")
  ToggleField(label="settings.backup_favicons" v-model:value="state.favicons" @update:value="genExportDataDebounced()")
  ToggleField(label="settings.backup_kb" v-model:value="state.keybindings" @update:value="genExportDataDebounced()")

  .ctrls
    a.btn(
      ref="exportDataLink"
      :href="state.dataLink"
      :download="state.dataName"
      :title="state.dataName"
      :data-inactive="!state.dataLink") {{translate('settings.help_exp_data')}}
    LoadingDots(v-if="state.fetchingData")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import type { BackupData, Snapshot, Stored } from 'src/types'
import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import * as Styles from 'src/services/styles'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import ToggleField from '../../components/toggle-field.vue'
import LoadingDots from 'src/components/loading-dots.vue'

const rootEl = ref<HTMLElement | null>(null)
const exportDataLink = ref<HTMLAnchorElement | null>(null)

const state = reactive({
  fetchingData: false,
  dataLink: '',
  dataName: '',
  settings: false,
  menu: false,
  containers: false,
  nav: false,
  hasStyles: false,
  styles: false,
  snapshots: false,
  favicons: false,
  keybindings: false,
})

onMounted(async () => {
  state.hasStyles = await Styles.hasCustomCSS()
})

const allSelected = computed<boolean>(() => {
  const all =
    state.settings &&
    state.menu &&
    state.containers &&
    state.nav &&
    (!state.hasStyles || state.styles) &&
    state.snapshots &&
    state.favicons &&
    state.keybindings
  return all
})

function onAllChanged(): void {
  if (allSelected.value) {
    state.settings = false
    state.menu = false
    state.containers = false
    state.nav = false
    if (state.hasStyles) state.styles = false
    state.snapshots = false
    state.favicons = false
    state.keybindings = false
    state.dataLink = ''
    state.dataName = ''
  } else {
    state.settings = true
    state.menu = true
    state.containers = true
    state.nav = true
    if (state.hasStyles) state.styles = true
    state.snapshots = true
    state.favicons = true
    state.keybindings = true
    genExportDataDebounced()
  }
}

function onWheel(e: WheelEvent): void {
  if (!rootEl.value) return
  let scrollOffset = rootEl.value.scrollTop
  let maxScrollOffset = rootEl.value.scrollHeight - rootEl.value.offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

let fetchingDataCb: (() => void) | undefined = undefined
async function genExportData(): Promise<void> {
  if (state.fetchingData) return
  state.fetchingData = true
  state.dataLink = ''
  state.dataName = ''

  const storageKeys: (keyof Stored)[] = []
  if (state.containers) storageKeys.push('containers')
  if (state.settings) storageKeys.push('settings')
  if (state.nav) storageKeys.push('sidebar')
  if (state.menu) storageKeys.push('contextMenu')
  if (state.hasStyles && state.styles) {
    storageKeys.push('sidebarCSS')
    storageKeys.push('groupCSS')
  }
  if (state.favicons) {
    storageKeys.push('favicons_01')
    storageKeys.push('favicons_02')
    storageKeys.push('favicons_03')
    storageKeys.push('favicons_04')
    storageKeys.push('favicons_05')
    storageKeys.push('favHashes')
    storageKeys.push('favDomains')
  }

  if (!storageKeys.length && !state.snapshots && !state.keybindings) {
    state.fetchingData = false
    return
  }

  const [storageResult, snapshotsResult] = await Promise.allSettled([
    storageKeys.length ? browser.storage.local.get<Stored>(storageKeys) : ({} as Stored),
    state.snapshots ? IPC.bg('getAllSnapshots') : ([] as Snapshot[]),
  ])
  const storage = Utils.settledOr(storageResult, {})
  const snapshots = Utils.settledOr(snapshotsResult, [])
  const backup: BackupData = {}

  if (state.containers && storage.containers) backup.containers = storage.containers
  if (state.settings && storage.settings) backup.settings = storage.settings
  if (state.nav && storage.sidebar) backup.sidebar = storage.sidebar
  if (state.menu && storage.contextMenu) backup.contextMenu = storage.contextMenu
  if (state.hasStyles && state.styles) {
    if (storage.sidebarCSS) backup.sidebarCSS = storage.sidebarCSS
    if (storage.groupCSS) backup.groupCSS = storage.groupCSS
  }
  if (state.snapshots && snapshots) backup.snapshotsV2 = snapshots
  if (state.favicons && storage.favicons_01?.length && storage.favDomains && storage.favHashes) {
    const fullList = storage.favicons_01
    if (storage.favicons_02?.length) fullList.push(...storage.favicons_02)
    if (storage.favicons_03?.length) fullList.push(...storage.favicons_03)
    if (storage.favicons_04?.length) fullList.push(...storage.favicons_04)
    if (storage.favicons_05?.length) fullList.push(...storage.favicons_05)
    backup.favicons = fullList
    backup.favDomains = storage.favDomains
    backup.favHashes = storage.favHashes
  }

  backup.ver = browser.runtime.getManifest().version

  if (state.keybindings) {
    backup.keybindings = {}
    const cmds = (await browser.commands.getAll()) ?? []
    for (const cmd of cmds) {
      if (cmd.name && cmd.shortcut) backup.keybindings[cmd.name] = cmd.shortcut
    }
  }

  let backupJSON = JSON.stringify(backup)
  let file = new Blob([backupJSON], { type: 'application/json' })
  let now = Date.now()
  let date = Utils.uDate(now, '.')
  let time = Utils.uTime(now, '.')

  if (exportDataLink.value) {
    state.dataLink = URL.createObjectURL(file)
    state.dataName = `sidebery-data-${date}-${time}.json`
  }

  state.fetchingData = false
  if (fetchingDataCb) {
    fetchingDataCb()
    fetchingDataCb = undefined
  }
}

async function genExportDataDebounced() {
  if (state.fetchingData) {
    if (!fetchingDataCb) await new Promise<void>(ok => (fetchingDataCb = ok))
    else return
  }
  genExportData()
}
</script>
