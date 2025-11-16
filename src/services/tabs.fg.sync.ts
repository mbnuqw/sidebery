import { CONTAINER_ID, NOID } from 'src/defaults'
import { Logs, Sync, Utils } from './_services'
import { Favicons } from './_services.fg'
import { Tabs } from './tabs.fg'
import { Containers } from './containers'
import { Sidebar } from './sidebar'
import { SubPanelType } from 'src/types'

export async function sync(ids: ID[]) {
  Logs.info('TabsSync.sync():', ids)

  // Prepare tabs for sync
  const favicons: Record<string, string> = {}
  const syncedTabs: Sync.Google.SyncedTabsBatch = {
    id: Utils.uid(),
    time: Date.now(),
    tabs: [],
    containers: {},
    profileId: Sync.getProfileId(),
  }
  Tabs.sortTabIds(ids)
  for (const tabId of ids) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue

    const sTab: Sync.Google.SyncedTab = { id: tabId, title: tab.title, url: tab.url }
    const domain = Utils.getDomainOf(sTab.url)
    const favicon = Favicons.reactive.byDomains[domain]
    if (domain) sTab.domain = domain
    if (favicon && domain) favicons[domain] = favicon
    if (tab.pinned) sTab.pin = true
    if (tab.parentId !== NOID) sTab.parentId = tab.parentId
    if (tab.folded) sTab.folded = true
    if (tab.cookieStoreId !== CONTAINER_ID) {
      sTab.containerId = tab.cookieStoreId
      const sContainer = getSyncedContainer(tab.cookieStoreId)
      if (sContainer) syncedTabs.containers[sContainer.id] = sContainer
    }
    if (tab.customTitle) sTab.customTitle = tab.customTitle
    if (tab.customColor) sTab.customColor = tab.customColor

    syncedTabs.tabs.push(sTab)
  }

  // Save tabs
  await Sync.saveTabs(syncedTabs, favicons)

  // Unload
  const syncPanel = Sidebar.panelsById.sync
  const panelIsActive = syncPanel && Sidebar.activePanelId === syncPanel.id
  const subPanelIsActive = Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.Sync
  if (!panelIsActive && !subPanelIsActive) Sync.unloadAfter(5_000)
}

function getSyncedContainer(containerId: ID): Sync.Google.SyncedContainer | void {
  const container = Containers.reactive.byId[containerId]
  if (container) {
    return {
      id: container.id,
      name: container.name,
      color: container.color,
      icon: container.icon,
      proxified: container.proxified,
      proxy: container.proxy ? Utils.cloneObject(container.proxy) : null,
      reopenRulesActive: container.reopenRulesActive,
      reopenRules: Utils.cloneArray(container.reopenRules),
      userAgentActive: container.userAgentActive,
      userAgent: container.userAgent,
    }
  }
}
