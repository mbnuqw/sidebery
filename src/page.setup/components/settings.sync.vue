<template lang="pug">
section(ref="el")
  h2
    span {{translate('settings.sync_title')}}
  span.header-shadow
  TextField(
    label="settings.sync_name"
    :or="translate('settings.sync_name_or')"
    v-model:value="Settings.state.syncName"
    dbg="syncName"
    :default="DEFAULT_SETTINGS.syncName"
    @update:value="onSyncNameUpdated")
  ToggleField(
    label="settings.sync_use_ff"
    v-model:value="Settings.state.syncUseFirefox"
    dbg="syncUseFirefox"
    :default="DEFAULT_SETTINGS.syncUseFirefox"
    @update:value="onFFToggle"
    :note="translate('settings.sync_ff_note')")
  ToggleField(
    label="settings.sync_use_gd"
    v-model:value="Settings.state.syncUseGoogleDrive"
    dbg="syncUseGoogleDrive"
    :default="DEFAULT_SETTINGS.syncUseGoogleDrive"
    :loading="gdToggling"
    @update:value="onGDToggle"
    :note="translate('settings.sync_gd_note')")
  .sub-fields
    ToggleField(
      label="settings.sync_gd_api"
      v-model:value="Settings.state.syncUseGoogleDriveApi"
      dbg="syncUseGoogleDriveApi"
      :default="DEFAULT_SETTINGS.syncUseGoogleDriveApi"
      :note="translate('settings.sync_gd_api_note')"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields(v-if="Settings.state.syncUseGoogleDriveApi")
      .note-field
        .inline-box
          .label {{translate('settings.sync_gd_api_proj')}}
          a.link(href="https://developers.google.com/workspace/guides/create-project" target="_blank").
            {{translate('settings.sync_gd_api_link')}}
        .note.-wide {{translate('settings.sync_gd_api_proj_sub')}}
      .note-field
        .inline-box
          .label {{translate('settings.sync_gd_api_drive')}}
          a.link(href="https://console.cloud.google.com/flows/enableapi?apiid=drive.googleapis.com" target="_blank").
            {{translate('settings.sync_gd_api_link')}}
      .note-field
        .inline-box
          .label {{translate('settings.sync_gd_api_cli')}}
          a.link(href="https://console.cloud.google.com/auth/clients" target="_blank").
            {{translate('settings.sync_gd_api_link')}}
        .note.-wide {{translate('settings.sync_gd_api_cli_sub')}}
        code.note.-wide {{Google.getRedirectURI()}}
      .note-field
        .inline-box
          .label {{translate('settings.sync_gd_api_id')}}
          a.link(href="https://console.cloud.google.com/auth/clients" target="_blank").
            {{translate('settings.sync_gd_api_link')}}
      TextField(
        label="settings.sync_gd_api_ins"
        :or="'...'"
        :line="true"
        v-model:value="Settings.state.syncUseGoogleDriveApiClientId"
        dbg="syncUseGoogleDriveApiClientId"
        :default="DEFAULT_SETTINGS.syncUseGoogleDriveApiClientId"
        @update:value="Settings.saveDebounced(500)")
      .note-field
        .inline-box
          .label {{translate('settings.sync_gd_api_scope')}}
          a.link(href="https://console.cloud.google.com/auth/scopes" target="_blank").
            {{translate('settings.sync_gd_api_link')}}
        code.note.-wide https://www.googleapis.com/auth/drive.appdata
      .note-field
        .inline-box
          .label {{translate('settings.sync_gd_api_usr')}}
          a.link(href="https://console.cloud.google.com/auth/audience" target="_blank").
            {{translate('settings.sync_gd_api_link')}}
      .note-field
        .inline-box
          .label {{translate('settings.sync_gd_api_reload')}}
          a.link(href="https://drive.google.com/drive/settings" target="_blank").
            {{translate('settings.sync_gd_api_link')}}
        .note {{translate('settings.sync_gd_api_reload_sub')}}
      .note-field
        .label {{translate('settings.sync_gd_api_done')}}

  ToggleField(
    label="settings.sync_save_settings"
    v-model:value="Settings.state.syncSaveSettings"
    dbg="syncSaveSettings"
    :default="DEFAULT_SETTINGS.syncSaveSettings"
    @update:value="onSettingsToggle()")
  ToggleField(
    label="settings.sync_save_ctx_menu"
    v-model:value="Settings.state.syncSaveCtxMenu"
    dbg="syncSaveCtxMenu"
    :default="DEFAULT_SETTINGS.syncSaveCtxMenu"
    @update:value="onMenuToggle()")
  ToggleField(
    label="settings.sync_save_styles"
    v-model:value="Settings.state.syncSaveStyles"
    dbg="syncSaveStyles"
    :default="DEFAULT_SETTINGS.syncSaveStyles"
    @update:value="onStylesToggle()")
  ToggleField(
    label="settings.sync_save_kb"
    v-model:value="Settings.state.syncSaveKeybindings"
    dbg="syncSaveKeybindings"
    :default="DEFAULT_SETTINGS.syncSaveKeybindings"
    @update:value="onKbToggle()")

  .ctrls
    .btn(@click="openSyncWin") {{translate('settings.sync_view_btn')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as Styles from 'src/services/styles.fg'
import * as Menu from 'src/services/menu.fg'
import * as Sync from 'src/services/sync.fg'
import * as Logs from 'src/services/logs'
import * as Google from 'src/services/google'
import * as SetupPage from 'src/services/setup-page.fg'
import * as Keybindings from 'src/services/keybindings.fg'
import TextField from '../../components/text-field.vue'
import ToggleField from '../../components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)
const gdToggling = ref(false)

onMounted(() => {
  SetupPage.registerEl('settings_sync', el.value)
})

let onSyncNameUpdatedTimeout: number | undefined
let onSyncNameUpdatedGDTimeout: number | undefined
function onSyncNameUpdated(): void {
  Logs.info('onSyncNameUpdated:', Settings.state.syncName)

  // Save settings
  Settings.saveDebounced(500)

  // Update data in Firefox sync storage
  if (Settings.state.syncUseFirefox) {
    clearTimeout(onSyncNameUpdatedTimeout)
    onSyncNameUpdatedTimeout = setTimeout(async () => {
      Sync.Firefox.updateProfileInfo()
    }, 500)
  }

  // Save new profile data to Google Drive
  if (Settings.state.syncUseGoogleDrive) {
    clearTimeout(onSyncNameUpdatedGDTimeout)
    onSyncNameUpdatedGDTimeout = setTimeout(() => {
      Sync.Google.saveProfileInfo()
    }, 1000)
  }
}

async function onFFToggle() {
  Logs.info('onFFToggle:', Settings.state.syncUseFirefox)

  Settings.saveDebounced(150)

  // Save enabled fields of this profile
  if (Settings.state.syncUseFirefox) {
    if (Settings.state.syncSaveCtxMenu) Menu.saveCtxMenuToSync()
    if (Settings.state.syncSaveKeybindings) Keybindings.saveKeybindingsToSync()
    if (Settings.state.syncSaveStyles) {
      await Styles.loadCustomCSS()
      Styles.saveStylesToSync()
    }
  }

  // Remove enabled fields of this profile
  else {
    if (Settings.state.syncSaveSettings) Sync.Firefox.remove('settings')
    if (Settings.state.syncSaveCtxMenu) Sync.Firefox.remove('ctxMenu')
    if (Settings.state.syncSaveKeybindings) Sync.Firefox.remove('kb')
    if (Settings.state.syncSaveStyles) Sync.Firefox.remove('styles')
  }
}

async function onGDToggle() {
  Logs.info('onGDToggle:', Settings.state.syncUseGoogleDrive)

  gdToggling.value = true

  Settings.saveDebounced(150)

  // Save enabled fields of this profile
  if (Settings.state.syncUseGoogleDrive) {
    try {
      // Save profile info
      await Sync.Google.saveProfileInfo()

      if (Settings.state.syncSaveCtxMenu) Menu.saveCtxMenuToSync()
      if (Settings.state.syncSaveKeybindings) Keybindings.saveKeybindingsToSync()
      if (Settings.state.syncSaveStyles) {
        await Styles.loadCustomCSS()
        Styles.saveStylesToSync()
      }
    } catch (err) {
      Logs.err('onGDToggle: turn on', err)
    }
  }

  gdToggling.value = false
}

function onSettingsToggle(): void {
  Logs.info('onSettingsToggle:', Settings.state.syncSaveSettings)

  if (!Settings.state.syncSaveSettings) {
    Sync.removeByType(Sync.SyncedEntryType.Settings)
  }
  Settings.saveDebounced(150)
}

function onMenuToggle(): void {
  Logs.info('onMenuToggle:', Settings.state.syncSaveCtxMenu)

  if (Settings.state.syncSaveCtxMenu) {
    Menu.saveCtxMenuToSync()
  } else {
    Sync.removeByType(Sync.SyncedEntryType.CtxMenu)
  }
  Settings.saveDebounced(150)
}

async function onStylesToggle(): Promise<void> {
  Logs.info('onStylesToggle:', Settings.state.syncSaveStyles)

  if (Settings.state.syncSaveStyles) {
    await Styles.loadCustomCSS()
    Styles.saveStylesToSync()
  } else {
    Sync.removeByType(Sync.SyncedEntryType.Styles)
  }

  Settings.saveDebounced(150)
}

function onKbToggle(): void {
  Logs.info('onKbToggle:', Settings.state.syncSaveKeybindings)

  if (Settings.state.syncSaveKeybindings) {
    Keybindings.saveKeybindingsToSync()
  } else {
    Sync.removeByType(Sync.SyncedEntryType.Keybindings)
  }

  Settings.saveDebounced(150)
}

function openSyncWin() {
  Logs.info('settings.sync.vue: openSyncWin()')

  Sync.openSyncPopup()
}
</script>
