<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2.title {{translate('settings.import_title')}}

  ToggleField(label="settings.backup_all" :value="allSelected" @update:value="onAllChanged")
  ToggleField(
    label="settings.backup_settings"
    v-model:value="state.settings"
    :data-done="state.settingsDone"
    :inactive="settingsInactive || !!state.errorMsg"
    @update:value="checkPermissions")
    .error-note(v-if="state.settingsError") {{state.settingsError}}
  ToggleField(
    label="settings.backup_menu"
    v-model:value="state.menu"
    :data-done="state.menuDone"
    :inactive="menuInactive || !!state.errorMsg")
    .error-note(v-if="state.menuError") {{state.menuError}}
  ToggleField(
    label="settings.backup_containers"
    v-model:value="state.containers"
    :data-done="state.containersDone"
    :inactive="containersInactive || !!state.errorMsg"
    @update:value="checkPermissions")
    .error-note(v-if="state.containersError") {{state.containersError}}
  ToggleField(
    label="settings.backup_nav"
    v-model:value="state.nav"
    :data-done="state.navDone"
    :inactive="navInactive || !!state.errorMsg"
    @update:value="checkPermissions")
    .error-note(v-if="state.navError") {{state.navError}}
  ToggleField(
    label="settings.backup_styles"
    v-model:value="state.styles"
    :data-done="state.stylesDone"
    :inactive="stylesInactive || !!state.errorMsg")
    .error-note(v-if="state.stylesError") {{state.stylesError}}
  ToggleField(
    label="settings.backup_snapshots"
    v-model:value="state.snapshots"
    :data-done="state.snapshotsDone"
    :inactive="snapshotsInactive || !!state.errorMsg")
    .error-note(v-if="state.snapshotsError") {{state.snapshotsError}}
  ToggleField(
    label="settings.backup_favicons"
    v-model:value="state.favicons"
    :data-done="state.faviconsDone"
    :inactive="faviconsInactive || !!state.errorMsg")
    .error-note(v-if="state.faviconsError") {{state.faviconsError}}
  ToggleField(
    label="settings.backup_kb"
    v-model:value="state.keybindings"
    :data-done="state.keybindingsDone"
    :inactive="keybindingsInactive || !!state.errorMsg")
    .error-note(v-if="state.keybindingsError") {{state.keybindingsError}}

  .error-msg(v-if="state.errorMsg") {{state.errorMsg}}

  .ctrls(v-if="!state.errorMsg" :data-inactive="importInactive")
    a.btn(v-if="state.permNeeded" @click="requestPermissions") {{translate('settings.help_imp_perm')}}
    a.btn(
      v-else
      :class="{ '-inactive': state.importing || state.imported, '-progress': state.importing }"
      @click="importData") {{translate('settings.help_imp_data')}}
    LoadingDots(v-if="state.importing")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, PropType } from 'vue'
import * as Utils from 'src/utils'
import { BackupData, Stored, Snapshot } from 'src/types'
import { translate } from 'src/dict'
import { DEFAULT_CONTAINER } from 'src/defaults'
import { Info } from 'src/services/info'
import { Store } from 'src/services/storage'
import { Permissions } from 'src/services/permissions'
import * as Logs from 'src/services/logs'
import * as Favicons from 'src/services/favicons.fg'
import { Menu } from 'src/services/menu'
import { Styles } from 'src/services/styles'
import { Snapshots } from 'src/services/snapshots'
import ToggleField from 'src/components/toggle-field.vue'
import LoadingDots from 'src/components/loading-dots.vue'
import { NormalizedSnapshot } from 'src/types/snapshots'
import { Containers } from 'src/services/containers'
import { Keybindings } from 'src/services/keybindings'
import { Settings } from 'src/services/settings'
import { IPC, SidebarConfig, Sync, SetupPage } from 'src/services/_services'

const props = defineProps({
  importedData: {
    type: Object as PropType<BackupData>,
    default: (): BackupData => ({}),
  },
})

const rootEl = ref<HTMLElement | null>(null)
const state = reactive({
  errorMsg: '',

  settings: false,
  settingsError: '',
  settingsDone: false,
  nav: false,
  navError: '',
  navDone: false,
  menu: false,
  menuError: '',
  menuDone: false,
  styles: false,
  stylesError: '',
  stylesDone: false,
  containers: false,
  containersError: '',
  containersDone: false,
  snapshots: false,
  snapshotsError: '',
  snapshotsDone: false,
  favicons: false,
  faviconsError: '',
  faviconsDone: false,
  keybindings: false,
  keybindingsError: '',
  keybindingsDone: false,

  permNeeded: false,

  importing: false,
  imported: false,
})

let permWebData = false
let permTabHide = false
let permDownloads = false

const allSelected = computed<boolean>(() => {
  const all =
    (settingsInactive.value || state.settings) &&
    (navInactive.value || state.nav) &&
    (menuInactive.value || state.menu) &&
    (stylesInactive.value || state.styles) &&
    (containersInactive.value || state.containers) &&
    (snapshotsInactive.value || state.snapshots) &&
    (faviconsInactive.value || state.favicons) &&
    (keybindingsInactive.value || state.keybindings)
  return all
})
const settingsInactive = computed((): boolean => {
  const data = props.importedData
  return !data.settings
})
const navInactive = computed((): boolean => {
  const data = props.importedData
  return !data.sidebar
})
const menuInactive = computed((): boolean => {
  const data = props.importedData
  return !data.contextMenu
})
const stylesInactive = computed((): boolean => {
  const data = props.importedData
  return !data.sidebarCSS && !data.groupCSS
})
const containersInactive = computed((): boolean => {
  const data = props.importedData
  const cKeysLen = data.containers ? Object.keys(data.containers).length : 0
  return !cKeysLen
})
const snapshotsInactive = computed((): boolean => {
  const data = props.importedData
  return !data.snapshots?.length
})
const faviconsInactive = computed((): boolean => {
  const data = props.importedData
  return !data.favicons || !data.favHashes || !data.favDomains
})
const keybindingsInactive = computed((): boolean => {
  const data = props.importedData
  return !data.keybindings
})
const importInactive = computed((): boolean => {
  return (
    !state.settings &&
    !state.nav &&
    !state.menu &&
    !state.styles &&
    !state.containers &&
    !state.snapshots &&
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
  if (!navInactive.value) state.nav = true
  if (!menuInactive.value) state.menu = true
  if (!stylesInactive.value) state.styles = true
  if (!containersInactive.value) state.containers = true
  if (!snapshotsInactive.value) state.snapshots = true
  if (!faviconsInactive.value) state.favicons = true
  if (!keybindingsInactive.value) state.keybindings = true

  checkPermissions()
})

function onAllChanged(): void {
  if (allSelected.value) {
    if (!settingsInactive.value) state.settings = false
    if (!navInactive.value) state.nav = false
    if (!menuInactive.value) state.menu = false
    if (!stylesInactive.value) state.styles = false
    if (!containersInactive.value) state.containers = false
    if (!snapshotsInactive.value) state.snapshots = false
    if (!faviconsInactive.value) state.favicons = false
    if (!keybindingsInactive.value) state.keybindings = false
  } else {
    if (!settingsInactive.value) state.settings = true
    if (!navInactive.value) state.nav = true
    if (!menuInactive.value) state.menu = true
    if (!stylesInactive.value) state.styles = true
    if (!containersInactive.value) state.containers = true
    if (!snapshotsInactive.value) state.snapshots = true
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
  if (state.importing || state.imported) return

  state.importing = true

  let backup = Utils.cloneObject(props.importedData)
  let containersIds: OldNewIds | undefined
  let noErrors = true

  if (state.settings) {
    try {
      await importSettings(backup)
      state.settingsDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import settings', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.settingsError += 'Cannot import settings' + errStr
      noErrors = false
    }
  }

  if (state.menu) {
    try {
      await importContextMenu(backup)
      state.menuDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import menu settings', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.menuError += 'Cannot import menu settings' + errStr
      noErrors = false
    }
  }

  if (state.containers) {
    try {
      containersIds = await importContainers(backup)
      state.containersDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import containers', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.containersError = 'Cannot import containers' + errStr
      noErrors = false
    }
  }

  if (state.nav) {
    try {
      await importSidebar(backup, containersIds)
      state.navDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import sidebar settings', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.navError += 'Cannot import panels and nav-bar configs' + errStr
      noErrors = false
    }
  }

  if (state.styles) {
    try {
      await importStyles(backup)
      state.stylesDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import styles:', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.stylesError = 'Cannot import styles' + errStr
      noErrors = false
    }
  }

  if (state.snapshots) {
    try {
      await importSnapshots(backup)
      state.snapshotsDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import snapshots:', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.snapshotsError = 'Cannot import snapshots' + errStr
      noErrors = false
    }
  }

  if (state.favicons) {
    try {
      await importFavicons(backup)
      state.faviconsDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import favicons:', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.faviconsError = 'Cannot import favicons' + errStr
      noErrors = false
    }
  }

  if (state.keybindings) {
    try {
      await importKeybindings(backup)
      state.keybindingsDone = true
    } catch (err) {
      Logs.err('Backup import: Cannot import keybindings:', err)
      const errStr = err?.toString ? ':\n' + err.toString() : ''
      state.keybindingsError = 'Cannot import keybindings' + errStr
      noErrors = false
    }
  }

  state.importing = false
  state.imported = true

  await Utils.sleep(640)

  if (noErrors) {
    SetupPage.reactive.importedData = null
  }
}

function checkPermissions(): void {
  const backup = props.importedData
  let webData = false
  let tabsHide = false
  let downloads = false
  permWebData = false
  permTabHide = false
  permDownloads = false
  state.permNeeded = false

  const containers = backup.containers
  if (state.containers && containers) {
    for (let ctr of Object.values(containers)) {
      if (ctr.proxified) webData = true
      if (ctr.reopenRulesActive) webData = true
      if (ctr.userAgentActive) webData = true

      if (webData) break
    }
  }

  if (state.settings && backup.settings) {
    if (backup.settings.hideInact) tabsHide = true
    if (backup.settings.hideFoldedTabs) tabsHide = true
    if (backup.settings.newTabCtxReopen) webData = true
    if (backup.settings.snapAutoExport) downloads = true
  }

  if (webData && !Permissions.reactive.webData) {
    permWebData = true
    state.permNeeded = true
  }
  if (tabsHide && !Permissions.reactive.tabHide) {
    permTabHide = true
    state.permNeeded = true
  }
  if (downloads && !Permissions.reactive.downloads) {
    permDownloads = true
    state.permNeeded = true
  }
}

function requestPermissions(): void {
  const origins = ['<all_urls>']
  const permissions = ['webRequest', 'webRequestBlocking', 'proxy']
  if (permWebData) {
    origins.push('<all_urls>')
    permissions.push('webRequest', 'webRequestBlocking')
  }
  if (permTabHide) permissions.push('tabHide')
  if (permDownloads) permissions.push('downloads')
  if (!origins.length && !permissions.length) return

  browser.permissions.request({ origins, permissions }).then((allowed: boolean) => {
    if (permWebData) permWebData = !allowed
    if (permTabHide) permTabHide = !allowed
    if (permDownloads) permDownloads = !allowed
    state.permNeeded = !allowed
  })
}

type OldNewIds = Record<string, string>
async function importContainers(backup: BackupData): Promise<OldNewIds> {
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

  Containers.updateContainers(storage.containers)
  await Containers.saveContainers()

  return oldNewContainersMap
}

async function importSettings(backup: BackupData) {
  if (!backup.settings) return

  await Settings.importSettings(backup.settings)

  if (backup.settings.syncSaveSettings) {
    await Sync.save(Sync.SyncedEntryType.Settings, backup.settings)
  }
}

async function importSidebar(backup: BackupData, containersIds: OldNewIds = {}) {
  if (!backup.sidebar) return

  await SidebarConfig.loadSidebarConfig()

  const nav = backup.sidebar?.nav ?? []
  const panels = backup.sidebar?.panels ?? {}

  // Preserve old panels
  const oldNav = []
  for (const id of SidebarConfig.reactive.nav) {
    const newIndex = nav.indexOf(id)

    // No such panel
    if (newIndex === -1) {
      const panelConfig = SidebarConfig.reactive.panels[id]
      if (!panelConfig) continue

      panels[id] = panelConfig
      oldNav.push(id)
    }
  }
  if (oldNav.length) nav.unshift(...oldNav)

  for (const id of nav) {
    const panel = panels[id]
    if (Utils.isTabsPanel(panel)) {
      // Update recreated contianers ids or 'none' (if containers is not imported)
      panel.newTabCtx = containersIds[panel.newTabCtx] ?? 'none'

      // Update container ids in moveRules
      if (!panel.moveRules) panel.moveRules = []
      else {
        panel.moveRules = panel.moveRules.map(rule => {
          if (rule.containerId) {
            const newId = containersIds[rule.containerId]
            if (newId) rule.containerId = newId
            else {
              delete rule.containerId
              rule.active = false
            }
          }
          return rule
        })
      }
    }
  }

  SidebarConfig.updateSidebarConfig(backup.sidebar)
  await SidebarConfig.saveSidebarConfig()
}

async function importContextMenu(backup: BackupData) {
  if (!backup.contextMenu) return

  Menu.setCtxMenu(backup.contextMenu)
  await Menu.saveCtxMenu()
}

async function importStyles(backup: BackupData): Promise<void> {
  const storage = await browser.storage.local.get<Stored>(['sidebarCSS', 'groupCSS'])

  let sidebarCSS = ''
  let groupCSS = ''

  if (storage.sidebarCSS) sidebarCSS = `/* OLD STYLES\n${storage.sidebarCSS.trim()}\n*/`
  if (backup.sidebarCSS) sidebarCSS = backup.sidebarCSS + '\n\n' + sidebarCSS
  sidebarCSS = sidebarCSS.trim()

  if (storage.groupCSS) groupCSS = `/* OLD STYLES\n${storage.groupCSS.trim()}\n*/`
  if (backup.groupCSS) groupCSS = backup.groupCSS + '\n\n' + groupCSS
  groupCSS = groupCSS.trim()

  if (sidebarCSS) Styles.sidebarCSS = sidebarCSS.trim()
  if (groupCSS) Styles.groupCSS = groupCSS.trim()

  await Styles.saveCustomCSS()
}

async function importSnapshots(backup: BackupData): Promise<void> {
  if (!backup.snapshots) throw 'No snapshots data'

  let storage
  try {
    storage = await browser.storage.local.get<Stored>('snapshots')
  } catch (err) {
    return Logs.err('importSnapshots: Cannot get stored snapshots', err)
  }
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
      Snapshots.updateInternalUrls(backupNormSnapshot)
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

  await Store.set({ snapshots: allSnapshots })

  // Recalc info in snapshots section
  SetupPage.updStorageInfo('snapshots', allSnapshots)
  SetupPage.snapshotsViewer.refresh?.(allSnapshots)
}

async function importFavicons(backup: BackupData): Promise<void> {
  if (!backup.favicons || !backup.favHashes || !backup.favDomains) throw 'No favicons data'

  let favData
  try {
    favData = await Favicons.loadFaviconsData()
  } catch (err) {
    return Logs.err('importFavicons: Cannot get stored favicons', err)
  }

  let index = favData.favicons.length

  if (index >= Favicons.MAX_COUNT_LIMIT) throw 'importFavicons: Exceeding the limit'

  const oldNewIndexes = new Map<number, number>()

  for (const backupDomain of Object.keys(backup.favDomains)) {
    const backupDomainInfo = backup.favDomains[backupDomain]
    const domainInfo = favData.favDomains[backupDomain]
    if (domainInfo) continue

    const backupIndex = backupDomainInfo.index
    const backupFavicon = backup.favicons[backupIndex]
    const backupHash = backup.favHashes[backupIndex]
    if (!backupFavicon || backupHash === undefined) continue

    const existedIndex = favData.favHashes.indexOf(backupHash)
    const reusedIndex = oldNewIndexes.get(backupIndex)

    // Reuse favicon (from existed data)
    if (existedIndex !== -1) {
      backupDomainInfo.index = existedIndex
      favData.favicons[existedIndex] = backupFavicon
      favData.favHashes[existedIndex] = backupHash
      favData.favDomains[backupDomain] = backupDomainInfo
    }
    // Reuse favicon (from backup data)
    if (reusedIndex !== undefined) {
      backupDomainInfo.index = reusedIndex
      favData.favicons[reusedIndex] = backupFavicon
      favData.favHashes[reusedIndex] = backupHash
      favData.favDomains[backupDomain] = backupDomainInfo
    }
    // Add favicon
    else {
      oldNewIndexes.set(backupIndex, index)
      backupDomainInfo.index = index
      favData.favicons[index] = backupFavicon
      favData.favHashes[index] = backupHash
      favData.favDomains[backupDomain] = backupDomainInfo
      index++
    }
  }

  await Store.set({
    favicons_01: favData.favicons,
    favHashes: favData.favHashes,
    favDomains: favData.favDomains,
  })

  // Reload favicons in all runned instances
  SetupPage.calcStorageInfo()
  Favicons.loadFavicons()
  IPC.broadcast({ action: 'reloadFavicons' })
}

async function importKeybindings(backup: BackupData) {
  if (!backup.keybindings) throw 'No keybindings data'

  await Keybindings.importKeybindings(backup.keybindings)
}
</script>
