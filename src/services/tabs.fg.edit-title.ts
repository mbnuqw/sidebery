import { Settings } from './settings'
import { Tabs } from './tabs.fg'
import * as Utils from 'src/utils'

export async function editTabTitle(tabIds: ID[]) {
  Tabs.sortTabIds(tabIds)

  const firstTabId = tabIds[0]
  const tab = Tabs.byId[firstTabId]
  if (!tab) return

  if (tab.pinned) {
    const ptp = Settings.state.pinnedTabsPosition
    if (!Settings.state.pinnedTabsList) return
    if (ptp === 'left' || ptp === 'right') return
  }

  Tabs.editableTabId = tab.id
  tab.reactive.customTitleEdit = true
  tab.reactive.customTitle = tab.customTitle ?? tab.title

  await Utils.sleep(1)

  const selector = `#tab${tab.id}` + ' .custom-title-input'
  const inputEl = document.querySelector(selector) as HTMLInputElement | null
  if (!inputEl) return

  await Utils.sleep(1)

  inputEl.focus()
  inputEl.select()
}

export function saveCustomTitle(tabId: ID) {
  const tab = Tabs.byId[tabId]
  if (!tab) return

  let value = tab.reactive.customTitle
  if (value) value = value.trim()
  if (value === tab.title) value = ''

  const isGroup = Utils.isGroupUrl(tab.url)
  if (isGroup && value) {
    Tabs.setGroupName(tab.id, value)
    return
  } else {
    if (value) {
      tab.customTitle = value
      tab.reactive.customTitle = value
    } else {
      tab.customTitle = undefined
      tab.reactive.customTitle = null
    }
  }

  Tabs.saveTabData(tab.id)
  Tabs.cacheTabsData()
}
