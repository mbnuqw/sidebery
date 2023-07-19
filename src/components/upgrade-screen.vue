<template lang="pug">
.UpgradeScreen(ref="el" :data-loading="reactiveUpgrading.status?.status === 'loading'")
  .container
    h2.title {{translate('upgrade.title')}}
    .loading-box
      LoadingDots
    .progress
      .item(v-if="backupErr" :data-status="'err'")
        .label(v-if="backupErr.title") {{backupErr.title}}
        .status(v-if="backupErr.note") {{backupErr.note}}
      .list(v-if="reactiveUpgrading.status")
        .item(
          v-for="msg in reactiveUpgrading.status.messages"
          :data-status="msg.status"
          :key="msg.title")
          .label(v-if="msg.title") {{msg.title}}
          .status(v-if="msg.note") {{msg.note}}
    .controls
      .btn(
        :class="{ '-inactive': reactiveUpgrading.status?.status !== 'done' && reactiveUpgrading.status?.status !== 'err' }"
        @click="onContinueClick") {{translate('upgrade.btn.continue')}}
      a.btn.-wrap(
        :class="{ '-inactive': !backupReady }"
        ref="backupDataLink") {{translate('upgrade.btn.backup')}}
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { translate } from 'src/dict'
import { BackupData, Stored, UpgradeMsg } from 'src/types'
import * as Utils from 'src/utils'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { pollBgForUpgradeState, reactiveUpgrading } from 'src/services/upgrading'
import LoadingDots from 'src/components/loading-dots.vue'

onMounted(() => {
  genBackup()
})

const backupDataLink = ref<HTMLAnchorElement | null>(null)
const continued = ref(false)
const backupReady = ref(false)
const backupErr = ref<UpgradeMsg | null>(null)
const el = ref<HTMLElement | null>(null)

const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
let scrollTimeout: number | undefined
watch(
  () => reactiveUpgrading.status?.messages,
  () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      if (el.value) {
        scrollConf.top = 999999
        el.value.scroll(scrollConf)
      }
    }, 33)
  }
)

function onContinueClick(): void {
  if (continued.value) return
  if (reactiveUpgrading.status?.status === 'finish') return
  if (reactiveUpgrading.status) reactiveUpgrading.status.status = 'loading'

  pollBgForUpgradeState()
  blockContinueBtn()

  IPC.bg('continueUpgrade')
}

let blockContinueBtnTimeout: number | undefined
function blockContinueBtn() {
  continued.value = true
  clearTimeout(blockContinueBtnTimeout)
  blockContinueBtnTimeout = setTimeout(() => {
    continued.value = false
  }, 500)
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
    const errStr = err ? err.toString() : ''
    backupErr.value = {
      title: translate('upgrade.err.backup'),
      note: translate('upgrade.err.backup_note') + '\n\n' + errStr,
      status: 'err',
    }
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
  backupReady.value = true
}
</script>
