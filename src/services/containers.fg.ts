import type { Stored, Container } from 'src/types'
import * as Utils from 'src/utils'
import * as Store from 'src/services/storage.fg'
import * as Logs from 'src/services/logs'
import * as Menu from 'src/services/menu.fg'
import * as Info from 'src/services/info'
import * as Settings from 'src/services/settings'
import * as Tabs from './tabs.fg'
import * as Sidebar from 'src/services/sidebar.fg'

import * as Containers from './containers'
export * from 'src/services/containers'

export async function load(): Promise<void> {
  Logs.info('Containers.load')
  const storage = await browser.storage.local.get<Stored>('containers')
  if (storage.containers) {
    Containers.reactive.byId = storage.containers
    Menu.parseContainersRules()
  }
}

let saveContainersTimeout: number | undefined
export async function saveContainers(delay?: number): Promise<void> {
  Logs.info('Containers.fg.saveContainers')
  clearTimeout(saveContainersTimeout)

  if (!delay) {
    return Store.set({ containers: Utils.cloneObject(Containers.reactive.byId) })
  } else {
    saveContainersTimeout = setTimeout(() => {
      Store.set({ containers: Utils.cloneObject(Containers.reactive.byId) })
    }, delay)
  }
}

export function updateContainers(newContainers?: Record<ID, Container> | null) {
  Logs.info('Containers.fg.updateContainers')
  clearTimeout(saveContainersTimeout)

  if (!newContainers) return
  const oldContainers = Containers.reactive.byId
  Containers.reactive.byId = newContainers

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
}

export function setupListeners(): void {
  if (Info.isSidebar) {
    browser.contextualIdentities.onCreated.addListener(Containers.onContainerCreated)
  }
  browser.contextualIdentities.onRemoved.addListener(onContainerRemoved)
  Store.onKeyChange('containers', updateContainers)
}

async function onContainerRemoved(info: browser.contextualIdentities.ChangeInfo): Promise<void> {
  Logs.info('Containers.fg.onContainerRemoved:', info)
  const id = info.contextualIdentity.cookieStoreId
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
