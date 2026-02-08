<template lang="pug">
section(ref="el")
  h2 {{translate('settings.history_title')}}
  span.header-shadow
  ToggleField(
    label="settings.load_history_on_demand"
    v-model:value="Settings.state.loadHistoryOnDemand"
    dbg="loadHistoryOnDemand"
    :default="DEFAULT_SETTINGS.loadHistoryOnDemand"
    @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import ToggleField from 'src/components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_history', el.value))
</script>
