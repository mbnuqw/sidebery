<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2.title {{translate('settings.import_title')}}

  ToggleField(label="settings.backup_all" :value="allSelected" @update:value="onAllChanged")
  ToggleField(
    label="settings.backup_settings"
    v-model:value="state.settings"
    :inactive="settingsInactive || !!state.errorMsg"
    @update:value="checkPermissions")
  ToggleField(
    label="settings.backup_styles"
    v-model:value="state.styles"
    :inactive="stylesInactive || !!state.errorMsg")
  ToggleField(
    label="settings.backup_containers"
    v-model:value="state.containers"
    :inactive="containersInactive || !!state.errorMsg"
    @update:value="checkPermissions")
  ToggleField(
    label="settings.backup_snapshots"
    v-model:value="state.snapshots"
    :inactive="snapshotsInactive || !!state.errorMsg")
  ToggleField(
    label="settings.backup_stats"
    v-model:value="state.stats"
    :inactive="statsInactive || !!state.errorMsg")
  ToggleField(
    label="settings.backup_favicons"
    v-model:value="state.favicons"
    :inactive="faviconsInactive || !!state.errorMsg")
  ToggleField(
    label="settings.backup_kb"
    v-model:value="state.keybindings"
    :inactive="keybindingsInactive || !!state.errorMsg")

  .error-msg(v-if="state.errorMsg") {{state.errorMsg}}

  .ctrls(v-if="!state.errorMsg" :data-inactive="importInactive")
    a.btn(v-if="state.permNeeded" @click="requestPermissions") {{translate('settings.help_imp_perm')}}
    a.btn(v-else @click="importData") {{translate('settings.help_imp_data')}}
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, PropType } from 'vue'
import Utils from 'src/utils'
import { BackupData, Stored, Snapshot, DomainsStats } from 'src/types'
import { translate } from 'src/dict'
import { DEFAULT_CONTAINER, DEFAULT_SETTINGS } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
import { Info } from 'src/services/info'
import { Store } from 'src/services/storage'
import { Permissions } from 'src/services/permissions'
import { Logs } from 'src/services/logs'
import { Menu } from 'src/services/menu'
import { Styles } from 'src/services/styles'
import { Snapshots } from 'src/services/snapshots'
import ToggleField from 'src/components/toggle-field.vue'
import { NormalizedSnapshot } from 'src/types/snapshots'

const props = defineProps({
  importedData: {
    type: Object as PropType<BackupData>,
    default: () => ({} as BackupData),
  },
})

const rootEl = ref<HTMLElement | null>(null)
const state = reactive({
  errorMsg: '',

  settings: false,
  styles: false,
  containers: false,
  snapshots: false,
  stats: false,
  favicons: false,
  keybindings: false,

  permNeeded: false,
})

let permWebData = false
let permTabHide = false

const allSelected = computed<boolean>(() => {
  const all =
    (settingsInactive.value || state.settings) &&
    (stylesInactive.value || state.styles) &&
    (containersInactive.value || state.containers) &&
    (snapshotsInactive.value || state.snapshots) &&
    (statsInactive.value || state.stats) &&
    (faviconsInactive.value || state.favicons) &&
    (keybindingsInactive.value || state.keybindings)
  return all
})
const settingsInactive = computed((): boolean => {
  const data = props.importedData
  return (
    !data.settings &&
    !data.sidebar &&
    !data.contextMenu &&
    !data.panels_v4 &&
    !data.tabsMenu &&
    !data.bookmarksMenu
  )
})
const stylesInactive = computed((): boolean => {
  const data = props.importedData
  return !data.cssVars && !data.sidebarCSS && !data.groupCSS
})
const containersInactive = computed((): boolean => {
  const data = props.importedData
  const cKeysLen = data.containers ? Object.keys(data.containers).length : 0
  const cv4KeysLen = data.containers_v4 ? Object.keys(data.containers_v4).length : 0
  return !cKeysLen && !cv4KeysLen
})
const snapshotsInactive = computed((): boolean => {
  const data = props.importedData
  const sLen = data.snapshots?.length
  const sv4Len = data.snapshots_v4?.length
  return !sLen && !sv4Len
})
const statsInactive = computed((): boolean => {
  return !props.importedData.stats || !props.importedData.stats.length
})
const faviconsInactive = computed((): boolean => {
  const data = props.importedData
  return !data.favicons || !data.favHashes || !data.favDomains
})
const keybindingsInactive = computed((): boolean => {
  const data = props.importedData
  return !data.keybindings || !data.disabledKeybindings
})
const importInactive = computed((): boolean => {
  return (
    !state.settings &&
    !state.styles &&
    !state.containers &&
    !state.snapshots &&
    !state.stats &&
    !state.favicons &&
    !state.keybindings
  )
})

onMounted(() => {
  const backupMajorVer = Info.getMajVer(props.importedData.ver)
  if (backupMajorVer === undefined) {
    state.errorMsg = translate('settings.backup_parse_err')
    Logs.warn('Backup import: Cannot get backup major version')
    return
  }
  if (Info.majorVersion === undefined) {
    Logs.err('Backup import: Cannot get current major version')
    return
  }

  if (!settingsInactive.value) state.settings = true
  if (!stylesInactive.value) state.styles = true
  if (!containersInactive.value) state.containers = true
  if (!snapshotsInactive.value) state.snapshots = true
  if (!statsInactive.value) state.stats = true
  if (!faviconsInactive.value) state.favicons = true
  if (!keybindingsInactive.value) state.keybindings = true

  checkPermissions()
})

function onAllChanged(): void {
  if (allSelected.value) {
    if (!settingsInactive.value) state.settings = false
    if (!stylesInactive.value) state.styles = false
    if (!containersInactive.value) state.containers = false
    if (!snapshotsInactive.value) state.snapshots = false
    if (!statsInactive.value) state.stats = false
    if (!faviconsInactive.value) state.favicons = false
    if (!keybindingsInactive.value) state.keybindings = false
  } else {
    if (!settingsInactive.value) state.settings = true
    if (!stylesInactive.value) state.styles = true
    if (!containersInactive.value) state.containers = true
    if (!snapshotsInactive.value) state.snapshots = true
    if (!statsInactive.value) state.stats = true
    if (!faviconsInactive.value) state.favicons = true
    if (!keybindingsInactive.value) state.keybindings = true
  }
}

function onWheel(e: WheelEvent): void {
  if (!rootEl.value) return
  let scrollOffset = rootEl.value.scrollTop
  let maxScrollOffset = rootEl.value.scrollHeight - rootEl.value.offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

async function importData(): Promise<void> {
  let backup = Utils.cloneObject(props.importedData)
  let toStore: Stored = {}
  let atLeastOne = false
  let containersIds: OldNewIds | undefined

  if (state.containers) {
    try {
      containersIds = await importContainers(backup, toStore)
      atLeastOne = true
    } catch (err) {
      return Logs.err('Backup import: Cannot import containers', err)
    }
  }

  if (state.settings) {
    try {
      importSettings(backup, toStore)
      importSidebar(backup, toStore, containersIds)
      importContextMenu(backup, toStore)
    } catch (err) {
      return Logs.err('Backup import: Cannot import settings:', err)
    }
    atLeastOne = true
  }

  if (state.styles) {
    await importStyles(backup, toStore)
    atLeastOne = true
  }

  if (state.snapshots) {
    try {
      await importSnapshots(backup, toStore)
    } catch (err) {
      return Logs.err('Backup import: Cannot import snapshots:', err)
    }
    atLeastOne = true
  }

  if (state.stats) {
    try {
      await importStats(backup, toStore)
    } catch (err) {
      return Logs.err('Backup import: Cannot import statistics:', err)
    }
    atLeastOne = true
  }

  if (state.favicons) {
    try {
      await importFavicons(backup, toStore)
    } catch (err) {
      return Logs.err('Backup import: Cannot import favicons:', err)
    }
    atLeastOne = true
  }

  if (state.keybindings) {
    try {
      importKeybindings(backup, toStore)
    } catch (err) {
      return Logs.err('Backup import: Cannot import keybindings:', err)
    }
    atLeastOne = true
  }

  if (!atLeastOne) return

  await Store.set(toStore)
  browser.runtime.reload()
}

function checkPermissions(): void {
  const backup = props.importedData
  let webData = false
  let tabsHide = false
  permWebData = false
  permTabHide = false
  state.permNeeded = false

  const containers = backup.containers ?? backup.containers_v4
  if (state.containers && containers) {
    for (let ctr of Object.values(containers)) {
      if (ctr.proxified) webData = true
      if (ctr.includeHostsActive) webData = true
      if (ctr.excludeHostsActive) webData = true
      if (ctr.userAgentActive) webData = true
    }
  }

  if (state.settings && backup.settings) {
    if (backup.settings.hideInact) tabsHide = true
    if (backup.settings.hideFoldedTabs) tabsHide = true
  }

  if (webData && !Permissions.reactive.webData) {
    permWebData = true
    state.permNeeded = true
  }
  if (tabsHide && !Permissions.reactive.tabHide) {
    permTabHide = true
    state.permNeeded = true
  }
}

function requestPermissions(): void {
  const request = { origins: [] as string[], permissions: [] as string[] }
  if (permWebData) {
    request.origins.push('<all_urls>')
    request.permissions.push('webRequest', 'webRequestBlocking')
  }
  if (permTabHide) request.permissions.push('tabHide')

  browser.permissions.request(request).then((allowed: boolean) => {
    browser.runtime.sendMessage({ action: 'loadPermissions' })
    if (permWebData) permWebData = !allowed
    if (permTabHide) permTabHide = !allowed
    state.permNeeded = !allowed
  })
}

type OldNewIds = Record<string, string>
async function importContainers(backup: BackupData, toStore: Stored): Promise<OldNewIds> {
  if (backup.containers_v4) backup.containers = backup.containers_v4
  if (!backup.containers) throw 'No containers data'

  let ffContainers = await browser.contextualIdentities.query({})
  let storage = await browser.storage.local.get<Stored>({ containers: {} })
  if (!storage.containers) storage.containers = {}

  const oldNewContainersMap: OldNewIds = {}

  for (let ctr of Object.values(Utils.cloneObject(backup.containers))) {
    let ffCtr = ffContainers.find(c => {
      return c.name === ctr.name && c.icon === ctr.icon && c.color === ctr.color
    })

    ctr = Utils.recreateNormalizedObject(ctr, DEFAULT_CONTAINER)

    if (!ffCtr) {
      ffCtr = await browser.contextualIdentities.create({
        name: ctr.name,
        color: ctr.color,
        icon: ctr.icon,
      })
    }
    if (!ffCtr) continue

    oldNewContainersMap[ctr.id] = ffCtr.cookieStoreId
    ctr.id = ffCtr.cookieStoreId
    storage.containers[ctr.id] = ctr
  }

  toStore.containers = storage.containers

  return oldNewContainersMap
}

function importSettings(backup: BackupData, toStore: Stored): void {
  if (!backup.settings) throw 'No settings data'
  toStore.settings = Utils.recreateNormalizedObject(backup.settings, DEFAULT_SETTINGS)
}

function importSidebar(backup: BackupData, toStore: Stored, containersIds: OldNewIds = {}): void {
  if (backup.panels_v4 && !backup.sidebar) {
    backup.sidebar = Sidebar.convertOldPanelsConfigToNew(backup.panels_v4)
  }
  if (!backup.sidebar) throw 'No nav/panels config'

  const nav = backup.sidebar?.nav ?? []
  const panels = backup.sidebar?.panels ?? {}

  for (const id of nav) {
    const panel = panels[id]
    if (Utils.isTabsPanel(panel)) {
      // Set recreated contianers ids or 'none' (if containers is not imported)
      panel.newTabCtx = containersIds[panel.newTabCtx] ?? 'none'
      panel.moveTabCtx = containersIds[panel.moveTabCtx] ?? 'none'
    }
  }

  toStore.sidebar = backup.sidebar
}

function importContextMenu(backup: BackupData, toStore: Stored): void {
  if (!backup.contextMenu?.tabs && backup.tabsMenu) {
    if (!backup.contextMenu) backup.contextMenu = {}
    backup.contextMenu.tabs = Menu.upgradeMenuConf(backup.tabsMenu)
  }
  if (!backup.contextMenu?.bookmarks && backup.bookmarksMenu) {
    if (!backup.contextMenu) backup.contextMenu = {}
    backup.contextMenu.bookmarks = Menu.upgradeMenuConf(backup.bookmarksMenu)
  }

  if (!backup.contextMenu) throw 'No context menu data'

  toStore.contextMenu = backup.contextMenu
}

async function importStyles(backup: BackupData, toStore: Stored): Promise<void> {
  const storage = await browser.storage.local.get<Stored>(['sidebarCSS', 'groupCSS'])

  let sidebarCSS = ''
  let groupCSS = ''

  if (storage.sidebarCSS) sidebarCSS = `/* OLD STYLES\n${storage.sidebarCSS}\n*/`
  if (backup.sidebarCSS) sidebarCSS = backup.sidebarCSS + '\n\n' + sidebarCSS
  sidebarCSS = sidebarCSS.trim()

  if (storage.groupCSS) groupCSS = `/* OLD STYLES\n${storage.groupCSS}\n*/`
  if (backup.groupCSS) groupCSS = backup.groupCSS + '\n\n' + groupCSS
  groupCSS = groupCSS.trim()

  if (backup.cssVars) {
    const varsCSS = Styles.convertVarsToCSS(backup.cssVars)
    if (varsCSS) {
      sidebarCSS = varsCSS + '\n\n' + sidebarCSS
      groupCSS = varsCSS + '\n\n' + groupCSS
    }
  }

  if (sidebarCSS) toStore.sidebarCSS = sidebarCSS.trim()
  if (groupCSS) toStore.groupCSS = groupCSS.trim()
}

async function importSnapshots(backup: BackupData, toStore: Stored): Promise<void> {
  if (!backup.snapshots && backup.snapshots_v4) {
    backup.snapshots = Snapshots.convertFromV4(backup.snapshots_v4)
  }

  if (!backup.snapshots) throw 'No snapshots data'

  const storage = await browser.storage.local.get<Stored>('snapshots')
  if (!storage.snapshots) storage.snapshots = []

  // Normalize snapshots from backup
  const backupSnapshots: NormalizedSnapshot[] = []
  for (let i = 0; i < backup.snapshots.length; i++) {
    const backupSnapshot = backup.snapshots[i]
    const storedSnapshot = storage.snapshots.find(s => s.id === backupSnapshot.id)
    // Skip dups
    if (storedSnapshot) continue

    const backupNormSnapshot = Snapshots.getNormalizedSnapshot(backup.snapshots, i)
    if (backupNormSnapshot) {
      Snapshots.updateV4GroupUrls(backupNormSnapshot)
      backupSnapshots.push(backupNormSnapshot)
    }
  }

  // Nothing to do...
  if (!backupSnapshots.length) return

  // Normalize stored snapshots
  const storedSnapshots: NormalizedSnapshot[] = []
  for (let i = 0; i < storage.snapshots.length; i++) {
    const storedNormSnapshot = Snapshots.getNormalizedSnapshot(storage.snapshots, i)
    if (storedNormSnapshot) storedSnapshots.push(storedNormSnapshot)
  }

  // Concat stored and backuped
  const allNormSnapshots = storedSnapshots.concat(backupSnapshots)

  // Sort by date
  allNormSnapshots.sort((a, b) => a.time - b.time)

  // Minimize snapshots
  const allSnapshots: Snapshot[] = []
  for (let i = 0; i < allNormSnapshots.length; i++) {
    const normSnapshot = allNormSnapshots[i]
    Snapshots.minimizeSnapshot(allSnapshots, normSnapshot)
    allSnapshots.push(normSnapshot)
  }

  toStore.snapshots = allSnapshots
}

async function importStats(backup: BackupData, toStore: Stored): Promise<void> {
  if (!backup.stats) throw 'No statistics'

  const storage = await browser.storage.local.get<Stored>('stats')
  if (!storage.stats) storage.stats = []

  const filteredStoredStats: DomainsStats[] = []
  for (const storedStat of storage.stats) {
    const storedDomains = Object.keys(storedStat.domains)
    if (!storedDomains.length) continue

    const backupStat = backup.stats.find(s => s.date === storedStat.date)
    if (!backupStat) filteredStoredStats.push(storedStat)
  }

  toStore.stats = backup.stats.concat(filteredStoredStats)
  toStore.stats.sort((a, b) => a.date - b.date)
}

async function importFavicons(backup: BackupData, toStore: Stored): Promise<void> {
  if (!backup.favicons || !backup.favHashes || !backup.favDomains) throw 'No favicons data'

  const storage = await browser.storage.local.get<Stored>(['favicons', 'favHashes', 'favDomains'])
  if (!storage.favicons?.length || !storage.favHashes?.length || !storage.favDomains) {
    storage.favicons = []
    storage.favHashes = []
    storage.favDomains = {}
  }

  let index = storage.favicons.length

  for (const backupDomain of Object.keys(backup.favDomains)) {
    const backupDomainInfo = backup.favDomains[backupDomain]
    const domainInfo = storage.favDomains[backupDomain]
    if (domainInfo) continue

    const backupIndex = backupDomainInfo.index
    const backupFavicon = backup.favicons[backupIndex]
    const backupHash = backup.favHashes[backupIndex]
    if (!backupFavicon || backupHash === undefined) continue

    backupDomainInfo.index = index
    storage.favicons[index] = backupFavicon
    storage.favHashes[index] = backupHash
    storage.favDomains[backupDomain] = backupDomainInfo
    index++
  }

  toStore.favicons = storage.favicons
  toStore.favHashes = storage.favHashes
  toStore.favDomains = storage.favDomains
}

function importKeybindings(backup: BackupData, toStore: Stored): void {
  if (!backup.keybindings || !backup.disabledKeybindings) throw 'No keybindings data'

  for (const name of Object.keys(backup.keybindings)) {
    const shortcut = backup.keybindings[name]
    browser.commands.update({ name, shortcut })
  }

  toStore.disabledKeybindings = backup.disabledKeybindings
}
</script>
