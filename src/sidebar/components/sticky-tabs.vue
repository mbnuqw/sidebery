<template lang="pug">
.StickyTabs(v-if="show")
  TabComponent(
    v-for="id in panel.reactive.stickyTabIds"
    :key="id"
    :tabId="id"
    :sticky="true")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { TabsPanel } from 'src/types'
import * as Settings from 'src/services/settings'
import * as Search from 'src/services/search.fg'
import TabComponent from './tab.vue'

const props = defineProps<{ panel: TabsPanel }>()

const show = computed<boolean>(
  () =>
    Settings.state.tabsTree &&
    Settings.state.stickyAncestorTabs &&
    !Search.reactive.active &&
    props.panel.reactive.stickyTabIds.length > 0
)
</script>
