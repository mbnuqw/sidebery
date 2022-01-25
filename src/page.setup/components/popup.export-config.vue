<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2.title {{translate('settings.export_title')}}

  ToggleField(label="settings.backup_all" :value="allSelected" @update:value="onAllChanged")
  ToggleField(label="settings.backup_settings" v-model:value="state.settings")
  ToggleField(v-if="state.hasStyles" label="settings.backup_styles" v-model:value="state.styles")
  ToggleField(label="settings.backup_containers" v-model:value="state.containers")
  ToggleField(label="settings.backup_snapshots" v-model:value="state.snapshots")
  ToggleField(label="settings.backup_stats" v-model:value="state.stats")
  ToggleField(label="settings.backup_favicons" v-model:value="state.favicons")
  ToggleField(label="settings.backup_kb" v-model:value="state.keybindings")

  .ctrls
    a.btn(ref="exportDataLink" @mouseenter="genExportData") {{translate('settings.help_exp_data')}}
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { BackupData, Stored } from 'src/types'
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { Styles } from 'src/services/styles'
import ToggleField from '../../components/toggle-field.vue'

const rootEl = ref<HTMLElement | null>(null)
const exportDataLink = ref<HTMLAnchorElement | null>(null)

const state = reactive({
  settings: true,
  hasStyles: false,
  styles: true,
  containers: true,
  snapshots: true,
  stats: true,
  favicons: true,
  keybindings: true,
})

onMounted(async () => {
  state.hasStyles = await Styles.hasCustomCSS()
})

const allSelected = computed<boolean>(() => {
  const all =
    state.settings &&
    (!state.hasStyles || state.styles) &&
    state.containers &&
    state.snapshots &&
    state.stats &&
    state.favicons &&
    state.keybindings
  return all
})

function onAllChanged(): void {
  if (allSelected.value) {
    state.settings = false
    if (state.hasStyles) state.styles = false
    state.containers = false
    state.snapshots = false
    state.stats = false
    state.favicons = false
    state.keybindings = false
  } else {
    state.settings = true
    if (state.hasStyles) state.styles = true
    state.containers = true
    state.snapshots = true
    state.stats = true
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
  if (state.containers) {
    storageKeys.push('containers')
  }
  if (state.settings) {
    storageKeys.push('settings')
    storageKeys.push('sidebar')
    storageKeys.push('contextMenu')
  }
  if (state.hasStyles && state.styles) {
    storageKeys.push('sidebarCSS')
    storageKeys.push('groupCSS')
  }
  if (state.snapshots) {
    storageKeys.push('snapshots')
  }
  if (state.stats) {
    storageKeys.push('stats')
  }
  if (state.favicons) {
    storageKeys.push('favicons')
    storageKeys.push('favHashes')
    storageKeys.push('favDomains')
  }
  if (state.keybindings) {
    storageKeys.push('disabledKeybindings')
  }

  const data = await browser.storage.local.get<Stored>(storageKeys)
  const backup: BackupData = { ...data }
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
