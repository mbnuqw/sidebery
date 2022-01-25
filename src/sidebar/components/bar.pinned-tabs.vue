<template lang="pug">
.PinnedTabsBar(
  tabindex="-1"
  :data-empty="pinnedTabs.length === 0"
  :data-dnd-end="dropIndex === pinnedTabs.length"
  data-dnd-type="pinned-bar"
  @wheel="onWheel"
  @drop="onDrop")
  .tab-wrapper(v-for="(tab, i) in pinnedTabs" :key="tab.id" :data-targeted="i === dropIndex")
    Tab(:tab="tab")
  .to-the-end(v-if="pinnedTabs.length")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { DropType, TabsPanel } from 'src/types'
import { Settings } from 'src/services/settings'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import Tab from './tab.vue'

const props = defineProps<{ panel?: TabsPanel }>()

const dropIndex = computed(() => (DnD.reactive.dstPin ? DnD.reactive.dstIndex : -1))
const pinnedTabs = computed(() => {
  if (props.panel) return props.panel.pinnedTabs
  else return Tabs.reactive.pinned
})

function onWheel(e: WheelEvent): void {
  if (
    Settings.reactive.pinnedTabsPosition !== 'panel' &&
    Settings.reactive.scrollThroughTabs !== 'none'
  ) {
    const globaly = (Settings.reactive.scrollThroughTabs === 'global') !== e.shiftKey
    const cyclic = Settings.reactive.scrollThroughTabsCyclic !== e.ctrlKey

    if (e.deltaY > 0) {
      if (Mouse.isWheelBlocked) return
      Tabs.switchTab(globaly, cyclic, 1, true)
    }
    if (e.deltaY < 0) {
      if (Mouse.isWheelBlocked) return
      Tabs.switchTab(globaly, cyclic, -1, true)
    }
  }
}

function onDrop(): void {
  DnD.reactive.dstType = DropType.Tabs
  DnD.reactive.dstPin = true
}
</script>
