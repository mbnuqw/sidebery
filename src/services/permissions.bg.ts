import * as Utils from 'src/utils'
import * as Containers from 'src/services/containers'
import * as Settings from 'src/services/settings.bg'
import * as Store from 'src/services/storage.bg'

import * as Perm from 'src/services/permissions'
export * from 'src/services/permissions'

export function setupListeners() {
  Perm._setupListeners()

  Perm.setRemovedWebDataHandler(onRemovedWebData)

  Perm.setRemovedTabHideHandler(onRemovedTabHide)

  Perm.setRemovedDownloadsHandler(onRemovedDownloads)
}

export async function request(...perms: Perm.RequestablePermission[]): Promise<boolean> {
  try {
    return Perm._request(...perms)
  } catch {
    return false
  }
}

function onRemovedWebData(): void {
  let containersSaveNeeded = false
  let settingsSaveNeeded = false
  for (const c of Object.values(Containers.reactive.byId)) {
    if (c.proxified) {
      c.proxified = false
      containersSaveNeeded = true
    }
    if (c.proxy && c.proxy.type !== 'direct') {
      c.proxy.type = 'direct'
      containersSaveNeeded = true
    }
    if (c.reopenRulesActive) {
      c.reopenRulesActive = false
      containersSaveNeeded = true
    }
    if (c.userAgentActive) {
      c.userAgentActive = false
      containersSaveNeeded = true
    }
  }

  if (Settings.state.selWinScreenshots) {
    Settings.state.selWinScreenshots = false
    settingsSaveNeeded = true
  }

  if (Settings.state.newTabCtxReopen) {
    Settings.state.newTabCtxReopen = false
    settingsSaveNeeded = true
  }

  if (Settings.state.previewTabs) {
    Settings.state.previewTabs = false
    settingsSaveNeeded = true
  }

  if (containersSaveNeeded) {
    Store.set({ containers: Utils.cloneObject(Containers.reactive.byId) })
  }
  if (settingsSaveNeeded) {
    Settings.saveSettings()
  }
}

function onRemovedTabHide(): void {
  let saveNeeded = false
  if (Settings.state.hideInact) {
    Settings.state.hideInact = false
    saveNeeded = true
  }
  if (Settings.state.hideFoldedTabs) {
    Settings.state.hideFoldedTabs = false
    saveNeeded = true
  }
  if (Settings.state.hideUnloadedTabs) {
    Settings.state.hideUnloadedTabs = false
    saveNeeded = true
  }

  if (saveNeeded) {
    Settings.saveSettings()
  }
}

function onRemovedDownloads(): void {
  let saveNeeded = false
  if (Settings.state.snapAutoExport) {
    Settings.state.snapAutoExport = false
    saveNeeded = true
  }

  if (saveNeeded) {
    Settings.saveSettings()
  }
}
