<template lang="pug">
section(ref="el")
  h2 {{translate('settings.search_title')}}
  span.header-shadow
  SelectField(
    label="settings.search_bar_mode"
    optLabel="settings.search_bar_mode_"
    v-model:value="Settings.state.searchBarMode"
    :opts="Settings.getOpts('searchBarMode')"
    @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SetupPage } from 'src/services/setup-page'
import { Settings } from 'src/services/settings'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_search', el.value))
</script>
