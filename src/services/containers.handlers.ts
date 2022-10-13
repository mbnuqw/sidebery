import * as Utils from 'src/utils'
import { Containers } from 'src/services/containers'
import { DEFAULT_CONTAINER } from 'src/defaults'
import { Store } from 'src/services/storage'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Info } from 'src/services/info'

export function setupContainersListeners(): void {
  if (Info.isBg) {
    browser.contextualIdentities.onCreated.addListener(onContainerCreated)
    browser.contextualIdentities.onRemoved.addListener(onContainerRemovedBg)
    browser.contextualIdentities.onUpdated.addListener(onContainerUpdated)
    Store.onKeyChange('containers', Containers.updateContainers)
  } else {
    browser.contextualIdentities.onRemoved.addListener(onContainerRemovedFg)
    Store.onKeyChange('containers', Containers.updateContainers)
  }
}

function onContainerCreated(info: browser.contextualIdentities.ChangeInfo): void {
  const ffContainer = info.contextualIdentity
  const id = ffContainer.cookieStoreId
  const container = Containers.reactive.byId[id] ?? Utils.cloneObject(DEFAULT_CONTAINER)
  container.cookieStoreId = id
  container.id = id
  container.name = ffContainer.name
  container.icon = ffContainer.icon
  container.color = ffContainer.color
  if (!Containers.reactive.byId[id]) Containers.reactive.byId[id] = container

  if (Info.isBg) Containers.saveContainers(300)
}

function onContainerRemovedBg(info: browser.contextualIdentities.ChangeInfo): void {
  const id = info.contextualIdentity.cookieStoreId

  delete Containers.reactive.byId[id]
  if (Info.isBg) Containers.saveContainers(300)
}

async function onContainerRemovedFg(info: browser.contextualIdentities.ChangeInfo): Promise<void> {
  const id = info.contextualIdentity.cookieStoreId

  for (const panel of Sidebar.reactive.panels) {
    if (!Utils.isTabsPanel(panel)) continue
    if (panel.newTabCtx === id) panel.newTabCtx = 'none'
    if (panel.moveTabCtx === id) panel.moveTabCtx = 'none'
  }

  // Close tabs
  const orphanTabs = Tabs.list.filter(t => t.cookieStoreId === id)
  Tabs.removingTabs = orphanTabs.map(t => t.id)
  await browser.tabs.remove([...Tabs.removingTabs])
}

function onContainerUpdated(info: browser.contextualIdentities.ChangeInfo): void {
  const container = info.contextualIdentity
  const id = container.cookieStoreId

  if (!Containers.reactive.byId[id]) return

  Containers.reactive.byId[id].name = container.name
  Containers.reactive.byId[id].icon = container.icon
  Containers.reactive.byId[id].color = container.color

  if (Info.isBg) Containers.saveContainers(300)
}
