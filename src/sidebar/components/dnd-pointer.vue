<template lang="pug">
.pointer(
  ref="pointerEl"
  v-show="subPanel === Sidebar.reactive.subPanelActive"
  :style="{ '--pointer-left': `${DnD.reactive.pointerLeft}px` }"
  :data-pointer="DnD.DndPointerModeNames[DnD.reactive.pointerMode]"
  :data-hover="DnD.reactive.pointerHover"
  :data-lvl="DnD.reactive.pointerLvl")
  .arrow(
    :data-expanding="DnD.reactive.pointerExpanding"
    @animationend="DnD.onPointerExpanded")
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import * as DnD from 'src/services/drag-and-drop.fg'
import * as Sidebar from 'src/services/sidebar.fg'

const props = defineProps<{ panelId: ID; subPanel: boolean }>()

const pointerEl = ref<HTMLElement | null>(null)

onMounted(() => DnD.initPointer(pointerEl.value, props.panelId))
</script>
