import { Tab } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Permissions } from 'src/services/permissions'
import { Settings } from 'src/services/settings'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'

export function muteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    browser.tabs.update(tabId, { muted: true }).catch(err => {
      Logs.err('Tabs.muteTabs: Cannot mute tab:', err)
    })
  }
}

export function unmuteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    browser.tabs.update(tabId, { muted: false }).catch(err => {
      Logs.err('Tabs.unmuteTabs: Cannot unmute tab:', err)
    })
  }
}

export function remuteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue
    browser.tabs.update(tabId, { muted: !tab.mutedInfo?.muted }).catch(err => {
      Logs.err('Tabs.remuteTabs: Cannot remute tab:', err)
    })
  }
}

export function remuteAudibleTabs(): void {
  const audioIds: ID[] = []
  const mutedIds: ID[] = []
  for (const tab of Tabs.list) {
    if (tab.audible && !tab.mutedInfo?.muted) audioIds.push(tab.id)
    if (tab.mutedInfo?.muted) mutedIds.push(tab.id)
  }

  if (audioIds.length) Tabs.muteTabs(audioIds)
  else if (mutedIds.length) Tabs.unmuteTabs(mutedIds)
}

export function muteAudibleTabsOfPanel(id: ID): void {
  const panel = Sidebar.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.audible && tab.panelId === panel.id) browser.tabs.update(tab.id, { muted: true })
    }
  }

  for (const tab of panel.tabs) {
    if (tab.audible) browser.tabs.update(tab.id, { muted: true })
  }
}

export function unmuteAudibleTabsOfPanel(id: ID): void {
  const panel = Sidebar.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.mutedInfo?.muted && tab.panelId === panel.id) {
        browser.tabs.update(tab.id, { muted: false }).catch(err => {
          Logs.err('Tabs.unmuteAudibleTabsOfPanel: Cannot unmute tab:', err)
        })
      }
    }
  }

  for (const tab of panel.tabs) {
    if (tab.mutedInfo?.muted) browser.tabs.update(tab.id, { muted: false })
  }
}

export function switchToFirstAudibleTab(): void {
  const tab = Tabs.list.find(t => t.audible && !t.mutedInfo?.muted)
  if (tab) browser.tabs.update(tab.id, { active: true })
}

export async function pauseTabMedia(id?: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const tab = id !== undefined ? Tabs.byId[id] : Tabs.list.find(t => t.audible)
  if (!tab) return
  if (tab.url.startsWith('ab')) return

  tab.reactive.mediaPaused = tab.mediaPaused = true
  Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)

  browser.tabs
    .executeScript(tab.id, {
      file: '../injections/pauseMedia.js',
      runAt: 'document_start',
      allFrames: true,
    })
    .then(results => {
      if (results.every(result => result === false)) {
        tab.reactive.mediaPaused = tab.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      }
    })
    .catch(err => {
      Logs.err('Tabs.pauseTabMedia: Cannot executeScript', err)
    })

  recheckPausedTabs()
}

export async function playTabMedia(id?: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  let tab: Tab | undefined
  if (id !== undefined) tab = Tabs.byId[id]
  else tab = Tabs.list.find(t => t.mediaPaused)
  if (!tab) return

  tab.reactive.mediaPaused = tab.mediaPaused = false
  Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)

  browser.tabs
    .executeScript(tab.id, {
      file: '../injections/playMedia.js',
      runAt: 'document_start',
      allFrames: true,
    })
    .catch(err => {
      Logs.err('Tabs.playTabMedia: Cannot exec script:', err)
    })
}

export function resetPausedMediaState(panelId: ID): void {
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  for (const tab of panel.tabs) {
    if (tab && tab.mediaPaused) {
      tab.reactive.mediaPaused = tab.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
    }
  }
}

export async function pauseTabsMediaOfPanel(panelId: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/pauseMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.url.startsWith('ab')) continue
      if ((tab.audible || tab.mutedInfo?.muted) && tab.panelId === panel.id) {
        tab.reactive.mediaPaused = tab.mediaPaused = true
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
        browser.tabs
          .executeScript(tab.id, injectionConfig)
          .then(results => {
            if (results.every(result => result === false)) {
              tab.reactive.mediaPaused = tab.mediaPaused = false
              Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
            }
          })
          .catch(err => {
            Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
          })
      }
    }
  }

  for (const tab of panel.tabs) {
    if (tab.url.startsWith('ab')) continue
    if (tab.audible || tab.mutedInfo?.muted) {
      tab.reactive.mediaPaused = tab.mediaPaused = true
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs
        .executeScript(tab.id, injectionConfig)
        .then(results => {
          if (results.every(result => result === false)) {
            tab.reactive.mediaPaused = tab.mediaPaused = false
            Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
          }
        })
        .catch(err => {
          Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
        })
    }
  }

  recheckPausedTabs()
}

export async function playTabsMediaOfPanel(panelId: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/playMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.mediaPaused && tab.panelId === panel.id) {
        tab.reactive.mediaPaused = tab.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
        browser.tabs.executeScript(tab.id, injectionConfig).catch(err => {
          Logs.err('Tabs.playTabsMediaOfPanel: Cannot exec script (pinned):', err)
        })
      }
    }
  }

  for (const tab of panel.tabs) {
    if (tab.mediaPaused) {
      tab.reactive.mediaPaused = tab.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs.executeScript(tab.id, injectionConfig).catch(err => {
        Logs.err('Tabs.playTabsMediaOfPanel: Cannot exec script:', err)
      })
    }
  }
}

let recheckPausedTabsTimeout: number | undefined
function recheckPausedTabs(delay = 3500): void {
  clearTimeout(recheckPausedTabsTimeout)
  recheckPausedTabsTimeout = setTimeout(() => {
    for (const tab of Tabs.list) {
      if (tab.mediaPaused && tab.audible) {
        tab.reactive.mediaPaused = tab.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      }
    }
  }, delay)
}

export async function pauseAllAudibleTabsMedia(): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/pauseMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  for (const tab of Tabs.list) {
    if (tab.audible) {
      tab.reactive.mediaPaused = tab.mediaPaused = true
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs
        .executeScript(tab.id, injectionConfig)
        .then(results => {
          if (results.every(result => result === false)) {
            tab.reactive.mediaPaused = tab.mediaPaused = false
            Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
          }
        })
        .catch(err => {
          Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
        })
    }
  }

  recheckPausedTabs()
}

export async function playAllPausedTabsMedia(): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/playMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  for (const tab of Tabs.list) {
    if (tab.mediaPaused) {
      tab.reactive.mediaPaused = tab.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs.executeScript(tab.id, injectionConfig).catch(err => {
        Logs.err('Tabs.playAllPausedTabsMedia: Cannot exec script:', err)
      })
    }
  }
}
