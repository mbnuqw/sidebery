<template lang="pug">
.PinnedTabsBar(
  tabindex="-1"
  :data-empty="pinnedTabs.length === 0"
  :data-dnd-end="dropToEnd"
  data-dnd-type="pinned-bar"
  :data-dnd-id="panel?.id ?? NOID"
  @wheel="onWheel"
  @drop="onDrop")
  .tab-wrapper(v-for="tab in pinnedTabs" :key="tab.id" :data-targeted="DnD.reactive.dstPin && dropId === tab.id")
    Tab(:tab="tab")
  .to-the-end(v-if="pinnedTabs.length")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { DropType, TabsPanel, WheelDirection } from 'src/types'
import { Settings } from 'src/services/settings'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { DnD } from 'src/services/drag-and-drop'
import Tab from './tab.vue'
import { NOID } from 'src/defaults'

const props = defineProps<{ panel?: TabsPanel }>()
const pinnedTabs = computed(() => {
  if (props.panel) return props.panel.reactive.pinnedTabs
  else return Tabs.reactive.pinned
})
const dropId = computed(() => {
  const tab = Tabs.list[DnD.reactive.dstIndex]
  if (!tab || !tab.pinned || (props.panel && tab.panelId !== props.panel.id)) return NOID
  else return tab.id
})
const dropToEnd = computed(() => DnD.reactive.dstPin && dropId.value === NOID)

const onWheel = Mouse.getWheelDebouncer(WheelDirection.Vertical, (e: WheelEvent) => {
  if (
    Settings.state.pinnedTabsPosition !== 'panel' &&
    Settings.state.scrollThroughTabs !== 'none'
  ) {
    const globaly = (Settings.state.scrollThroughTabs === 'global') !== e.shiftKey
    const cyclic = Settings.state.scrollThroughTabsCyclic !== e.ctrlKey

    if (e.deltaY > 0) Tabs.switchTab(globaly, cyclic, 1, true)
    if (e.deltaY < 0) Tabs.switchTab(globaly, cyclic, -1, true)
  }
})

function onDrop(): void {
  DnD.reactive.dstType = DropType.Tabs
  DnD.reactive.dstPin = true
}
</script>
