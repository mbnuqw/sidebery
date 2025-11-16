<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2.title {{translate('settings.export_title')}}

  ToggleField(label="settings.backup_all" :value="allSelected" @update:value="onAllChanged")
  ToggleField(label="settings.backup_settings" v-model:value="state.settings")
  ToggleField(label="settings.backup_menu" v-model:value="state.menu")
  ToggleField(label="settings.backup_containers" v-model:value="state.containers")
  ToggleField(label="settings.backup_nav" v-model:value="state.nav")
  ToggleField(v-if="state.hasStyles" label="settings.backup_styles" v-model:value="state.styles")
  ToggleField(label="settings.backup_snapshots" v-model:value="state.snapshots")
  ToggleField(label="settings.backup_favicons" v-model:value="state.favicons")
  ToggleField(label="settings.backup_kb" v-model:value="state.keybindings")

  .ctrls
    a.btn(ref="exportDataLink" @mouseenter="genExportData") {{translate('settings.help_exp_data')}}
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { BackupData, Stored } from 'src/types'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Styles } from 'src/services/styles'
import ToggleField from '../../components/toggle-field.vue'
import * as Logs from 'src/services/logs'

const rootEl = ref<HTMLElement | null>(null)
const exportDataLink = ref<HTMLAnchorElement | null>(null)

const state = reactive({
  settings: true,
  menu: true,
  containers: true,
  nav: true,
  hasStyles: false,
  styles: true,
  snapshots: true,
  favicons: true,
  keybindings: true,
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
  } else {
    state.settings = true
    state.menu = true
    state.containers = true
    state.nav = true
    if (state.hasStyles) state.styles = true
    state.snapshots = true
    state.favicons = true
    state.keybindings = true
  }
}

function onWheel(e: WheelEvent): void {
  if (!rootEl.value) return
  let scrollOffset = rootEl.value.scrollTop
  let maxScrollOffset = rootEl.value.scrollHeight - rootEl.value.offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

async function genExportData(): Promise<void> {
  const storageKeys: (keyof Stored)[] = []
  if (state.containers) storageKeys.push('containers')
  if (state.settings) storageKeys.push('settings')
  if (state.nav) storageKeys.push('sidebar')
  if (state.menu) storageKeys.push('contextMenu')
  if (state.hasStyles && state.styles) {
    storageKeys.push('sidebarCSS')
    storageKeys.push('groupCSS')
  }
  if (state.snapshots) {
    storageKeys.push('snapshots')
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

  let data
  const backup: BackupData = {}
  try {
    data = await browser.storage.local.get<Stored>(storageKeys)
  } catch (err) {
    return Logs.err('genExportData: Cannot get storage data', err)
  }

  if (state.containers && data.containers) backup.containers = data.containers
  if (state.settings && data.settings) backup.settings = data.settings
  if (state.nav && data.sidebar) backup.sidebar = data.sidebar
  if (state.menu && data.contextMenu) backup.contextMenu = data.contextMenu
  if (state.hasStyles && state.styles) {
    if (data.sidebarCSS) backup.sidebarCSS = data.sidebarCSS
    if (data.groupCSS) backup.groupCSS = data.groupCSS
  }
  if (state.snapshots && data.snapshots) backup.snapshots = data.snapshots
  if (state.favicons && data.favicons_01?.length && data.favDomains && data.favHashes) {
    const fullList = data.favicons_01
    if (data.favicons_02?.length) fullList.push(...data.favicons_02)
    if (data.favicons_03?.length) fullList.push(...data.favicons_03)
    if (data.favicons_04?.length) fullList.push(...data.favicons_04)
    if (data.favicons_05?.length) fullList.push(...data.favicons_05)
    backup.favicons = fullList
    backup.favDomains = data.favDomains
    backup.favHashes = data.favHashes
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
    exportDataLink.value.href = URL.createObjectURL(file)
    exportDataLink.value.download = `sidebery-data-${date}-${time}.json`
    exportDataLink.value.title = `sidebery-data-${date}-${time}.json`
  }
}
</script>
