<template lang="pug">
.fav(@dragstart.stop.prevent)
  Transition(name="tab-part"): svg.fav-icon(v-if="!tab.favIconUrl"): use(:xlink:href="favPlaceholder")
  Transition(name="tab-part"): img.fav-icon(v-if="tab.favIconUrl" :src="tab.favIconUrl" @error="onError")
  .exp(
    v-if="tab.isParent"
    @dblclick.prevent.stop
    @mousedown.stop="onExpandMouseDown"
    @mouseup.left.stop)
    svg: use(xlink:href="#icon_expand")
  .badge
  Transition(name="tab-part"): .progress-spinner(v-if="loading === true")
  .child-count(v-if="childCount && tab.folded") {{childCount}}
</template>

<script lang="ts" setup>
import { ReactiveTab } from 'src/types'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'

const props = defineProps<{
  tab: ReactiveTab
  favPlaceholder: string
  childCount?: number
  loading: boolean | string
}>()

function onExpandMouseDown(e: MouseEvent): void {
  Mouse.setTarget('tab.expand', props.tab.id)

  // Fold/Expand branch
  if (e.button === 0) {
    Menu.close()
    Selection.resetSelection()
    Tabs.toggleBranch(props.tab.id)
  }

  // Select whole branch and show menu
  if (e.button === 2 && !e.ctrlKey && !e.shiftKey) {
    const tab = Tabs.byId[props.tab.id]
    if (tab) Selection.selectTabsBranch(tab)
  }
}

function onError(): void {
  props.tab.favIconUrl = undefined
}
</script>
