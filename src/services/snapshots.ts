import { SnapTab, MinifiedSnapshot, Snapshot, SnapExportInfo, SnapExportConf } from 'src/types'
import { SnapStoreMode } from 'src/enums'
import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import * as Settings from 'src/services/settings'

export const GLOB_PINNED_ID = 'global_pinned'

export function getNormalizedSnapshot(
  snapshots: MinifiedSnapshot[],
  index: number
): Snapshot | undefined {
  const snapshot = snapshots[index]
  if (!snapshot) return

  // Containers
  if (snapshot.containers === SnapStoreMode.Unchanged) {
    for (let i = index; i--;) {
      const snapN = snapshots[i]
      if (snapN && snapN.containers !== SnapStoreMode.Unchanged) {
        snapshot.containers = snapN.containers
        break
      }
    }
  }

  // Nav and panels
  if (snapshot.sidebar === SnapStoreMode.Unchanged) {
    for (let i = index; i--;) {
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

          for (let i = index; i--;) {
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

  return snapshot as Snapshot
}

export function prepareExport(snapshot: Snapshot, conf: SnapExportConf) {
  const expInfo: SnapExportInfo = { time: snapshot.time }

  if (conf.json) {
    expInfo.json = typeof conf.json === 'string' ? conf.json : JSON.stringify(snapshot)
    expInfo.jsonFile = new Blob([expInfo.json], { type: 'application/json' })
  }

  if (conf.md) {
    expInfo.md = typeof conf.md === 'string' ? conf.md : convertToMarkdown(snapshot)
    expInfo.mdFile = new Blob([expInfo.md], { type: 'text/markdown' })
  }

  return expInfo
}

export function convertToMarkdown(snapshot: Snapshot): string {
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
