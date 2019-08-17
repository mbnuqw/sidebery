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

export default {
  loadPanels,
  updatePanels,
}