<template lang="pug">
.pointer(
  ref="pointerEl"
  :data-pointer="DndPointerModeNames[DnD.reactive.pointerMode]"
  :data-hover="DnD.reactive.pointerHover"
  :data-lvl="DnD.reactive.pointerLvl")
  .arrow(
    data-dnd-type="pointer"
    :data-expanding="DnD.reactive.pointerExpanding"
    @animationend="DnD.onPointerExpanded")
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { DndPointerModeNames, DnD } from 'src/services/drag-and-drop'

const pointerEl = ref<HTMLElement | null>(null)

onMounted(() => DnD.initPointer(pointerEl.value))
</script>
