<template lang="pug">
#drag_image.drag-image
  .drag-image-title(v-if="DnD.reactive.dragTooltipTitle") {{DnD.reactive.dragTooltipTitle}}
  .drag-image-info(v-if="DnD.reactive.dragTooltipInfo") {{DnD.reactive.dragTooltipInfo}}
</template>

<script lang="ts" setup>
import * as DnD from 'src/services/drag-and-drop.fg'
</script>
