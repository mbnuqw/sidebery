<template lang="pug">
.StickyTabs(
  v-if="Settings.state.tabsTree && Settings.stickyTabs"
  v-show="show"
  :data-hide="DnD.reactive.isStarted")
  .sticky-box
    TabComponent(
      v-for="id in stickyTabIds"
      :key="id"
      :tabId="id"
      :sticky="true")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import * as Settings from 'src/services/settings'
import * as Search from 'src/services/search.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import TabComponent from './tab.vue'

const props = defineProps<{ stickyTabIds?: ID[] }>()
const show = computed<boolean>(
  () => !Search.reactive.active && (props.stickyTabIds?.length ?? 0) > 0
)
</script>
