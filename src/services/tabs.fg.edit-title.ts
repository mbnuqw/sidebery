import { NOID } from 'src/defaults'
import { ReactiveTab, Tab } from 'src/types'
import { Tabs } from './tabs.fg'
import * as Utils from 'src/utils'

export function editTabTitle(tabIds: ID[]): void {
  Tabs.sortTabIds(tabIds)

  const firstTabId = tabIds[0]
  const tab = Tabs.byId[firstTabId]
  const rTab = Tabs.reactive.byId[firstTabId]
  if (!tab || !rTab) return

  const titleEl = document.querySelector(`#tab${tab.id}` + ' .title') as HTMLElement | null
  if (!titleEl) return

  Tabs.editableTabId = tab.id
  rTab.customTitleEdit = true

  titleEl.addEventListener(
    'blur',
    () => {
      titleEl.removeEventListener('keydown', onTitleKeyDown)
      Tabs.editableTabId = NOID
      rTab.customTitleEdit = false
      titleEl.scrollLeft = 0
      window.getSelection()?.empty()
      saveCustomTitle(tab, rTab, titleEl)
    },
    { once: true }
  )
  titleEl.addEventListener('keydown', onTitleKeyDown)

  setTimeout(() => {
    titleEl.focus()
    window.getSelection()?.selectAllChildren(titleEl)
  })
}

function onTitleKeyDown(e: KeyboardEvent) {
  const titleEl = e.target as HTMLElement

  if (e.key === 'Enter') {
    e.preventDefault()
    titleEl.blur()
  } else if (e.key === 'Escape') {
    const tab = Tabs.byId[Tabs.editableTabId]
    if (tab) titleEl.textContent = tab.title
    titleEl.blur()
    e.preventDefault()
  }
}

function saveCustomTitle(tab: Tab, rTab: ReactiveTab, titleEl: HTMLElement) {
  let value = titleEl.textContent
  if (value === tab.title) value = ''
  if (value) value = value.trim()

  const isGroup = Utils.isGroupUrl(tab.url)
  if (isGroup && value) {
    Tabs.setGroupName(tab.id, value)
  } else {
    if (value) {
      tab.customTitle = value
      rTab.customTitle = value
    } else {
      tab.customTitle = undefined
      rTab.customTitle = null
      titleEl.textContent = rTab.title
    }
  }

  Tabs.saveTabData(tab.id)
  Tabs.cacheTabsData()
}
