<template lang="pug">
section(ref="el")
  h2 {{translate('settings.group_title')}}
  SelectField(
    label="settings.group_layout"
    optLabel="settings.group_layout_"
    v-model:value="Settings.reactive.groupLayout"
    :opts="Settings.getOpts('groupLayout')")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_group', el.value))
</script>
