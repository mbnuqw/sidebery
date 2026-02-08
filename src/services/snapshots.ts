import { SnapTab, Snapshot, NormalizedSnapshot, SnapExportInfo, SnapExportTypes } from 'src/types'
import { SnapStoreMode } from 'src/enums'
import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import * as Settings from 'src/services/settings'

export const MAX_SIZE_LIMIT = 10_240
export const GLOB_PINNED_ID = 'global_pinned'

export function getNormalizedSnapshot(
  snapshots: Snapshot[],
  index: number
): NormalizedSnapshot | undefined {
  const snapshot = snapshots[index]
  if (!snapshot) return

  // Containers
  if (snapshot.containers === SnapStoreMode.Unchanged) {
    for (let i = index; i--; ) {
      const snapN = snapshots[i]
      if (snapN && snapN.containers !== SnapStoreMode.Unchanged) {
        snapshot.containers = snapN.containers
        break
      }
    }
  }

  // Nav and panels
  if (snapshot.sidebar === SnapStoreMode.Unchanged) {
    for (let i = index; i--; ) {
      const snapN = snapshots[i]
      if (snapN && snapN.sidebar !== SnapStoreMode.Unchanged) {
        snapshot.sidebar = snapN.sidebar
        break
      }
    }
  }

  // Tabs
  for (let wi = 0; wi < snapshot.tabs.length; wi++) {
    const win = snapshot.tabs[wi]
    if (!win) continue

    for (let pi = 0; pi < win.length; pi++) {
      const panel = win[pi]
      if (!panel) continue

      for (let ti = 0; ti < panel.length; ti++) {
        const tab = panel[ti]

        if (tab === SnapStoreMode.Unchanged) {
          if (index === 0) return

          for (let i = index; i--; ) {
            const snapN = snapshots[i]
            const tabN = snapN?.tabs[wi]?.[pi]?.[ti]
            if (tabN && tabN !== SnapStoreMode.Unchanged) {
              panel[ti] = tabN
              break
            }

            if (i === 0) return
          }
        }
      }
    }
  }

  if (!snapshot.sidebar || snapshot.sidebar === SnapStoreMode.Unchanged) return
  if (!snapshot.containers || snapshot.containers === SnapStoreMode.Unchanged) return

  return snapshot as NormalizedSnapshot
}

export function prepareExport(snapshot: NormalizedSnapshot, type: SnapExportTypes) {
  const { id, time, containers, sidebar, tabs } = snapshot
  const expInfo: SnapExportInfo = { id, time, containers, sidebar, tabs }

  if (type.JSON) {
    const jsonStr = JSON.stringify(snapshot)
    expInfo.jsonFile = new Blob([jsonStr], { type: 'application/json' })
  }

  if (type.Markdown) {
    expInfo.md = convertToMarkdown(snapshot)
    expInfo.mdFile = new Blob([expInfo.md], { type: 'text/markdown' })
  }

  return expInfo
}

export function convertToMarkdown(snapshot: NormalizedSnapshot): string {
  const dateStr = Utils.uDate(snapshot.time, '.')
  const timeStr = Utils.uTime(snapshot.time, '.')
  const dateTimeStr = `${dateStr} - ${timeStr}`
  const md = [`# ${dateTimeStr}`, '']
  const globalPinnedTabs = []
  const pinnedTabsByPanelId: Map<ID, SnapTab[]> = new Map()

  const indent = '  '
  const pinMark = '📌 '
  const winIndent = ''
  const panelsIndent = Settings.state.snapMdFullTree ? indent : ''
  const tabsIndent = Settings.state.snapMdFullTree ? indent.repeat(2) : ''
  const winBullet = Settings.state.snapMdFullTree ? '- ' : ''
  const panelBullet = Settings.state.snapMdFullTree ? '- ' : ''
  const tabBullet = '- '

  // Gather pinned tabs
  if (snapshot.tabs[0]?.[0]?.[0]?.pinned) {
    const pinnedTabs = snapshot.tabs[0]?.[0]
    for (const tab of pinnedTabs) {
      const panelConfig = snapshot.sidebar.panels[tab.panelId]
      if (panelConfig) {
        let panelPinnedTabs = pinnedTabsByPanelId.get(tab.panelId)
        if (!panelPinnedTabs) panelPinnedTabs = []
        panelPinnedTabs.push(tab)
        pinnedTabsByPanelId.set(tab.panelId, panelPinnedTabs)
      } else {
        globalPinnedTabs.push(tab)
      }
    }
  }

  // Per-window
  for (let i = 0; i < snapshot.tabs.length; i++) {
    const win = snapshot.tabs[i]
    const winTitle = `## ${translate('snapshot.window_title')} ${i + 1}`
    md.push(winIndent + winBullet + winTitle)

    // Global pinned tabs
    if (globalPinnedTabs.length) {
      const globalPinnedTitle = `### ${translate('snapshot.global_pin_title')}`
      md.push(panelsIndent + panelBullet + globalPinnedTitle)

      for (const tab of globalPinnedTabs) {
        const tabLink = `[${tab.title}](${tab.url})`
        md.push(tabsIndent + tabBullet + pinMark + tabLink)
      }
    }

    // Per-panel
    for (const id of snapshot.sidebar.nav) {
      const panel = snapshot.sidebar.panels[id]
      if (!Utils.isTabsPanel(panel)) continue

      // Get tabs
      const pinnedTabs = pinnedTabsByPanelId.get(id)
      const normalTabs = win.find(p => p[0] && p[0].panelId === id && !p[0].pinned)
      if (!pinnedTabs?.length && !normalTabs) continue

      // Create panel title
      const panelTitle = `### ${panel.name}`
      md.push(panelsIndent + panelBullet + panelTitle)

      // Pinned tabs
      if (pinnedTabs?.length) {
        for (const tab of pinnedTabs) {
          const tabLink = `[${tab.title}](${tab.url})`
          md.push(tabsIndent + tabBullet + pinMark + tabLink)
        }
      }

      // Normal tabs
      if (normalTabs?.length) {
        for (const tab of normalTabs) {
          const tabLink = `[${tab.customTitle ?? tab.title}](${tab.url})`
          md.push(tabsIndent + indent.repeat(tab.lvl ?? 0) + tabBullet + tabLink)
        }
      }
    }
  }

  return md.join('\n')
}

export function minimizeSnapshot(snapshots: Snapshot[], snapshot: Snapshot): void {
  const newContainersJSON = JSON.stringify(snapshot.containers)
  const newSidebarJSON = JSON.stringify(snapshot.sidebar)

  // Containers
  for (let i = snapshots.length; i--; ) {
    const snapN = snapshots[i]
    if (!snapN || !snapN.containers) break

    if (snapN.containers === SnapStoreMode.Unchanged) continue

    const lastContainersJSON = JSON.stringify(snapN.containers)
    if (newContainersJSON === lastContainersJSON) {
      snapshot.containers = SnapStoreMode.Unchanged
    }

    break
  }

  // Nav and panels
  for (let i = snapshots.length; i--; ) {
    const snapN = snapshots[i]
    if (!snapN || !snapN.sidebar) break

    if (snapN.sidebar === SnapStoreMode.Unchanged) continue

    const lastSidebarJSON = JSON.stringify(snapN.sidebar)
    if (newSidebarJSON === lastSidebarJSON) {
      snapshot.sidebar = SnapStoreMode.Unchanged
    }

    break
  }

  // Tabs (by relative index)
  // per win (current)
  per_win: for (let wi = 0; wi < snapshot.tabs.length; wi++) {
    const win = snapshot.tabs[wi]
    if (!win) break per_win // stop tabs minimizing

    // per group (current)
    per_panel: for (let gi = 0; gi < win.length; gi++) {
      const tabs = win[gi]
      if (!tabs) break per_win // stop tabs minimizing

      // per tab (current)
      per_tab: for (let ti = 0; ti < tabs.length; ti++) {
        const tab = tabs[ti]
        if (!tab) break per_win // stop tabs minimizing
        if (tab === SnapStoreMode.Unchanged) continue

        // per snapshot (previous)
        for (let i = snapshots.length; i--; ) {
          const snapN = snapshots[i]
          if (!snapN) break per_win // stop tabs minimizing

          const winN = snapN.tabs[wi]
          if (!winN) break per_win // stop tabs minimizing

          const panelN = winN[gi]
          if (!panelN) break per_panel // go to the next win

          const tabN = panelN[ti]
          if (!tabN) break per_tab // go to the next panel

          if (tabN === SnapStoreMode.Unchanged) continue // go to the prev snapshot

          if (
            tab.url === tabN.url &&
            tab.title === tabN.title &&
            tab.pinned === tabN.pinned &&
            tab.containerId === tabN.containerId &&
            tab.panelId === tabN.panelId &&
            tab.lvl === tabN.lvl &&
            tab.folded === tabN.folded &&
            tab.customTitle === tabN.customTitle &&
            tab.customColor === tabN.customColor
          ) {
            tabs[ti] = SnapStoreMode.Unchanged
          }

          break // go to the next tab
        }
      }
    }
  }
}
