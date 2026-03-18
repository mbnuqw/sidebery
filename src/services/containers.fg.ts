import type { Container, NewContainerConf } from 'src/types'
import * as Utils from 'src/utils'
import * as Store from 'src/services/storage.fg'
import * as Logs from 'src/services/logs'
import * as Menu from 'src/services/menu.fg'
import * as Info from 'src/services/info'
import * as Settings from 'src/services/settings'
import * as Tabs from './tabs.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as IPC from 'src/services/ipc'

import * as Containers from './containers'
export * from 'src/services/containers'

export async function load(): Promise<void> {
  Logs.info('Containers.load')
  const ts = performance.now()
  setupListeners()

  try {
    Containers.reactive.byId = await IPC.bg('getContainers')
  } catch (err) {
    Logs.err('Containers.load: Cannot load containers:', err)
    Containers.reactive.byId = {}
  }
  if (Info.isSidebar && Settings.state.ctxMenuIgnoreContainers) {
    Menu.parseContainersRules()
  }

  Logs.info('Containers.load: Done:', performance.now() - ts)
}

let creating: string | undefined
export async function create(c: NewContainerConf) {
  creating = c.name
  const container = await IPC.bg('createContainer', c, IPC.getInfo()).finally(() => {
    creating = undefined
  })
  Containers.reactive.byId[container.id] = container

  // Update context menu
  if (Info.isSidebar && Settings.state.ctxMenuIgnoreContainers) {
    Menu.parseContainersRules()
  }

  return container
}

export async function remove(id: string) {
  await IPC.bg('removeContainer', id, IPC.getInfo())
  const ctr = Containers.reactive.byId[id]
  delete Containers.reactive.byId[id]

  if (Info.isSidebar && ctr) {
    onContainerRemoved(ctr)
  }
}

let saveContainerTimeout: number | undefined
let containersToSave: Record<string, Container> = {}
export async function saveContainer(container: Container, delay?: number) {
  clearTimeout(saveContainerTimeout)

  containersToSave[container.id] = container

  if (!delay) {
    const cts = Utils.clone(containersToSave)
    containersToSave = {}
    await IPC.bg('setContainers', cts, IPC.getInfo())
  } else {
    saveContainerTimeout = setTimeout(() => {
      saveContainerTimeout = undefined
      IPC.bg('setContainers', Utils.clone(containersToSave), IPC.getInfo())
      containersToSave = {}
    })
  }
}

function setupListeners(): void {
  // Handle onCreated event in sidebar, even though it will be received with
  // Store.onKeyChange later. This is needed b/c Sidebery need to get that
  // info ASAP to correctly handle new tabs of just created container.
  if (Info.isSidebar) {
    browser.contextualIdentities.onCreated.addListener(onContainerCreated)
  }
  Store.onKeyChange('containers', onStoredContainersUpdated)
}

function onContainerCreated(info: browser.contextualIdentities.ChangeInfo) {
  const container = info.contextualIdentity
  // Container is created by Sidebery (most likely), skip
  if (creating === container.name) return

  Containers.onContainerCreated(info)
  // Other stuff will be updated/recalculated in onStoredContainersUpdated
}

export async function onStoredContainersUpdated(newContainers?: Record<ID, Container> | null) {
  clearTimeout(saveContainerTimeout)

  if (!newContainers) return
  const oldContainers = Containers.reactive.byId
  Containers.reactive.byId = newContainers

  // Update context menu
  if (Info.isSidebar && Settings.state.ctxMenuIgnoreContainers) {
    Menu.parseContainersRules()
  }

  // Update colors in tabs
  if (Info.isSidebar) {
    const tabColor = Settings.state.colorizeTabsSrc === 'container'

    for (const tab of Tabs.list) {
      const oldContainer = oldContainers[tab.cookieStoreId]
      const container = newContainers[tab.cookieStoreId]

      // Update color
      if (container && (!oldContainer || oldContainer.color !== container.color)) {
        tab.reactive.containerColor = container.color
        if (tabColor) Tabs.colorizeTab(tab.id)
      }
    }
  }

  // Handle removed containers
  if (Info.isSidebar) {
    for (const id of Object.keys(oldContainers)) {
      if (newContainers[id]) continue
      await onContainerRemoved(oldContainers[id])
    }
  }
}

async function onContainerRemoved(ctr: Container): Promise<void> {
  const id = ctr.id
  let moveRulesRecalcNeeded = false

  for (const panel of Sidebar.panels) {
    if (!Utils.isTabsPanel(panel)) continue
    if (panel.newTabCtx === id) panel.newTabCtx = 'none'
    if (panel.moveRules.length) {
      panel.moveRules = panel.moveRules.filter(rule => {
        if (rule.containerId === id) {
          moveRulesRecalcNeeded = true
          if (!rule.url) return false
          else {
            delete rule.containerId
            rule.active = false
          }
        }
        return true
      })
    }
  }

  if (moveRulesRecalcNeeded) Tabs.recalcMoveRules()

  // Close tabs
  const orphanTabs = Tabs.list.filter(t => t.cookieStoreId === id)
  const orphanTabIds = orphanTabs.map(t => {
    const tab = Tabs.byId[t.id]
    if (tab) tab.removing = true
    return t.id
  })
  Tabs.setRemovingTabs(orphanTabIds)
  await browser.tabs.remove([...Tabs.removingTabs])
}
