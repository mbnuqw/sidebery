<template lang="pug">
section(ref="el")
  h2 {{translate('settings.general_title')}}
  ToggleField(label="settings.native_scrollbars" v-model:value="Settings.reactive.nativeScrollbars")
  .sub-fields
    ToggleField(
      label="settings.native_scrollbars_thin"
      :inactive="!Settings.reactive.nativeScrollbars"
      v-model:value="Settings.reactive.nativeScrollbarsThin")
  ToggleField(label="settings.sel_win_screenshots" v-model:value="Settings.reactive.selWinScreenshots")
  ToggleField(label="settings.update_sidebar_title" v-model:value="Settings.reactive.updateSidebarTitle")
  ToggleField(label="settings.mark_window" v-model:value="Settings.reactive.markWindow")
  .sub-fields
    TextField.-inline(
      label="settings.mark_window_preface"
      or="---"
      v-model:value="Settings.reactive.markWindowPreface"
      :inactive="!Settings.reactive.markWindow")
  .ctrls
    .btn(@click="showStorageView") {{translate('settings.storage_btn')}} {{state.storageOveral}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'
import TextField from '../../components/text-field.vue'
import { Stored } from 'src/types'
import Utils from 'src/utils'

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
</script>
