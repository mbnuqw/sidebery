import * as T from 'src/types'
import * as E from 'src/enums'
import * as D from 'src/defaults'
import * as Utils from 'src/utils'
import * as Sidebar from 'src/services/sidebar.fg'

export function addMPanel(p: Partial<T.Panel>) {
  if (p.type === undefined) p.type = E.PanelType.tabs

  let panelDefs: T.Panel
  if (p.id === D.DEFAULT_CONTAINER_ID) panelDefs = D.TABS_PANEL_STATE
  else if (p.type === E.PanelType.tabs) panelDefs = D.TABS_PANEL_STATE
  else if (p.type === E.PanelType.bookmarks) panelDefs = D.BOOKMARKS_PANEL_STATE
  else if (p.type === E.PanelType.history) panelDefs = D.HISTORY_PANEL_STATE
  else if (p.type === E.PanelType.sync) panelDefs = D.SYNC_PANEL_STATE
  else return null

  const panel = Utils.recreateNormalizedObject(p, panelDefs)
  if (p.name) panel.reactive.name = p.name
  if (p.color) panel.reactive.color = p.color
  if (p.iconSVG) panel.reactive.iconSVG = p.iconSVG
  if (p.iconIMG) panel.reactive.iconIMG = p.iconIMG
  if (Utils.isTabsPanel(panel)) {
    panel.reactive.newTabCtx = panel.newTabCtx
    panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  } else if (Utils.isBookmarksPanel(panel)) {
    panel.reactive.viewMode = panel.viewMode
  }
  // const panel = Sidebar.createPanelFromConfig(p as T.PanelConfig)
  if (!panel) throw 'no panel'

  Sidebar.nav.push(panel.id)
  Sidebar.panels.push(panel)
  Sidebar.panelsById[panel.id] = panel
  Sidebar.setHasPanelTypeState(panel.type, true)

  return panel
}

export function addMNavBtn(btnId: ID) {
  Sidebar.nav.push(btnId)
}

export function resetMSidebar() {
  Sidebar.setReadyState(false)
  Sidebar.setNav([])
  Sidebar.setPanelsById({})
  Sidebar.setPanels([])
  Sidebar.setHasPanelTypeState(E.PanelType.tabs, false)
  Sidebar.setHasPanelTypeState(E.PanelType.bookmarks, false)
  Sidebar.setHasPanelTypeState(E.PanelType.history, false)
  Sidebar.setHasPanelTypeState(E.PanelType.sync, false)
}
