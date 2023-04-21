import { UpgradingState } from 'src/types'
import * as IPC from 'src/services/ipc'
import * as Utils from 'src/utils'

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

export async function showUpgradingScreen(): Promise<void> {
  reactiveUpgrading.status = { active: true, init: 'in-progress' }

  while (true) {
    await Utils.sleep(123)

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
      reactiveUpgrading.status.init = upgradeState.init
      reactiveUpgrading.status.settings = upgradeState.settings
      reactiveUpgrading.status.sidebar = upgradeState.sidebar
      reactiveUpgrading.status.snapshots = upgradeState.snapshots
      reactiveUpgrading.status.favicons = upgradeState.favicons
      reactiveUpgrading.status.styles = upgradeState.styles
      reactiveUpgrading.status.error = upgradeState.error
      reactiveUpgrading.status.done = upgradeState.done
    }

    if (upgradeState.done || upgradeState.error) break
  }
}
