<template lang="pug">
.PinnedTabsBar(
  tabindex="-1"
  :data-empty="pinnedTabs.length === 0"
  :data-dnd-end="dropToEnd"
  data-dnd-type="pinned-bar"
  :data-dnd-id="panel?.id ?? NOID"
  @wheel="onWheel"
  @drop="onDrop")
  .tab-wrapper(v-for="id in pinnedTabs" :key="id" :data-targeted="DnD.reactive.dstPin && dropId === id")
    Tab(:tabId="id")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type * as T from 'src/types'
import * as E from 'src/enums'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import Tab from './tab.vue'
import { NOID } from 'src/defaults'

const props = defineProps<{ panel?: T.TabsPanel }>()
const pinnedTabs = computed(() => {
  if (props.panel) return props.panel.reactive.pinnedTabIds
  else return Tabs.reactive.pinnedIds
})
const dropId = computed(() => {
  const tab = Tabs.list[DnD.reactive.dstIndex]
  if (!tab || !tab.pinned || (props.panel && tab.panelId !== props.panel.id)) return NOID
  else return tab.id
})
const dropToEnd = computed(() => DnD.reactive.dstPin && dropId.value === NOID)

const onWheel = Mouse.getWheelDebouncer(E.WheelDirection.Vertical, (e: WheelEvent) => {
  if (
    Settings.state.pinnedTabsPosition !== 'panel' &&
    Settings.state.scrollThroughTabs !== 'none'
  ) {
    const globaly = (Settings.state.scrollThroughTabs === 'global') !== e.shiftKey
    const cyclic = Settings.state.scrollThroughTabsCyclic !== e.ctrlKey

    const globPin = Settings.state.scrollThroughTabsGlobPinIsolate ? true : undefined
    if (e.deltaY > 0) Tabs.switchTab(globaly, cyclic, 1, globPin)
    else if (e.deltaY < 0) Tabs.switchTab(globaly, cyclic, -1, globPin)
  }
})

function onDrop(): void {
  DnD.reactive.dstType = E.DropType.Tabs
  DnD.reactive.dstPin = true
}
</script>
