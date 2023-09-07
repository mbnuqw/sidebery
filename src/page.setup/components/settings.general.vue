<template lang="pug">
section(ref="el")
  h2 {{translate('settings.general_title')}}
  span.header-shadow
  ToggleField(
    label="settings.native_scrollbars"
    v-model:value="Settings.state.nativeScrollbars"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.native_scrollbars_thin"
      :inactive="!Settings.state.nativeScrollbars"
      v-model:value="Settings.state.nativeScrollbarsThin"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.native_scrollbars_left"
      :inactive="!Settings.state.nativeScrollbars"
      v-model:value="Settings.state.nativeScrollbarsLeft"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.sel_win_screenshots"
    :value="Settings.state.selWinScreenshots"
    @update:value="toggleSelWinScreenshots")
  ToggleField(
    label="settings.update_sidebar_title"
    v-model:value="Settings.state.updateSidebarTitle"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.mark_window"
    v-model:value="Settings.state.markWindow"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    TextField.-inline(
      label="settings.mark_window_preface"
      or="---"
      v-model:value="Settings.state.markWindowPreface"
      :inactive="!Settings.state.markWindow"
      @update:value="Settings.saveDebounced(500)")
  .ctrls
    .btn(@click="showStorageView") {{translate('settings.storage_btn')}} {{state.storageOveral}}
    .btn(@click="showPermissionsPopup") {{translate('settings.permissions_btn')}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'
import TextField from '../../components/text-field.vue'
import { Stored } from 'src/types'
import * as Utils from 'src/utils'
import { Permissions } from 'src/services/permissions'

const el = ref<HTMLElement | null>(null)
const state = reactive({
  storageOveral: '-',
})

onMounted(() => {
  SetupPage.registerEl('settings_general', el.value)
  calcStorageInfo()
})

function showStorageView(): void {
  location.hash = 'storage'
}

async function calcStorageInfo(): Promise<void> {
  let stored: Stored
  try {
    stored = await browser.storage.local.get<Stored>()
  } catch (err) {
    return
  }

  state.storageOveral = Utils.strSize(JSON.stringify(stored))
}

async function toggleSelWinScreenshots(): Promise<void> {
  if (!Settings.state.selWinScreenshots && !Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  Settings.state.selWinScreenshots = !Settings.state.selWinScreenshots
  Settings.saveDebounced(150)
}

function showPermissionsPopup(): void {
  SetupPage.reactive.permissions = true
}
</script>
