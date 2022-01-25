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
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_general', el.value))
</script>
