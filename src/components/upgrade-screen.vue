<template lang="pug">
.UpgradeScreen(:data-loading="!allDone" :data-continued="continued")
  .container
    h2.title {{translate('upgrade.title')}}
    .loading-box
      LoadingDots
    .error(v-if="Sidebar.reactive.upgrading?.error") {{Sidebar.reactive.upgrading.error}}
    .progress(v-else)
      .list
        .item(:data-status="Sidebar.reactive.upgrading?.init ?? 'pending'")
          .label {{translate('upgrade.initializing')}}
          .status {{getStatusLabel(Sidebar.reactive.upgrading?.init ?? 'pending')}}
        .item(:data-status="Sidebar.reactive.upgrading?.settings ?? 'pending'")
          .label {{translate('upgrade.settings')}}
          .status {{getStatusLabel(Sidebar.reactive.upgrading?.settings ?? 'pending')}}
        .item(:data-status="Sidebar.reactive.upgrading?.sidebar ?? 'pending'")
          .label {{translate('upgrade.panels_nav')}}
          .status {{getStatusLabel(Sidebar.reactive.upgrading?.sidebar ?? 'pending')}}
        .item(:data-status="Sidebar.reactive.upgrading?.snapshots ?? 'pending'")
          .label {{translate('upgrade.snapshots')}}
          .status {{getStatusLabel(Sidebar.reactive.upgrading?.snapshots ?? 'pending')}}
        .item(:data-status="Sidebar.reactive.upgrading?.favicons ?? 'pending'")
          .label {{translate('upgrade.fav_cache')}}
          .status {{getStatusLabel(Sidebar.reactive.upgrading?.favicons ?? 'pending')}}
        .item(:data-status="Sidebar.reactive.upgrading?.styles ?? 'pending'")
          .label {{translate('upgrade.styles')}}
          .status {{getStatusLabel(Sidebar.reactive.upgrading?.styles ?? 'pending')}}
    .controls
      .btn(
        :class="{ '-inactive': !allDone }"
        @click="onContinueClick") {{translate('upgrade.btn.continue')}}
      a.btn.-wrap(ref="backupDataLink") {{translate('upgrade.btn.backup')}}
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Sidebar } from 'src/services/sidebar'
import LoadingDots from 'src/components/loading-dots.vue'
import { BackupData, InstanceType, Stored } from 'src/types'
import Utils from 'src/utils'
import { Msg } from 'src/services/msg'
import { Logs } from 'src/services/logs'

onMounted(() => {
  genBackup()
})

const backupDataLink = ref<HTMLAnchorElement | null>(null)
const continued = ref(false)

const allDone = computed<boolean>(() => {
  if (!Sidebar.reactive.upgrading) return false
  if (Sidebar.reactive.upgrading.error) return true
  if (Sidebar.reactive.upgrading.done) return true
  return false
})

function getStatusLabel(status: 'done' | 'in-progress' | 'pending' | 'err' | 'no'): string {
  if (status === 'done') return translate('upgrade.status.done')
  if (status === 'in-progress') return translate('upgrade.status.in_progress')
  if (status === 'err') return translate('upgrade.status.err')
  if (status === 'no') return translate('upgrade.status.no')
  return translate('upgrade.status.pending')
}

function onContinueClick(): void {
  if (!allDone.value) return
  if (continued.value) return
  continued.value = true
  Msg.call(InstanceType.bg, 'continueUpgrade')
}

async function genBackup(): Promise<void> {
  let stored
  try {
    stored = await browser.storage.local.get<Stored>([
      'containers_v4',
      'panels_v4',
      'settings',
      'tabsMenu',
      'bookmarksMenu',
      'snapshots_v4',
    ])
  } catch (err) {
    return Logs.err('genBackup: Cannot get stored data for backup', err)
  }
  const backup: BackupData = { ver: '4.10.1', ...stored }
  const backupJSON = JSON.stringify(backup)
  const file = new Blob([backupJSON], { type: 'application/json' })
  const now = Date.now()
  const date = Utils.uDate(now, '.')
  const time = Utils.uTime(now, '.')

  if (backupDataLink.value) {
    backupDataLink.value.href = URL.createObjectURL(file)
    backupDataLink.value.download = `sidebery-data-${date}-${time}.json`
    backupDataLink.value.title = `sidebery-data-${date}-${time}.json`
  }
}
</script>
