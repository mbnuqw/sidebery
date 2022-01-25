<template lang="pug">
section(ref="el")
  h2 {{translate('settings.trash_title')}}
  ToggleField(
    label="settings.load_trash_on_demand"
    v-model:value="Settings.reactive.loadTrashOnDemand")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { SetupPage } from 'src/services/setup-page'
import { Settings } from 'src/services/settings'
import ToggleField from 'src/components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_trash', el.value))
</script>
