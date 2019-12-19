import CommonActions from '../../actions/panels'

async function movePanel(id, step) {
  let index = this.state.panels.findIndex(p => p.id === id)
  if (index === -1) return
  if (index + step < 0) return
  if (index + step >= this.state.panels.length) return

  let panel = this.state.panels.splice(index, 1)[0]
  this.state.panels.splice(index + step, 0, panel)
  this.state.panelIndex = index + step
  for (let i = 0; i < this.state.panels.length; i++) {
    this.state.panels[i].index = i
  }

  this.actions.savePanels()

  let windows = await browser.windows.getAll()
  for (let window of windows) {
    browser.runtime.sendMessage({
      instanceType: 'sidebar',
      windowId: window.id,
      action: 'loadTabs',
    })
  }
}

export default {
  ...CommonActions,

  movePanel,
}
