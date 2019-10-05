import Vue from 'vue'
import Utils from '../../utils'
import { DEFAULT_CTX_TABS_PANEL } from '../../defaults'

/**
 * contextualIdentities.onCreated
 */
function onCreatedContainer({ contextualIdentity }) {
  const panel = Utils.cloneObject(DEFAULT_CTX_TABS_PANEL)
  panel.cookieStoreId = contextualIdentity.cookieStoreId
  panel.name = contextualIdentity.name
  panel.color = contextualIdentity.color
  panel.icon = contextualIdentity.icon

  panel.index = this.state.panels.length

  this.state.containers.push(contextualIdentity)
  this.state.panels.push(panel)
  this.state.panelsMap[panel.cookieStoreId] = panel

  if (this.state.windowFocused) {
    this.state.panelIndex = this.state.panels.length - 1
    this.state.lastPanelIndex = this.state.panelIndex
  }

  this.actions.savePanels()

  // Update panels ranges
  this.actions.updatePanelsRanges()
}

/**
 * contextualIdentities.onRemoved
 */
async function onRemovedContainer({ contextualIdentity }) {
  let id = contextualIdentity.cookieStoreId

  // Find container
  let ctxIndex = this.state.containers.findIndex(c => c.cookieStoreId === id)
  let ctrIndex = this.state.panels.findIndex(c => c.cookieStoreId === id)
  if (ctxIndex === -1 || ctrIndex === -1) return
  this.state.panels[ctrIndex].noEmpty = false

  // Close tabs
  const orphanTabs = this.state.tabs.filter(t => t.cookieStoreId === id)
  this.state.removingTabs = orphanTabs.map(t => t.id)
  await browser.tabs.remove([...this.state.removingTabs])

  // Remove container
  this.state.containers.splice(ctxIndex, 1)
  this.state.panels.splice(ctrIndex, 1)
  Vue.delete(this.state.panelsMap, id)

  // Switch to prev panel
  if (this.state.panelIndex >= this.state.panels.length) {
    this.state.panelIndex = this.state.panels.length - 1
    this.state.lastPanelIndex = this.state.panelIndex
  }

  this.actions.savePanels()

  // Update panels ranges
  this.actions.updatePanelsRanges()
}

/**
 * contextualIdentities.onUpdated
 */
function onUpdatedContainer({ contextualIdentity }) {
  let id = contextualIdentity.cookieStoreId
  let ctxIndex = this.state.containers.findIndex(c => c.cookieStoreId === id)
  let panelIndex = this.state.panels.findIndex(c => c.cookieStoreId === id)
  if (ctxIndex === -1 || panelIndex === -1) return

  this.state.containers.splice(ctxIndex, 1, contextualIdentity)
  this.state.panels[panelIndex].color = contextualIdentity.color
  this.state.panels[panelIndex].icon = contextualIdentity.icon
  this.state.panels[panelIndex].name = contextualIdentity.name

  this.actions.savePanels()
}

/**
 * Setup listeners
 */
function setupContainersListeners() {
  browser.contextualIdentities.onCreated.addListener(this.handlers.onCreatedContainer)
  browser.contextualIdentities.onRemoved.addListener(this.handlers.onRemovedContainer)
  browser.contextualIdentities.onUpdated.addListener(this.handlers.onUpdatedContainer)
}

/**
 * Setup listeners
 */
function resetContainersListeners() {
  browser.contextualIdentities.onCreated.removeListener(this.handlers.onCreatedContainer)
  browser.contextualIdentities.onRemoved.removeListener(this.handlers.onRemovedContainer)
  browser.contextualIdentities.onUpdated.removeListener(this.handlers.onUpdatedContainer)
}

export default {
  onCreatedContainer,
  onRemovedContainer,
  onUpdatedContainer,
  setupContainersListeners,
  resetContainersListeners,
}