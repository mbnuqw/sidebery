import Actions from '../actions.js'

async function loadPanels() {
  let { panels } = await browser.storage.local.get({ panels: null })
  if (!panels) {
    let output = await browser.storage.local.get({ containers: null })
    panels = output.containers || []
  }
  this.panels = panels

  Actions.updateReqHandler()
}

function updatePanels(newPanels) {
  if (!newPanels) return

  for (let panel of this.panels) {
    const newPanel = newPanels.find(nc => nc.id === panel.id)
    if (!newPanel) continue

    panel.lockedTabs = newPanel.lockedTabs
    panel.lockedPanel = newPanel.lockedPanel
    panel.proxy = newPanel.proxy
    panel.proxified = newPanel.proxified
    panel.noEmpty = newPanel.noEmpty
    panel.includeHostsActive = newPanel.includeHostsActive
    panel.includeHosts = newPanel.includeHosts
    panel.excludeHostsActive = newPanel.excludeHostsActive
    panel.excludeHosts = newPanel.excludeHosts
    panel.lastActiveTab = newPanel.lastActiveTab
  }

  Actions.updateReqHandlerDebounced()
}

export default {
  loadPanels,
  updatePanels,
}