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
  this.panels = newPanels
  Actions.updateReqHandlerDebounced()
}

function savePanels(panels, delay = 500) {
  if (this._savePanelsTimeout) clearTimeout(this._savePanelsTimeout)
  this._savePanelsTimeout = setTimeout(() => {
    browser.storage.local.set({ panels })
  }, delay)
}

export default {
  loadPanels,
  updatePanels,
  savePanels,
}