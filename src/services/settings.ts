import { SettingsState, Stored, CopyTemplate, Reactivator } from 'src/types'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Info from 'src/services/info'
import * as Logs from 'src/services/logs'

export let state = Utils.cloneObject(DEFAULT_SETTINGS)

export let updateWinPrefaceOnPanelSwitch = false
export let copyTemplates: CopyTemplate[] = []

export let rmChildTabsFolded = false
export let rmChildTabsAll = false
export let rmChildTabsNone = false

export let activateAfterClosingNone = false
export let activateAfterClosingNext = false
export let activateAfterClosingPrev = false
export let activateAfterClosingPrevAct = false

export let tabsUpdateMarkAll = false
export let tabsUpdateMarkPin = false
export let tabsUpdateMarkNorm = false
export let tabsUpdateMarkNone = false

export function reactivate(r: Reactivator<SettingsState>) {
  state = r(state)
}

export async function load(): Promise<void> {
  const [managedResult, localResult] = await Promise.allSettled([
    browser.storage.managed.get<Stored>('settings'),
    browser.storage.local.get<Stored>('settings'),
  ])

  const storedManaged = Utils.settledOr(managedResult, {} as Stored)
  if (!storedManaged.settings) storedManaged.settings = {} as SettingsState

  const storedLocal = Utils.settledOr(localResult, {} as Stored)
  if (!storedLocal.settings) {
    // Respect prefersReducedMotion rule for default settings
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReducedMotion?.matches) DEFAULT_SETTINGS.animations = false

    storedLocal.settings = {} as SettingsState
  }

  Utils.normalizeObject(storedManaged.settings, storedLocal.settings)
  const groupOnOpen = storedManaged.settings.groupOnOpen
  Utils.normalizeObject(storedManaged.settings, DEFAULT_SETTINGS)
  Utils.updateObject(state, storedManaged.settings, state)

  if (state.hideInact) {
    state.activateLastTabOnPanelSwitching = true
    state.tabsPanelSwitchActMove = true
  }

  // TMP
  // Try to keep previous behavior with moveNewTabParent === 'default' and groupOnOpen
  if (groupOnOpen && state.moveNewTabParent === 'default') {
    state.moveNewTabParentIndent = true
  }

  parsePrefaceTemplate()

  if (Info.isSidebar) {
    parseCopyTemplates()
  }

  updPrecalcSettings()
}

export function updPrecalcSettings() {
  rmChildTabsFolded = state.rmChildTabs === 'folded'
  rmChildTabsAll = state.rmChildTabs === 'all'
  rmChildTabsNone = state.rmChildTabs === 'none'

  activateAfterClosingNone = state.activateAfterClosing === 'none'
  activateAfterClosingNext = state.activateAfterClosing === 'next'
  activateAfterClosingPrev = state.activateAfterClosing === 'prev'
  activateAfterClosingPrevAct = state.activateAfterClosing === 'prev_act'

  tabsUpdateMarkAll = state.tabsUpdateMark === 'all'
  tabsUpdateMarkPin = state.tabsUpdateMark === 'pin'
  tabsUpdateMarkNorm = state.tabsUpdateMark === 'norm'
  tabsUpdateMarkNone = state.tabsUpdateMark === 'none'
}

export function resetSettings(): void {
  Utils.updateObject(state, DEFAULT_SETTINGS, DEFAULT_SETTINGS)
  updPrecalcSettings()
}

export function parsePrefaceTemplate() {
  const preface = state.markWindowPreface
  updateWinPrefaceOnPanelSwitch = preface.includes('%PN')
}

const COPY_TEMPLATE_RE = /^(?<name>.+):(?<template>.+)$/
export function parseCopyTemplates() {
  const templates: CopyTemplate[] = []

  if (state.copyTemplates) {
    const rawLines = state.copyTemplates.split('\n')
    for (const rawLine of rawLines) {
      const line = rawLine.trim()
      if (!line) continue

      const result = COPY_TEMPLATE_RE.exec(line)
      if (!result?.groups) continue

      const name = result.groups['name']
      const template = result.groups['template']
      if (!name || !template) continue

      templates.push({
        name,
        str: template,
        hasCT: template.includes('%CT'),
        hasT: template.includes('%T'),
        hasU: template.includes('%U'),
        hasB: template.includes('%B'),
      })
    }
  }

  copyTemplates = templates
}
