<template lang="pug">
.UpgradeScreen(:data-loading="!allDone" :data-continued="continued")
  .container
    h2.title {{translate('upgrade.title')}}
    .loading-box
      LoadingDots
    .error(v-if="reactiveUpgrading.status?.error") {{reactiveUpgrading.status.error}}
    .progress(v-else)
      .list
        .item(:data-status="reactiveUpgrading.status?.init ?? 'pending'")
          .label {{translate('upgrade.initializing')}}
          .status {{getStatusLabel(reactiveUpgrading.status?.init ?? 'pending')}}
        .item(:data-status="reactiveUpgrading.status?.settings ?? 'pending'")
          .label {{translate('upgrade.settings')}}
          .status {{getStatusLabel(reactiveUpgrading.status?.settings ?? 'pending')}}
        .item(:data-status="reactiveUpgrading.status?.sidebar ?? 'pending'")
          .label {{translate('upgrade.panels_nav')}}
          .status {{getStatusLabel(reactiveUpgrading.status?.sidebar ?? 'pending')}}
        .item(:data-status="reactiveUpgrading.status?.snapshots ?? 'pending'")
          .label {{translate('upgrade.snapshots')}}
          .status {{getStatusLabel(reactiveUpgrading.status?.snapshots ?? 'pending')}}
        .item(:data-status="reactiveUpgrading.status?.favicons ?? 'pending'")
          .label {{translate('upgrade.fav_cache')}}
          .status {{getStatusLabel(reactiveUpgrading.status?.favicons ?? 'pending')}}
        .item(:data-status="reactiveUpgrading.status?.styles ?? 'pending'")
          .label {{translate('upgrade.styles')}}
          .status {{getStatusLabel(reactiveUpgrading.status?.styles ?? 'pending')}}
    .controls
      .btn(
        :class="{ '-inactive': !allDone }"
        @click="onContinueClick") {{translate('upgrade.btn.continue')}}
      a.btn.-wrap(ref="backupDataLink") {{translate('upgrade.btn.backup')}}
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { BackupData, Stored } from 'src/types'
import * as Utils from 'src/utils'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { reactiveUpgrading } from 'src/services/upgrading'
import LoadingDots from 'src/components/loading-dots.vue'

onMounted(() => {
  genBackup()
})

const backupDataLink = ref<HTMLAnchorElement | null>(null)
const continued = ref(false)

const allDone = computed<boolean>(() => {
  if (!reactiveUpgrading.status) return false
  if (reactiveUpgrading.status.error) return true
  if (reactiveUpgrading.status.done) return true
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
  IPC.bg('continueUpgrade')
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
  const backup: BackupData = { ver: browser.runtime.getManifest().version, ...stored }
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
