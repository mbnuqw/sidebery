<template lang="pug">
Transition(name="panel-placeholder")
  .PanelPlaceholder(v-if="props.isLoading || isMsg || isNotPerm" :data-loading="isLoading")
    .perm-warn(v-if="isNotPerm && perm")
      .perm-warn-msg {{permMsg}}
      .btn.perm-warn-btn(@click="requestPermission") Grant permissions
    LoadingDots(v-else-if="props.isLoading")
    .msg(v-else-if="props.isMsg") {{props.msg}}
</template>

<script lang="ts" setup>
import LoadingDots from 'src/components/loading-dots.vue'
import { Permissions } from 'src/services/permissions'
import { RequestablePermission } from 'src/services/permissions.actions'
import { SetupPage } from 'src/services/setup-page'

const props = defineProps<{
  isLoading?: boolean
  isMsg?: boolean
  isNotPerm?: boolean
  perm?: RequestablePermission
  permMsg?: string
  msg?: string
}>()

async function requestPermission(): Promise<void> {
  if (!props.perm) return

  try {
    await Permissions.request(props.perm)
  } catch {
    SetupPage.open(props.perm)
  }
}
</script>
