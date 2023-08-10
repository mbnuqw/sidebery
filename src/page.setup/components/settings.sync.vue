<template lang="pug">
section(ref="el")
  h2
    span {{translate('settings.sync_title')}}
    .title-note   (~{{state.syncedOveral}} / 100 kb)
  span.header-shadow
  TextField(
    label="settings.sync_name"
    :or="translate('settings.sync_name_or')"
    v-model:value="Settings.state.syncName"
    @update:value="onSyncNameUpdated")
  ToggleField(
    label="settings.sync_save_settings"
    v-model:value="Settings.state.syncSaveSettings"
    @update:value="saveSyncSettings()")
  ToggleField(
    label="settings.sync_save_ctx_menu"
    v-model:value="Settings.state.syncSaveCtxMenu"
    @update:value="saveSyncCtxMenu()")
  ToggleField(
    label="settings.sync_save_styles"
    v-model:value="Settings.state.syncSaveStyles"
    @update:value="saveSyncStyles()")
  ToggleField(
    label="settings.sync_save_kb"
    v-model:value="Settings.state.syncSaveKeybindings"
    @update:value="saveSyncKb()")
  .sync-data(v-if="state.syncedSettings")
    .sync-title {{translate('settings.sync_settings_title')}}
    table.sync-list
      tr.sync-item(v-for="item in state.syncedSettings" :title="item.tooltip" :data-same-profile="item.sameProfile")
        td.sync-name {{item.name || item.profileId}}
        td.sync-info {{item.timeYYYYMMDD}}
        td.sync-info {{item.timeHHMM}}
        td.sync-info {{item.size}} / 8 kb
        td.sync-btns
          .btn.sync-btn(@click.stop="applySyncData(item)") {{translate('settings.sync_apply_btn')}}
          .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{translate('settings.sync_delete_btn')}}
  .sync-data(v-if="state.syncedCtxMenu")
    .sync-title {{translate('settings.sync_ctx_menu_title')}}
    table.sync-list
      tr.sync-item(v-for="item in state.syncedCtxMenu" :title="item.tooltip" :data-same-profile="item.sameProfile")
        td.sync-name {{item.name || item.profileId}}
        td.sync-info {{item.timeYYYYMMDD}}
        td.sync-info {{item.timeHHMM}}
        td.sync-info {{item.size}} / 8kb
        td.sync-btns
          .btn.sync-btn(@click.stop="applySyncData(item)") {{translate('settings.sync_apply_btn')}}
          .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{translate('settings.sync_delete_btn')}}
  .sync-data(v-if="state.syncedStyles")
    .sync-title {{translate('settings.sync_styles_title')}}
    table.sync-list
      tr.sync-item(v-for="item in state.syncedStyles" :title="item.tooltip" :data-same-profile="item.sameProfile")
        td.sync-name {{item.name || item.profileId}}
        td.sync-info {{item.timeYYYYMMDD}}
        td.sync-info {{item.timeHHMM}}
        td.sync-info {{item.size}} / 8kb
        td.sync-btns
          .btn.sync-btn(@click.stop="applySyncData(item)") {{translate('settings.sync_apply_btn')}}
          .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{translate('settings.sync_delete_btn')}}
  .sync-data(v-if="state.syncedKeybindings")
    .sync-title {{translate('settings.sync_kb_title')}}
    table.sync-list
      tr.sync-item(v-for="item in state.syncedKeybindings" :title="item.tooltip" :data-same-profile="item.sameProfile")
        td.sync-name {{item.name || item.profileId}}
        td.sync-info {{item.timeYYYYMMDD}}
        td.sync-info {{item.timeHHMM}}
        td.sync-info {{item.size}} / 8kb
        td.sync-btns
          .btn.sync-btn(@click.stop="applySyncData(item)") {{translate('settings.sync_apply_btn')}}
          .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{translate('settings.sync_delete_btn')}}
  .note-field
    .label {{translate('settings.sync_notes_title')}}
    .note {{translate('settings.sync_notes')}}
  .ctrls
    .btn(@click="loadSyncedData") {{translate('settings.sync_update_btn')}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { StoredSync, StoredSyncValue } from 'src/types'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'
import { Menu } from 'src/services/menu'
import { Store } from 'src/services/storage'
import { Info } from 'src/services/info'
import { SetupPage } from 'src/services/setup-page'
import TextField from '../../components/text-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Logs from 'src/services/logs'
import { Keybindings } from 'src/services/keybindings'

interface SyncInfo extends StoredSyncValue {
  id?: string
  profileId?: string
  timeYYYYMMDD?: string
  timeHHMM?: string
  size?: string
  tooltip?: string
  sameProfile?: boolean
}

const el = ref<HTMLElement | null>(null)
const state = reactive({
  syncedOveral: '-',
  syncedSettings: null as SyncInfo[] | null,
  syncedCtxMenu: null as SyncInfo[] | null,
  syncedStyles: null as SyncInfo[] | null,
  syncedKeybindings: null as SyncInfo[] | null,
})

onMounted(() => {
  SetupPage.registerEl('settings_sync', el.value)
  loadSyncedData()
})

/**
 * Load current sync storage content
 */
async function loadSyncedData(): Promise<void> {
  let [syncStorage, profileId] = await Promise.all([
    browser.storage.sync.get<StoredSync>(),
    Info.getProfileId(),
  ])
  let toRemove = []
  let data: Record<string, SyncInfo[]> = {}

  state.syncedOveral = Utils.strSize(JSON.stringify(syncStorage))

  for (const syncKey of Object.keys(syncStorage)) {
    const syncData = syncStorage[syncKey] as SyncInfo
    const [syncProfileId, syncPropName] = syncKey.split('::')

    if (!syncData || !syncProfileId || !syncPropName) {
      toRemove.push(syncKey)
      continue
    }

    syncData.id = syncKey
    syncData.profileId = syncProfileId
    syncData.tooltip = getSyncDataTooltipString(syncData, syncProfileId)
    syncData.timeYYYYMMDD = Utils.uDate(syncData.time)
    syncData.timeHHMM = Utils.uTime(syncData.time, ':', false)
    syncData.size = Utils.strSize(JSON.stringify(syncData))
    syncData.sameProfile = profileId === syncProfileId

    if (!data[syncPropName]) data[syncPropName] = []
    data[syncPropName].push(syncData)
  }

  // Sort
  if (data.settings) data.settings.sort((a, b) => b.time - a.time)
  if (data.ctxMenu) data.ctxMenu.sort((a, b) => b.time - a.time)
  if (data.styles) data.styles.sort((a, b) => b.time - a.time)

  if (data.settings) state.syncedSettings = data.settings
  else state.syncedSettings = null
  if (data.ctxMenu) state.syncedCtxMenu = data.ctxMenu
  else state.syncedCtxMenu = null
  if (data.styles) state.syncedStyles = data.styles
  else state.syncedStyles = null
  if (data.kb) state.syncedKeybindings = data.kb
  else state.syncedKeybindings = null

  if (toRemove.length) {
    browser.storage.sync.remove(toRemove)
  }
}

function getSyncDataTooltipString(info: StoredSyncValue, profileId: string): string {
  let name = info.name || profileId
  let date = Utils.uDate(info.time)
  let time = Utils.uTime(info.time)
  let dataJSON = JSON.stringify(info)

  return `${name} - ${date} - ${time} - ${Utils.strSize(dataJSON)}`
}

/**
 * Update local storage with synced data and reload that data
 */
async function applySyncData(info: StoredSyncValue): Promise<void> {
  if (!window.confirm(translate('settings.sync_apply_confirm'))) return

  const syncMajorVer = Info.getMajVer(info.ver)
  const currentMajorVer = Info.majorVersion
  let data = Utils.cloneObject(info.value)

  // Upgrade data
  if (!syncMajorVer || syncMajorVer !== currentMajorVer) {
    const old = data
    data = {}

    // Upgrade settings
    if (old.settings) {
      try {
        data.settings = Utils.recreateNormalizedObject(old.settings, DEFAULT_SETTINGS)
        data.settings.theme = 'proton'
        if (data.settings.tabDoubleClick !== 'none') {
          data.settings.tabsSecondClickActPrev = false
        }
        if (old.settings.hScrollThroughPanels === true) {
          data.settings.hScrollAction = 'switch_panels'
        } else if (old.settings.hScrollThroughPanels === false) {
          data.settings.hScrollAction = 'none'
        }
        if ((old.settings.moveNewTabPin as string) === 'none') {
          data.settings.moveNewTabPin = 'start'
        }
      } catch (err) {
        Logs.err('Cannot upgrade legacy settings', err)
        return window.alert(translate('settings.sync.apply_err'))
      }
    }

    // Upgrade menu
    // if (old.tabsMenu || old.tabsPanelMenu || old.bookmarksMenu || old.bookmarksPanelMenu) {
    //   try {
    //     data.contextMenu = {}
    //     if (old.tabsMenu?.length) {
    //       data.contextMenu.tabs = Menu.upgradeMenuConf(old.tabsMenu)
    //     }
    //     if (old.tabsPanelMenu?.length) {
    //       data.contextMenu.tabsPanel = Menu.upgradeMenuConf(old.tabsPanelMenu)
    //     }
    //     if (old.bookmarksMenu?.length) {
    //       data.contextMenu.bookmarks = Menu.upgradeMenuConf(old.bookmarksMenu)
    //     }
    //     if (old.bookmarksPanelMenu?.length) {
    //       data.contextMenu.bookmarksPanel = Menu.upgradeMenuConf(old.bookmarksPanelMenu)
    //     }
    //   } catch (err) {
    //     Logs.err('Cannot upgrade legacy menu', err)
    //     return window.alert(translate('settings.sync.apply_err'))
    //   }
    // }

    // Upgrade styles
    if (old.sidebarCSS || old.groupCSS || old.cssVars) {
      try {
        Styles.upgradeCustomStyles(old, data)
      } catch (err) {
        Logs.err('Cannot upgrade legacy styles', err)
        return window.alert(translate('settings.sync.apply_err'))
      }
    }
  }

  // Update settings
  if (data.settings) {
    // Keep sync settings
    data.settings.syncName = Settings.state.syncName
    data.settings.syncSaveSettings = Settings.state.syncSaveSettings
    data.settings.syncSaveCtxMenu = Settings.state.syncSaveCtxMenu
    data.settings.syncSaveStyles = Settings.state.syncSaveStyles
    data.settings.syncSaveKeybindings = Settings.state.syncSaveKeybindings

    await Store.set({ settings: data.settings })
    Settings.loadSettings()
  }

  // Update context menu
  if (data.contextMenu) {
    await Store.set({ contextMenu: data.contextMenu })
    Menu.loadCtxMenu()
  }

  // Update styles
  if (data.sidebarCSS || data.groupCSS) {
    await Store.set({
      sidebarCSS: data.sidebarCSS,
      groupCSS: data.groupCSS,
    })
  }

  // Update keybindings
  if (data.keybindings) {
    let waiting = []
    for (const name of Object.keys(data.keybindings)) {
      const shortcut = data.keybindings[name]
      if (!name || !shortcut) continue

      const toRm = Keybindings.reactive.list.find(c => c.shortcut === shortcut)
      if (toRm?.name) waiting.push(browser.commands.update({ name: toRm.name, shortcut: '' }))

      waiting.push(browser.commands.update({ name, shortcut }))
    }

    await Promise.allSettled(waiting)
    Keybindings.loadKeybindings()
  }
}

async function deleteSyncData(key?: string): Promise<void> {
  if (!key) return
  await browser.storage.sync.remove(key)
  loadSyncedData()
}

function saveSyncSettings(): void {
  if (!Settings.state.syncSaveSettings) Store.sync('settings', {})
  Settings.saveDebounced(150)
}

function saveSyncCtxMenu(): void {
  if (Settings.state.syncSaveCtxMenu) Menu.saveCtxMenuToSync()
  else Store.sync('ctxMenu', {})
  Settings.saveDebounced(150)
}

async function saveSyncStyles(): Promise<void> {
  if (!Settings.state.syncSaveStyles) return Store.sync('styles', {})

  let [sidebarCSS, groupCSS] = await Promise.all([
    Styles.getCustomCSS('sidebar'),
    Styles.getCustomCSS('group'),
  ])

  if (sidebarCSS) Styles.sidebarCSS = sidebarCSS
  if (groupCSS) Styles.groupCSS = groupCSS

  Styles.saveStylesToSync()

  Settings.saveDebounced(150)
}

function saveSyncKb(): void {
  if (!Settings.state.syncSaveKeybindings) Store.sync('kb', {})
  else Keybindings.saveKeybindingsToSync()

  Settings.saveDebounced(150)
}

let onSyncNameUpdatedTimeout: number | undefined
function onSyncNameUpdated(): void {
  clearTimeout(onSyncNameUpdatedTimeout)
  onSyncNameUpdatedTimeout = setTimeout(() => {
    if (Settings.state.syncSaveCtxMenu) saveSyncCtxMenu()
    if (Settings.state.syncSaveStyles) saveSyncStyles()
    if (Settings.state.syncSaveKeybindings) saveSyncKb()
  }, 500)
  Settings.saveDebounced(500)
}
</script>
