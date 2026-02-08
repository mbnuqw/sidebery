<template lang="pug">
.SubListTitle(
  :id="id"
  :data-folded="!expanded"
  :data-sel="Sidebar.reactive.selectedHeader === id"
  @click="emit('click', $event)")
  .body
    .title {{title}}
    .len {{len}}
    svg.expand: use(href="#icon_expand")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import * as Sidebar from 'src/services/sidebar.fg'

const props = defineProps<{ title: string; expanded: boolean; len: number }>()
const emit = defineEmits(['click'])
const id = computed<string>(() => 'header' + props.title)
</script>
