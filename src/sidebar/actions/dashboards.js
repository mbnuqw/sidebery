import Actions from '../actions'

/**
 * Open panel menu by nav index.
 * 
 * Special values:
 * -1 - new container
 * -2 - hidden panels
 */
async function openDashboard(i) {
  if (i < -2 || i >= this.state.panels.length) return

  Actions.closeCtxMenu()
  Actions.resetSelection()
  this.state.dashboardIsOpen = true

  if (i === -2) {
    this.state.dashboard = {
      dashboard: 'HiddenPanelsDashboard',
      panels: this.state.panels.filter(b => !b.bookmarks && b.inactive),
    }
    return
  }

  this.state.panelIndex = i

  if (i === -1) this.state.dashboard = { dashboard: 'TabsDashboard', name: '', new: true }
  else this.state.dashboard = this.state.panels[i]
}

/**
 * Close dashboard
 */
function closeDashboard() {
  this.state.dashboardIsOpen = false
  this.state.dashboard = null

  if (this.state.panelIndex < 0 && this.state.lastPanelIndex >= 0) {
    this.state.panelIndex = this.state.lastPanelIndex
    return
  }

  let currentPanel = this.state.panels[this.state.panelIndex]
  if (currentPanel && currentPanel.inactive) {
    this.actions.switchToNeighbourPanel()
  }
}

export default {
  openDashboard,
  closeDashboard,
}