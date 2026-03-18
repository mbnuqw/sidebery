<template lang="pug">
section(ref="el")
  h2 {{translate('settings.general_title')}}
  span.header-shadow
  ToggleField(
    label="settings.native_scrollbars"
    dbg="nativeScrollbars"
    v-model:value="Settings.state.nativeScrollbars"
    :default="DEFAULT_SETTINGS.nativeScrollbars"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.native_scrollbars_thin"
      dbg="nativeScrollbarsThin"
      v-model:value="Settings.state.nativeScrollbarsThin"
      :inactive="!Settings.state.nativeScrollbars"
      :default="DEFAULT_SETTINGS.nativeScrollbarsThin"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.native_scrollbars_left"
      dbg="nativeScrollbarsLeft"
      v-model:value="Settings.state.nativeScrollbarsLeft"
      :inactive="!Settings.state.nativeScrollbars"
      :default="DEFAULT_SETTINGS.nativeScrollbarsLeft"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.sel_win_screenshots"
    dbg="selWinScreenshots"
    :value="Settings.state.selWinScreenshots"
    :default="DEFAULT_SETTINGS.selWinScreenshots"
    @update:value="toggleSelWinScreenshots")
  ToggleField(
    label="settings.update_sidebar_title"
    dbg="updateSidebarTitle"
    v-model:value="Settings.state.updateSidebarTitle"
    :default="DEFAULT_SETTINGS.updateSidebarTitle"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.mark_window"
    dbg="markWindow"
    v-model:value="Settings.state.markWindow"
    :default="DEFAULT_SETTINGS.markWindow"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    TextField.-inline(
      label="settings.mark_window_preface"
      or="---"
      dbg="markWindowPreface"
      v-model:value="Settings.state.markWindowPreface"
      :default="DEFAULT_SETTINGS.markWindowPreface"
      :line="true"
      :note="translate('settings.mark_window_preface_note')"
      :inactive="!Settings.state.markWindow"
      @update:value="Settings.saveDebounced(500)")
  TextField.-inline(
    label="settings.copy_title_url_indent"
    dbg="copyTreeIndent"
    v-model:value="Settings.state.copyTreeIndent"
    :default="DEFAULT_SETTINGS.copyTreeIndent"
    :line="true"
    :or="translate('settings.copy_title_url_indent_or')"
    @update:value="Settings.saveDebounced(500)")
  TextField.-inline(
    label="settings.copy_multi_bullet"
    dbg="copyMultiBullet"
    v-model:value="Settings.state.copyMultiBullet"
    :default="DEFAULT_SETTINGS.copyMultiBullet"
    :line="true"
    :or="translate('settings.copy_multi_bullet_or')"
    @update:value="Settings.saveDebounced(500)")
  TextField.copyTemplatesTextField(
    label="settings.copy_templates"
    dbg="copyTemplates"
    v-model:value="Settings.state.copyTemplates"
    or="---"
    input-width="66"
    :default="DEFAULT_SETTINGS.copyTemplates"
    :note="translate('settings.copy_templates_note')"
    @update:value="Settings.saveDebounced(500)")
  .ctrls
    .btn(@click="showStorageView") {{translate('settings.storage_btn')}} ~{{SetupPage.reactive.storageOveral}}
    .btn(@click="showPermissionsPopup") {{translate('settings.permissions_btn')}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import ToggleField from '../../components/toggle-field.vue'
import TextField from '../../components/text-field.vue'
import * as Permissions from 'src/services/permissions.fg'

const el = ref<HTMLElement | null>(null)
const state = reactive({
  storageOveral: '-',
})

onMounted(() => {
  SetupPage.registerEl('settings_general', el.value)
})

function showStorageView(): void {
  location.hash = 'storage'
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
