import { UpgradingState } from 'src/types'
import * as IPC from 'src/services/ipc'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

export interface UpgradingReactiveState {
  status: UpgradingState | null
}

export let reactiveUpgrading: UpgradingReactiveState = {
  status: null,
}

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initUpgrading(reactivate?: (rObj: object) => object) {
  if (!reactivate) return
  reactFn = reactivate as <T extends object>(rObj: T) => T
  reactiveUpgrading = reactFn(reactiveUpgrading)
}

export function showUpgradingScreen() {
  reactiveUpgrading.status = { messages: [], status: 'loading' }
  pollBgForUpgradeState()
}

export async function pollBgForUpgradeState() {
  while (true) {
    await Utils.sleep(200)

    let upgradeState
    try {
      upgradeState = await IPC.bg('checkUpgrade')
    } catch {
      break
    }

    if (!upgradeState) {
      break
    }

    if (reactiveUpgrading.status) {
      reactiveUpgrading.status.messages = upgradeState.messages
      reactiveUpgrading.status.status = upgradeState.status
    }

    if (upgradeState.status !== 'loading') break
  }
}
