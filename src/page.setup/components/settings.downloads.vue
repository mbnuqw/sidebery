<template lang="pug">
section(ref="el")
  h2 {{translate('settings.downloads_title')}}
  ToggleField(
    label="settings.load_downloads_on_demand"
    v-model:value="Settings.reactive.loadDownloadsOnDemand")
  ToggleField(
    label="settings.show_notif_on_download_ok"
    v-model:value="Settings.reactive.showNotifOnDownloadOk")
  ToggleField(
    label="settings.show_notif_on_download_err"
    v-model:value="Settings.reactive.showNotifOnDownloadErr")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SetupPage } from 'src/services/setup-page'
import { Settings } from 'src/services/settings'
import ToggleField from 'src/components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_downloads', el.value))
</script>
