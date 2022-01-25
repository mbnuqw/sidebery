<template lang="pug">
section(ref="el")
  h2 {{translate('settings.stats_title')}}
  ToggleField(
    label="settings.load_stats_on_demand"
    v-model:value="Settings.reactive.loadStatsOnDemand")
  SelectField(
    label="settings.stats_week_start"
    optLabel="settings.stats_week_start_"
    v-model:value="Settings.reactive.statsWeekStart"
    :opts="Settings.getOpts('statsWeekStart')")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import SelectField from '../../components/select-field.vue'
import ToggleField from 'src/components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_stats', el.value))
</script>
