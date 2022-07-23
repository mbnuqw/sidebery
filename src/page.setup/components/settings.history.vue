<template lang="pug">
section(ref="el")
  h2 {{translate('settings.history_title')}}
  ToggleField(
    label="settings.load_history_on_demand"
    v-model:value="Settings.state.loadHistoryOnDemand")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SetupPage } from 'src/services/setup-page'
import { Settings } from 'src/services/settings'
import ToggleField from 'src/components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_history', el.value))
</script>
