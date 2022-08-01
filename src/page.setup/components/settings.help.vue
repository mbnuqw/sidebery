<template lang="pug">
section(ref="el")
  h2 {{translate('settings.help_title')}}
  SelectField(
    label="settings.log_lvl"
    optLabel="settings.log_lvl_"
    v-model:value="Settings.state.logLvl"
    :opts="Settings.getOpts('logLvl')"
    @update:value="Settings.saveDebounced(150)")
  .ctrls
    a.btn(@click="SetupPage.reactive.exportDialog = true") {{translate('settings.help_exp_data')}}
    .btn(type="file")
      .label {{translate('settings.help_imp_data')}}
      input(type="file" accept="application/json" @input="importData")
    .btn(@click="showDbgDetails()") {{translate('settings.debug_info')}}
    a.btn(@click="SetupPage.copyDevtoolsUrl()") {{translate('settings.copy_devtools_url')}}
    a.btn(
      v-if="LANG === 'en'"
      tabindex="-1"
      href="https://github.com/mbnuqw/sidebery/issues/new?template=Bug_report.md") {{translate('settings.repo_bug')}}
    a.btn(
      v-if="LANG === 'en'"
      tabindex="-1"
      href="https://github.com/mbnuqw/sidebery/issues/new?template=Feature_request.md") {{translate('settings.repo_feature')}}
  .ctrls
    .btn.-warn(@click="reloadAddon") {{translate('settings.reload_addon')}}
    .btn.-warn(@click="resetSettings") {{translate('settings.reset_settings')}}

  Transition(name="popup")
    .popup-layer(v-if="SetupPage.reactive.exportDialog" @click="SetupPage.reactive.exportDialog = false")
      .popup-box(@click.stop)
        ExportConfig
  Transition(name="popup")
    .popup-layer(v-if="SetupPage.reactive.importedData" @click="SetupPage.reactive.importedData = null")
      .popup-box(@click.stop)
        ImportConfig(:importedData="SetupPage.reactive.importedData" @close="SetupPage.reactive.importedData = null")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate, LANG } from 'src/dict'
import { BackupData } from 'src/types'
import { Logs } from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import SelectField from '../../components/select-field.vue'
import ExportConfig from './popup.export-config.vue'
import ImportConfig from './popup.import-config.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_help', el.value))

function resetSettings(): void {
  if (window.confirm(translate('settings.reset_confirm'))) {
    Settings.resetSettings()
    Settings.saveSettings()
  }
}

function importData(importEvent: Event): void {
  const target = importEvent.target as HTMLInputElement
  let file = target.files?.[0]
  if (!file) return
  let reader = new FileReader()
  reader.onload = fileEvent => {
    if (!fileEvent.target) return Logs.err('Cannot import data: No file content')
    let jsonStr = fileEvent.target.result
    if (!jsonStr || typeof jsonStr !== 'string') {
      Logs.err('Cannot import data: Wrong file content')
      SetupPage.reactive.importedData = {}
      return
    }

    try {
      SetupPage.reactive.importedData = JSON.parse(jsonStr) as BackupData
    } catch (err) {
      Logs.err('Cannot import data', err)
      SetupPage.reactive.importedData = {}
    }
  }
  reader.readAsText(file)
}

async function showDbgDetails(): Promise<void> {
  const dbg = await SetupPage.getDbgDetails()
  SetupPage.reactive.detailsText = JSON.stringify(dbg, null, 2)
}

function reloadAddon(): void {
  browser.runtime.reload()
}
</script>
