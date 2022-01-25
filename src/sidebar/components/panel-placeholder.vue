<template lang="pug">
Transition(name="panel-placeholder")
  .PanelPlaceholder(v-if="props.isLoading || isMsg || isNotPerm" :data-loading="isLoading")
    .perm-warn(v-if="isNotPerm && perm")
      .perm-warn-msg {{permMsg}}
      .btn.perm-warn-btn(@click="SetupPage.open(perm)") Grant permissions
    LoadingDots(v-else-if="props.isLoading")
    .msg(v-else-if="props.isMsg") {{props.msg}}
</template>

<script lang="ts" setup>
import { SetupPage } from 'src/services/setup-page'
import LoadingDots from './loading-dots.vue'

const props = defineProps<{
  isLoading?: boolean
  isMsg?: boolean
  isNotPerm?: boolean
  perm?: string
  permMsg?: string
  msg?: string
}>()
</script>
