import { ConfirmDialog, Container, Dialog, DialogConfig, GroupConfig, PanelConfig } from 'src/types'
import { TabToPanelMoveRuleConfig, PanelType, TabsPanelConfig, Tab } from 'src/types'
import { GroupConfigResult, Sidebar } from './sidebar'
import { Containers } from './containers'
import * as Utils from 'src/utils'
import { BOOKMARKS_PANEL_CONFIG, DEFAULT_CONTAINER, NOID, TABS_PANEL_CONFIG } from 'src/defaults'

export interface PopupsReactiveState {
  panelConfigPopup: PanelConfigPopup | null
  containerConfigPopup: ContainerConfigPopup | null
  groupConfigPopup: GroupConfigPopup | null
  newTabShortcutsPopup: NewTabShortcutsPopup | null
  siteConfigPopup: SiteConfigPopup | null
  tabMoveRulesPopup: TabMoveRulesPopup | null
  tabReopenRulesPopup: TabReopenRulesPopup | null
  confirm: ConfirmDialog | null
  dialog: Dialog | null
}

export interface PanelConfigPopup {
  config: PanelConfig
  index?: number
  done: (result: ID | null) => void
}

export interface ContainerConfigPopup {
  id: ID
  name: string
  icon: string
  color: browser.ColorName
  done: (result: ID | null) => void
}

export interface GroupConfigPopup {
  config: GroupConfig
  done: (result: GroupConfigResult) => void
}

export interface NewTabShortcutsPopup {
  panelId: ID
  rawShortcuts: string[]
}

export interface TabMoveRulesPopup {
  panelId: ID
  rules: TabToPanelMoveRuleConfig[]
}

export interface TabReopenRulesPopup {
  container: Container
}

export interface SiteConfigPopup {
  tabId: ID
  url: string
}

export let reactive: PopupsReactiveState = {
  panelConfigPopup: null,
  containerConfigPopup: null,
  groupConfigPopup: null,
  newTabShortcutsPopup: null,
  siteConfigPopup: null,
  tabMoveRulesPopup: null,
  tabReopenRulesPopup: null,
  confirm: null,
  dialog: null,
}
export let PopupsRState = reactive

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initPopups(reactivate?: (rObj: object) => object) {
  if (!reactivate) return
  reactFn = reactivate as <T extends object>(rObj: T) => T
  PopupsRState = reactive = reactFn(reactive)
}

export function confirm(msg: string): Promise<boolean> {
  return new Promise(res => {
    reactive.confirm = {
      msg,
      ok: () => {
        reactive.confirm = null
        res(true)
      },
      cancel: () => {
        reactive.confirm = null
        res(false)
      },
    }
  })
}

export function finishConfirmation(accept: boolean): void {
  if (accept && reactive.confirm?.ok) reactive.confirm.ok()
  else if (reactive.confirm?.cancel) reactive.confirm.cancel()
}

export function ask(conf: DialogConfig): Promise<string | null> {
  return new Promise<string | null>(ok => {
    reactive.dialog = {
      title: conf.title,
      note: conf.note,
      checkbox: conf.checkbox,
      buttons: conf.buttons,
      buttonsCentered: conf.buttonsCentered,
      buttonsInline: conf.buttonsInline,
      result: (answer: string | null) => {
        ok(answer)
        reactive.dialog = null
      },
    }
  })
}

export function openPanelPopup(conf: Partial<PanelConfig>, index?: number): Promise<ID | null> {
  if (conf.type === undefined) conf.type = PanelType.tabs

  return new Promise(res => {
    const panel = Sidebar.panelsById[conf.id as ID]
    let panelConfig
    if (panel) {
      panelConfig = Utils.recreateNormalizedObject(panel as TabsPanelConfig, TABS_PANEL_CONFIG)
    } else {
      if (conf.type === PanelType.tabs) {
        panelConfig = Utils.cloneObject(TABS_PANEL_CONFIG)
      } else if (conf.type === PanelType.bookmarks) {
        panelConfig = Utils.cloneObject(BOOKMARKS_PANEL_CONFIG)
      } else {
        return res(null)
      }
      Utils.updateObject(panelConfig, conf, conf)
    }

    reactive.panelConfigPopup = {
      config: panelConfig,
      index,
      done: res,
    }
  })
}

export function closePanelPopup(): void {
  if (reactive.panelConfigPopup?.done) reactive.panelConfigPopup.done(null)
  reactive.panelConfigPopup = null
}

export function openContainerPopup(containerId: ID): Promise<ID | null> {
  return new Promise(res => {
    let container = Containers.reactive.byId[containerId]
    if (!container) {
      container = Utils.cloneObject(DEFAULT_CONTAINER)
      container.name = ''
      container.icon = 'fingerprint'
      container.color = 'toolbar'
    }

    reactive.containerConfigPopup = {
      id: container ? container.id : NOID,
      name: container.name,
      color: container.color,
      icon: container.icon,
      done: res,
    }
  })
}

export function closeContainerPopup(): void {
  if (reactive.containerConfigPopup?.done) {
    reactive.containerConfigPopup.done(null)
  }
  reactive.containerConfigPopup = null
}

export function openNewTabShortcutsPopup(panel?: PanelConfig): void {
  if (!Utils.isTabsPanel(panel)) return

  reactive.newTabShortcutsPopup = {
    panelId: panel.id,
    rawShortcuts: Utils.cloneArray(panel.newTabBtns),
  }
}

export function closeNewTabShortcutsPopup(): void {
  if (!reactive.newTabShortcutsPopup) return
  reactive.newTabShortcutsPopup = null
}

export function openSiteConfigPopup(tab: Tab): void {
  reactive.siteConfigPopup = { url: tab.url, tabId: tab.id }
}

export function closeSiteConfigPopup(): void {
  if (!reactive.siteConfigPopup) return
  reactive.siteConfigPopup = null
}

export function openTabMoveRulesPopup(panel?: PanelConfig) {
  if (!Utils.isTabsPanel(panel)) return

  reactive.tabMoveRulesPopup = { panelId: panel.id, rules: Utils.cloneArray(panel.moveRules) }
}

export function closeTabMoveRulesPopup(): void {
  if (!reactive.tabMoveRulesPopup) return
  reactive.tabMoveRulesPopup = null
}

export function openTabReopenRulesPopup(containerId: string): void {
  const container = Containers.reactive.byId[containerId]
  if (!container) return

  reactive.tabReopenRulesPopup = { container }
}

export function closeTabReopenRulesPopup(): void {
  if (!reactive.tabReopenRulesPopup) return
  reactive.tabReopenRulesPopup = null
}
